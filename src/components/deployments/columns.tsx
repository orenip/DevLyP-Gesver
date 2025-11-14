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
import { DeleteDialog } from './delete-dialog';
import { DeploymentWithRelations } from '@/lib/data';
import { Badge } from '../ui/badge';
import Link from 'next/link';


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
    cell: ({ row }) => {
      const entorno = row.getValue('entorno') as string;
      const variant = entorno === 'Producción' ? 'default' : 'secondary';
      return <Badge variant={variant}>{entorno}</Badge>
    }
  },
  {
    accessorKey: 'version',
    header: 'Versión',
  },
  {
    accessorKey: 'plataforma',
    header: 'Plataforma',
    cell: ({ row }) => {
      const plataforma = row.getValue('plataforma') as string;
      if (!plataforma) return '-';
      return <Badge variant="outline">{plataforma}</Badge>
    }
  },
  {
    accessorKey: 'responsable.nombre',
    header: 'Responsable',
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const deployment = row.original;

      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <Link href={`/deployments/${deployment.id}/edit`}>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Editar</DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DeleteDialog deploymentId={deployment.id}>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-600 focus:bg-red-50">Eliminar</DropdownMenuItem>
              </DeleteDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];