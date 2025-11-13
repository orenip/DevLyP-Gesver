'use client';

import * as React from 'react';
import { useFormState } from 'react-hook-form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { AdminFormState } from '@/lib/definitions';
import { Plus } from 'lucide-react';

interface Item {
  id: number;
  nombre: string;
}

interface ManagerTableProps {
  title: string;
  items: Item[];
  createOrUpdateAction: (prevState: any, formData: FormData) => Promise<AdminFormState>;
  deleteAction: (id: number) => Promise<{ success: boolean; message: string }>;
}

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormState();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Guardando...' : isEditing ? 'Guardar' : 'Crear'}
    </Button>
  );
}

function EditDialog({ item, action, children, singularTitle }: { item?: Item; action: any; children: React.ReactNode; singularTitle: string; }) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();
  const formRef = React.useRef<HTMLFormElement>(null);

  const [state, dispatch] = useFormState(action, undefined);
  
  React.useEffect(() => {
    if(state?.message) {
      if(state.errors) {
        toast({ variant: 'destructive', title: 'Error', description: state.message });
      } else {
        toast({ title: 'Éxito', description: state.message });
        setOpen(false);
        formRef.current?.reset();
      }
    }
  }, [state, toast]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? 'Editar' : 'Crear'} {singularTitle}</DialogTitle>
          <DialogDescription>
            {item ? 'Modifique el nombre.' : `Añada un nuevo ${singularTitle.toLowerCase()}.`}
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={dispatch} className="space-y-4">
          <input type="hidden" name="id" defaultValue={item?.id} />
          <div>
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" name="nombre" defaultValue={item?.nombre} />
             {state?.errors?.nombre && <p className="text-sm text-destructive mt-1">{state.errors.nombre[0]}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <SubmitButton isEditing={!!item} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ManagerTable({ title, items, createOrUpdateAction, deleteAction }: ManagerTableProps) {
  const { toast } = useToast();
  const singularTitle = title.endsWith('s') ? title.slice(0, -1) : title;

  const handleDelete = async (id: number) => {
    const result = await deleteAction(id);
    if (result.success) {
      toast({ title: 'Éxito', description: result.message });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.message });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <EditDialog action={createOrUpdateAction} singularTitle={singularTitle}>
            <Button size="sm"><Plus className="mr-2 h-4 w-4"/>Añadir</Button>
        </EditDialog>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length > 0 ? (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.nombre}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <EditDialog item={item} action={createOrUpdateAction} singularTitle={singularTitle}>
                           <Button variant="outline" size="sm">Editar</Button>
                        </EditDialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" >Eliminar</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                              <AlertDialogDescription>Esta acción no se puede deshacer y eliminará los despliegues asociados.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center">No hay elementos.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
