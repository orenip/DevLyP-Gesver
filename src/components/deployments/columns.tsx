'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Despliegue, EntornoLabel, Programa, Responsable } from '@/lib/definitions';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '../ui/button';
import { DeploymentSheet } from './deployment-sheet';
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
import { deleteDeployment } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

function RowActions({ row, programs, responsibles }: { row: { original: Despliegue }, programs: Programa[], responsibles: Responsable[] }) {
  const { toast } = useToast();
  const deployment = row.original;

  const handleDelete = async () => {
    const result = await deleteDeployment(deployment.id);
    if (result.success) {
      toast({
        title: 'Éxito',
        description: 'Despliegue eliminado correctamente.',
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.message,
      });
    }
  };

  return (
    <div className="flex gap-2 justify-end">
      <DeploymentSheet deployment={deployment} programs={programs} responsibles={responsibles} />
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm">Eliminar</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente el registro de despliegue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


export const getColumns = (programs: Programa[], responsibles: Responsable[]): ColumnDef<Despliegue>[] => [
  {
    accessorKey: 'fecha',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Fecha
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => formatDate(row.getValue('fecha')),
  },
  {
    accessorKey: 'programa.nombre',
    header: 'Programa',
  },
  {
    accessorKey: 'entorno',
    header: 'Entorno',
    cell: ({ row }) => {
      const entorno = row.getValue('entorno') as keyof typeof EntornoLabel;
      const variant =
        entorno === 'Produccion' ? 'destructive' : 'secondary';
      return <Badge variant={variant}>{EntornoLabel[entorno]}</Badge>;
    },
  },
  {
    accessorKey: 'version',
    header: 'Versión',
  },
  {
    accessorKey: 'accion',
    header: 'Acción',
  },
  {
    accessorKey: 'responsable.nombre',
    header: 'Responsable',
  },
  {
    accessorKey: 'comentario',
    header: 'Comentario',
    cell: ({ row }) => <div className="max-w-[200px] truncate">{row.getValue('comentario')}</div>,
  },
  {
    id: 'actions',
    cell: ({ row }) => <RowActions row={row} programs={programs} responsibles={responsibles} />,
  },
];
