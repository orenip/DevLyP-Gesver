'use client';

import { Button } from '@/components/ui/button';
import {
  Sheet,
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
import { CreatableCombobox } from '../ui/creatable-combobox';
import { useToast } from '@/hooks/use-toast';
import { DeploymentWithRelations, Programa, Responsable } from '@/lib/data';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { ScrollArea } from '../ui/scroll-area';


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
    async function fetchData() {
        const [progRes, respRes] = await Promise.all([
            fetch('/api/programas'),
            fetch('/api/responsables'),
        ]);
        if (progRes.ok) setPrograms(await progRes.json());
        if (respRes.ok) setResponsibles(await respRes.json());
    }
    if (open) {
        fetchData();
    }
  }, [open]);

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
      <SheetContent className="sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle>{deployment ? 'Editar' : 'Añadir'} Despliegue</SheetTitle>
          <SheetDescription>
            {deployment ? 'Edita los detalles del despliegue.' : 'Añade un nuevo despliegue a la lista.'}
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-grow pr-6">
            <form id="deployment-form" action={action} className="grid gap-4 py-4">
                <div className="space-y-2">
                <Label htmlFor="fecha">Fecha</Label>
                <DatePicker defaultValue={deployment?.fecha ? new Date(deployment.fecha) : undefined} />
                </div>
                <div className="space-y-2">
                <Label htmlFor="programa">Programa</Label>
                <CreatableCombobox name="programa" options={programOptions} defaultValue={deployment?.programa.nombre} placeholder="Selecciona o crea un programa..." />
                </div>
                <div className="space-y-2">
                <Label htmlFor="entorno">Entorno</Label>
                <Select name="entorno" defaultValue={deployment?.entorno}>
                    <SelectTrigger>
                    <SelectValue placeholder="Selecciona un entorno" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="Preproducción">Preproducción</SelectItem>
                    <SelectItem value="Producción">Producción</SelectItem>
                    </SelectContent>
                </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="plataforma">Plataforma</Label>
                    <RadioGroup name="plataforma" defaultValue={deployment?.plataforma || 'IIS'} className="flex items-center gap-4">
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
                <div className="space-y-2">
                <Label htmlFor="version">Versión</Label>
                <Input id="version" name="version" defaultValue={deployment?.version} />
                </div>
                <div className="space-y-2">
                <Label htmlFor="accion">Acción</Label>
                <Input id="accion" name="accion" defaultValue={deployment?.accion || ''} />
                </div>
                <div className="space-y-2">
                <Label htmlFor="responsable">Responsable</Label>
                <CreatableCombobox name="responsable" options={responsibleOptions} defaultValue={deployment?.responsable.nombre} placeholder="Selecciona o crea responsable..." />
                </div>
                <div className="space-y-2">
                <Label htmlFor="comentario">Comentario</Label>
                <Textarea id="comentario" name="comentario" defaultValue={deployment?.comentario || ''} />
                </div>
            </form>
        </ScrollArea>
        <SheetFooter>
            <SubmitButton />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" form="deployment-form" disabled={pending}>
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
              "w-full justify-start text-left font-normal",
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
