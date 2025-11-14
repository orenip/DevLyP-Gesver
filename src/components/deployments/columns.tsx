'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeploymentSheet } from './deployment-sheet';
import { DeleteDialog } from './delete-dialog';
import { DeploymentWithRelations } from '@/lib/data';


export const columns: ColumnDef<DeploymentWithRelations>[] = [
  {
    accessorKey: 'fecha',
    header: 'Fecha',
    cell: ({ row }) => new Date(row.getValue('fecha')).toLocaleDateString(),
  },
  {
    accessorKey: 'programa.nombre',
    header: 'Programa',
  },
  {
    accessorKey: 'entorno',
    header: 'Entorno',
  },
  {
    accessorKey: 'version',
    header: 'Versión',
  },
  {
    accessorKey: 'responsable.nombre',
    header: 'Responsable',
  },
  {
    accessorKey: 'accion',
    header: 'Acción',
  },
  {
    accessorKey: 'comentario',
    header: 'Comentario',
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const deployment = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DeploymentSheet deployment={deployment}>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Editar</DropdownMenuItem>
            </DeploymentSheet>
            <DropdownMenuSeparator />
            <DeleteDialog deploymentId={deployment.id}>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">Eliminar</DropdownMenuItem>
            </DeleteDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
