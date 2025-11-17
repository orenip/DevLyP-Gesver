
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
import { useEffect, useState } from 'react';
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
import type { DeploymentWithRelations, Plataforma, Programa, Responsable } from '@/lib/repository';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useRouter } from 'next/navigation';
import { Switch } from '../ui/switch';
import { Skeleton } from '../ui/skeleton';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';

const FormSchema = z.object({
  fecha: z.date({ required_error: 'La fecha es obligatoria.' }),
  programa: z.string().min(1, 'Programa no puede estar vacío.'),
  responsable: z.string().min(1, 'Responsable no puede estar vacío.'),
  entorno: z.enum(['Preproducción', 'Producción']),
  plataforma: z.string().min(1, 'Plataforma no puede estar vacía.'),
  version: z.string().min(1, 'Versión no puede estar vacía.'),
  accion: z.string().optional(),
  comentario: z.string().optional(),
  hasSwagger: z.boolean().default(false),
  url: z.string().optional(),
  port: z.string().optional(),
});

type DeploymentFormValues = z.infer<typeof FormSchema>;

interface DeploymentSheetProps {
  deployment?: DeploymentWithRelations;
}

export function DeploymentForm({ deployment }: DeploymentSheetProps) {
  const { toast } = useToast();
  const [programs, setPrograms] = useState<Programa[]>([]);
  const [responsibles, setResponsibles] = useState<Responsable[]>([]);
  const [platforms, setPlatforms] = useState<Plataforma[]>([]);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues: Partial<DeploymentFormValues> = deployment ? {
      ...deployment,
      fecha: deployment.fecha ? new Date(deployment.fecha) : new Date(),
      programa: deployment.programa.nombre,
      responsable: deployment.responsable.nombre,
      hasSwagger: deployment.hasSwagger || false,
  } : {
      fecha: new Date(),
      entorno: 'Preproducción',
      hasSwagger: false,
      accion: '',
      comentario: '',
      url: '',
      port: '',
  };

  const form = useForm<DeploymentFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues,
    mode: 'onChange',
  });

  useEffect(() => {
    async function fetchData() {
        setIsLoading(true);
        try {
            const [progRes, respRes, platRes] = await Promise.all([
                fetch('/api/programas'),
                fetch('/api/responsables'),
                fetch('/api/plataformas'),
            ]);
            if (progRes.ok) setPrograms(await progRes.json());
            if (respRes.ok) setResponsibles(await respRes.json());
            if (platRes.ok) setPlatforms(await platRes.json());
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error de carga',
                description: 'No se pudieron cargar los datos necesarios para el formulario.'
            })
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [toast]);

  const onSubmit = async (data: DeploymentFormValues) => {
    setIsSubmitting(true);
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        if (key === 'fecha' && value instanceof Date) {
            formData.append(key, value.toISOString());
        } else if (typeof value === 'boolean') {
            formData.append(key, value ? 'on' : 'off');
        } else if (value != null) {
            formData.append(key, String(value));
        }
    });

    const result = deployment
      ? await updateDeployment(deployment.id, formData)
      : await saveDeployment(formData);
    
    setIsSubmitting(false);

    if (result?.message) {
        toast({
            title: deployment ? 'Despliegue Actualizado' : 'Despliegue Creado',
            description: result.message,
        });
        router.push('/deployments');
    } else if (result?.errors) {
        toast({
            variant: "destructive",
            title: 'Error de validación del servidor',
            description: Object.values(result.errors).flat().join('\n'),
        })
    }
  };

  const programOptions = programs.map(p => ({ value: p.nombre, label: p.nombre }));
  const responsibleOptions = responsibles.map(r => ({ value: r.nombre, label: r.nombre }));
  const platformOptions = platforms.map(p => ({ value: p.nombre, label: p.nombre }));
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
            <Form {...form}>
                <form id="deployment-form" onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="fecha"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                <FormLabel>Fecha</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        initialFocus
                                    />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                       
                        <FormField
                            control={form.control}
                            name="programa"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                <FormLabel>Programa</FormLabel>
                                <FormControl>
                                    <CreatableCombobox 
                                        options={programOptions} 
                                        placeholder="Selecciona o crea un programa..." 
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="entorno"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                <FormLabel>Entorno</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona un entorno" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="Preproducción">Preproducción</SelectItem>
                                        <SelectItem value="Producción">Producción</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="plataforma"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                <FormLabel>Plataforma</FormLabel>
                                <FormControl>
                                    <CreatableCombobox 
                                        options={platformOptions} 
                                        placeholder="Selecciona o crea una plataforma..." 
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="version"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                <FormLabel>Versión</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="accion"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                <FormLabel>Acción</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="md:col-span-2">
                            <FormField
                                control={form.control}
                                name="responsable"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                    <FormLabel>Responsable</FormLabel>
                                    <FormControl>
                                        <CreatableCombobox 
                                            options={responsibleOptions} 
                                            placeholder="Selecciona o crea responsable..."
                                            value={field.value}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <FormField
                                control={form.control}
                                name="comentario"
                                render={({ field }) => (
                                    <FormItem className="space-y-2">
                                    <FormLabel>Comentario</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                         <FormField
                            control={form.control}
                            name="url"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                <FormLabel>URL de Acceso</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://miapi.com" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="port"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                <FormLabel>Puerto</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="8080" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="hasSwagger"
                            render={({ field }) => (
                                <FormItem className="space-y-2 flex items-center gap-2 pt-6">
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <FormLabel htmlFor="has-swagger" className="font-normal !mt-0">¿Tiene Swagger?</FormLabel>
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={!form.formState.isValid || isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </div>
                </form>
            </Form>
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
