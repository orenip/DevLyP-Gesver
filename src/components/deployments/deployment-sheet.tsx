'use client';

import { Button } from '@/components/ui/button';
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
import { useEffect, useState, useTransition } from 'react';
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon, ChevronLeft, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CreatableCombobox } from '../ui/creatable-combobox';
import { useToast } from '@/hooks/use-toast';
import { DeploymentWithRelations, Programa, Responsable } from '@/lib/data';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useRouter } from 'next/navigation';
import { Switch } from '../ui/switch';
import { Skeleton } from '../ui/skeleton';


interface DeploymentSheetProps {
  deployment?: DeploymentWithRelations;
}

export function DeploymentForm({ deployment }: DeploymentSheetProps) {
  const { toast } = useToast();
  const [programs, setPrograms] = useState<Programa[]>([]);
  const [responsibles, setResponsibles] = useState<Responsable[]>([]);
  const router = useRouter();
  const [hasSwagger, setHasSwagger] = useState(deployment?.hasSwagger || false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
        setIsLoading(true);
        try {
            const [progRes, respRes] = await Promise.all([
                fetch('/api/programas'),
                fetch('/api/responsables'),
            ]);
            if (progRes.ok) setPrograms(await progRes.json());
            if (respRes.ok) setResponsibles(await respRes.json());
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error de carga',
                description: 'No se pudieron cargar los programas y responsables.'
            })
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [toast]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const result = deployment
      ? await updateDeployment(deployment.id, formData)
      : await saveDeployment(formData);

    if (result?.message) {
        toast({
            title: deployment ? 'Despliegue Actualizado' : 'Despliegue Creado',
            description: result.message,
        });
        router.push('/deployments');
    } else if (result?.errors) {
        toast({
            variant: "destructive",
            title: 'Error de validación',
            description: Object.values(result.errors).flat().join('\n'),
        })
    }
  };

  const programOptions = programs.map(p => ({ value: p.nombre, label: p.nombre }));
  const responsibleOptions = responsibles.map(r => ({ value: r.nombre, label: r.nombre }));
  const title = deployment ? 'Editar Despliegue' : 'Añadir Nuevo Despliegue';

  if (isLoading) {
    return <DeploymentFormSkeleton title={title} />;
  }

  return (
    <Card>
        <CardHeader>
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Atrás</span>
                </Button>
                <CardTitle>{title}</CardTitle>
            </div>
        </CardHeader>
        <CardContent>
            <form id="deployment-form" onSubmit={handleSubmit} className="grid gap-6">
                <div className="grid md:grid-cols-2 gap-6">
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
                        <Select name="entorno" defaultValue={deployment?.entorno || 'Preproducción'}>
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
                        <RadioGroup name="plataforma" defaultValue={deployment?.plataforma || 'IIS'} className="flex items-center gap-4 pt-2">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="IIS" id="r1" />
                                <Label htmlFor="r1" className="font-normal">IIS</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="Docker" id="r2" />
                                <Label htmlFor="r2" className="font-normal">Docker</Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="version">Versión</Label>
                        <Input id="version" name="version" defaultValue={deployment?.version} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="accion">Acción</Label>
                        <Input id="accion" name="accion" defaultValue={deployment?.accion || ''} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="responsable">Responsable</Label>
                        <CreatableCombobox name="responsable" options={responsibleOptions} defaultValue={deployment?.responsable.nombre} placeholder="Selecciona o crea responsable..." />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="comentario">Comentario</Label>
                        <Textarea id="comentario" name="comentario" defaultValue={deployment?.comentario || ''} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="url">URL de Acceso</Label>
                        <Input id="url" name="url" defaultValue={deployment?.url || ''} placeholder="https://miapi.com" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="port">Puerto</Label>
                        <Input id="port" name="port" type="number" defaultValue={deployment?.port || ''} placeholder="8080" />
                    </div>
                    <div className="space-y-2 flex items-center gap-2 pt-6">
                        <Switch id="has-swagger" name="hasSwagger" checked={hasSwagger} onCheckedChange={setHasSwagger} />
                        <Label htmlFor="has-swagger" className="font-normal">¿Tiene Swagger?</Label>
                    </div>
                </div>
                <div className="flex justify-end">
                    <SubmitButton />
                </div>
            </form>
        </CardContent>
    </Card>
  );
}

function DeploymentFormSkeleton({ title }: { title: string }) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-7 w-64" />
                </div>
            </CardHeader>
            <CardContent className="grid gap-6">
                <div className="grid md:grid-cols-2 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ))}
                    <div className="space-y-2 md:col-span-2">
                         <Skeleton className="h-4 w-20" />
                         <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                         <Skeleton className="h-4 w-20" />
                         <Skeleton className="h-20 w-full" />
                    </div>
                     {[...Array(3)].map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ))}
                </div>
                 <div className="flex justify-end">
                    <Skeleton className="h-10 w-32" />
                </div>
            </CardContent>
        </Card>
    );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" form="deployment-form" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {pending ? 'Guardando...' : 'Guardar Cambios'}
    </Button>
  );
}

function DatePicker({ defaultValue }: { defaultValue?: Date }) {
    const [date, setDate] = useState<Date | undefined>(defaultValue || new Date())
   
    return (
      <>
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
        </Popover>
        <input type="hidden" name="fecha" value={date?.toISOString()} />
      </>
    )
  }
