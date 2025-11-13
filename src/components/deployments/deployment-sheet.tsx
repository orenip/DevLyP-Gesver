'use client';

import React, { useEffect, useState } from 'react';
import { useFormState, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Despliegue,
  deploymentSchema,
  Entorno,
  EntornoLabel,
  Programa,
  Responsable,
} from '@/lib/definitions';
import { createOrUpdateDeployment } from '@/lib/actions';
import { CalendarIcon, Plus } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { CreatableCombobox } from '../creatable-combobox';

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormState();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Despliegue'}
    </Button>
  );
}

export function DeploymentSheet({ deployment, programs, responsibles }: { deployment?: Despliegue, programs: Programa[], responsibles: Responsable[] }) {
  const isEditing = !!deployment;
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  const [state, formAction] = useFormState(createOrUpdateDeployment, undefined);

  const form = useForm({
    resolver: zodResolver(deploymentSchema),
    defaultValues: {
      id: deployment?.id,
      fecha: deployment?.fecha ? new Date(deployment.fecha) : new Date(),
      programa: deployment?.programa.nombre || '',
      entorno: deployment?.entorno || undefined,
      version: deployment?.version || '',
      accion: deployment?.accion || '',
      responsable: deployment?.responsable.nombre || '',
      comentario: deployment?.comentario || '',
    },
  });

  useEffect(() => {
    if (state?.message) {
      if(state.errors) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: state.message,
        });
      } else {
        toast({
          title: 'Éxito',
          description: state.message,
        });
        setOpen(false);
        form.reset();
      }
    }
  }, [state, toast, form]);

  useEffect(() => {
    if (open) {
        if (deployment) {
            form.reset({
                id: deployment.id,
                fecha: new Date(deployment.fecha),
                programa: deployment.programa.nombre,
                entorno: deployment.entorno,
                version: deployment.version,
                accion: deployment.accion || '',
                responsable: deployment.responsable.nombre,
                comentario: deployment.comentario || '',
            });
        } else {
            form.reset({
                fecha: new Date(),
                programa: '',
                entorno: undefined,
                version: '',
                accion: '',
                responsable: '',
                comentario: '',
            });
        }
    }
  }, [open, deployment, form]);


  const triggerButton = isEditing ? (
    <Button variant="outline" size="sm">Editar</Button>
  ) : (
    <Button>
      <Plus className="mr-2 h-4 w-4" /> Nuevo Despliegue
    </Button>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger>
        {triggerButton}
      </SheetTrigger>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Editar Despliegue' : 'Añadir Nuevo Despliegue'}</SheetTitle>
          <SheetDescription>
            {isEditing ? 'Modifique los detalles del despliegue.' : 'Complete el formulario para registrar un nuevo despliegue.'}
          </SheetDescription>
        </SheetHeader>
        <form action={formAction} className="space-y-4 py-4">
            <input type="hidden" {...form.register('id')} />
            
            <div>
              <Label htmlFor="fecha">Fecha</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !form.watch('fecha') && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.watch('fecha') ? formatDate(form.watch('fecha')) : <span>Seleccione una fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={form.watch('fecha')}
                    onSelect={(date) => form.setValue('fecha', date || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <input type="hidden" {...form.register('fecha')} value={form.watch('fecha')?.toISOString()} />
              {state?.errors?.fecha && <p className="text-sm text-destructive mt-1">{state.errors.fecha[0]}</p>}
            </div>

            <div>
              <Label htmlFor="programa">Programa</Label>
              <CreatableCombobox
                items={programs.map(p => ({ value: p.nombre, label: p.nombre }))}
                value={form.watch('programa')}
                onChange={(value) => form.setValue('programa', value)}
                placeholder="Seleccione o cree un programa"
                searchPlaceholder="Buscar programa..."
                emptyMessage="No se encontró el programa."
                createLabel="Crear"
              />
              <input type="hidden" {...form.register('programa')} />
              {state?.errors?.programa && <p className="text-sm text-destructive mt-1">{state.errors.programa[0]}</p>}
            </div>
            
            <div>
              <Label htmlFor="entorno">Entorno</Label>
              <Select onValueChange={(value) => form.setValue('entorno', value as Entorno)} defaultValue={form.watch('entorno')}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un entorno" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(Entorno).map((e) => (
                    <SelectItem key={e} value={e}>{EntornoLabel[e]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
               {state?.errors?.entorno && <p className="text-sm text-destructive mt-1">{state.errors.entorno[0]}</p>}
            </div>

            <div>
              <Label htmlFor="version">Versión</Label>
              <Input id="version" {...form.register('version')} />
              {state?.errors?.version && <p className="text-sm text-destructive mt-1">{state.errors.version[0]}</p>}
            </div>

            <div>
              <Label htmlFor="accion">Acción</Label>
              <Input id="accion" {...form.register('accion')} />
            </div>

            <div>
              <Label htmlFor="responsable">Responsable</Label>
               <CreatableCombobox
                items={responsibles.map(r => ({ value: r.nombre, label: r.nombre }))}
                value={form.watch('responsable')}
                onChange={(value) => form.setValue('responsable', value)}
                placeholder="Seleccione o cree un responsable"
                searchPlaceholder="Buscar responsable..."
                emptyMessage="No se encontró el responsable."
                createLabel="Crear"
              />
              <input type="hidden" {...form.register('responsable')} />
              {state?.errors?.responsable && <p className="text-sm text-destructive mt-1">{state.errors.responsable[0]}</p>}
            </div>

            <div>
              <Label htmlFor="comentario">Motivo o Comentario</Label>
              <Textarea id="comentario" {...form.register('comentario')} />
            </div>

            <SheetFooter>
                <SheetClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                </SheetClose>
                <SubmitButton isEditing={isEditing} />
            </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
