'use client';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '../ui/textarea';
import { saveDeployment, updateDeployment } from '@/lib/actions';
import { useFormStatus } from 'react-dom';
import { useEffect, useState } from 'react';
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ComboboxInput } from '../ui/combobox';
import { useToast } from '@/hooks/use-toast';
import { DeploymentWithRelations, Programa, Responsable, fetchPrograms, fetchResponsibles } from '@/lib/data';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';


interface DeploymentSheetProps {
  children: React.ReactNode;
  deployment?: DeploymentWithRelations;
}

export function DeploymentSheet({ children, deployment }: DeploymentSheetProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [programs, setPrograms] = useState<Programa[]>([]);
  const [responsibles, setResponsibles] = useState<Responsable[]>([]);

  useEffect(() => {
    fetchPrograms().then(setPrograms);
    fetchResponsibles().then(setResponsibles);
  }, [])

  const action = async (formData: FormData) => {
    const result = deployment
      ? await updateDeployment(deployment.id, formData)
      : await saveDeployment(formData);

    if (result?.message) {
        toast({
            title: deployment ? 'Despliegue Actualizado' : 'Despliegue Creado',
            description: result.message,
        })
    }
    setOpen(false);
  };

  const programOptions = programs.map(p => ({ value: p.nombre, label: p.nombre }));
  const responsibleOptions = responsibles.map(r => ({ value: r.nombre, label: r.nombre }));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{deployment ? 'Editar' : 'Añadir'} Despliegue</SheetTitle>
          <SheetDescription>
            {deployment ? 'Edita los detalles del despliegue.' : 'Añade un nuevo despliegue a la lista.'}
          </SheetDescription>
        </SheetHeader>
        <form action={action}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fecha" className="text-right">
                Fecha
              </Label>
              <DatePicker defaultValue={deployment?.fecha ? new Date(deployment.fecha) : undefined} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="programa" className="text-right">
                Programa
              </Label>
              <ComboboxInput name="programa" options={programOptions} defaultValue={deployment?.programa.nombre} placeholder="Selecciona programa..." />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="entorno" className="text-right">
                Entorno
              </Label>
              <Select name="entorno" defaultValue={deployment?.entorno}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona un entorno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Preproducción">Preproducción</SelectItem>
                  <SelectItem value="Producción">Producción</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="plataforma" className="text-right">
                    Plataforma
                </Label>
                <RadioGroup name="plataforma" defaultValue={deployment?.plataforma || 'IIS'} className="col-span-3 flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="IIS" id="r1" />
                        <Label htmlFor="r1">IIS</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Docker" id="r2" />
                        <Label htmlFor="r2">Docker</Label>
                    </div>
                </RadioGroup>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="version" className="text-right">
                Versión
              </Label>
              <Input id="version" name="version" defaultValue={deployment?.version} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="accion" className="text-right">
                Acción
              </Label>
              <Input id="accion" name="accion" defaultValue={deployment?.accion || ''} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="responsable" className="text-right">
                Responsable
              </Label>
              <ComboboxInput name="responsable" options={responsibleOptions} defaultValue={deployment?.responsable.nombre} placeholder="Selecciona responsable..." />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="comentario" className="text-right">
                Comentario
              </Label>
              <Textarea id="comentario" name="comentario" defaultValue={deployment?.comentario || ''} className="col-span-3" />
            </div>
          </div>
          <SheetFooter>
            <SubmitButton />
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Guardando...' : 'Guardar Cambios'}
    </Button>
  );
}

function DatePicker({ defaultValue }: { defaultValue?: Date }) {
    const [date, setDate] = useState<Date | undefined>(defaultValue || new Date())
   
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "col-span-3 justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            initialFocus
          />
        </PopoverContent>
        <input type="hidden" name="fecha" value={date?.toISOString()} />
      </Popover>
    )
  }
