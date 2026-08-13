'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
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
import type { DeploymentWithRelations } from '@/lib/repository';
import { Badge } from '../ui/badge';
import Link from 'next/link';
import { cn } from '@/lib/utils';

function SortHeader({ column, label }: { column: any; label: string }) {
    return (
        <button
            className="flex items-center gap-1 hover:text-foreground transition-colors group"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
            {label}
            <ArrowUpDown className="h-3 w-3 opacity-40 group-hover:opacity-80 transition-opacity" />
        </button>
    );
}

export const columns: ColumnDef<DeploymentWithRelations>[] = [
    {
        accessorKey: 'fecha',
        header: ({ column }) => <SortHeader column={column} label="Fecha" />,
        cell: ({ row }) => {
            const date = new Date(row.getValue('fecha'));
            return (
                <div className="tabular-nums">
                    <p className="font-medium text-sm">{date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
            );
        },
    },
    {
        accessorKey: 'programa.nombre',
        header: ({ column }) => <SortHeader column={column} label="Programa" />,
        cell: ({ row }) => (
            <span className="font-semibold text-sm">{row.original.programa.nombre}</span>
        ),
    },
    {
        accessorKey: 'entorno',
        header: 'Entorno',
        cell: ({ row }) => {
            const entorno = row.getValue('entorno') as string;
            const isProd = entorno === 'Producción';
            return (
                <Badge
                    variant="outline"
                    className={cn(
                        'text-xs font-medium',
                        isProd
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                    )}
                >
                    {isProd ? '● Prod' : '○ Preprod'}
                </Badge>
            );
        },
    },
    {
        accessorKey: 'version',
        header: 'Versión',
        cell: ({ row }) => (
            <span className="font-mono text-xs font-bold bg-muted px-1.5 py-0.5 rounded">
                v{row.getValue('version')}
            </span>
        ),
    },
    {
        accessorKey: 'plataforma',
        header: 'Plataforma',
        cell: ({ row }) => {
            const plataforma = row.getValue('plataforma') as string;
            if (!plataforma) return <span className="text-muted-foreground">—</span>;
            return <Badge variant="outline" className="text-xs">{plataforma}</Badge>;
        },
    },
    {
        accessorKey: 'responsable.nombre',
        header: ({ column }) => <SortHeader column={column} label="Responsable" />,
        cell: ({ row }) => (
            <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold flex-shrink-0">
                    {row.original.responsable.nombre.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm">{row.original.responsable.nombre}</span>
            </div>
        ),
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            const deployment = row.original;
            return (
                <div className="flex justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 opacity-50 hover:opacity-100 transition-opacity">
                                <span className="sr-only">Acciones</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel className="text-xs text-muted-foreground">
                                {deployment.programa.nombre}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <Link href={`/deployments/${deployment.id}/edit`}>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    Editar
                                </DropdownMenuItem>
                            </Link>
                            <DropdownMenuSeparator />
                            <DeleteDialog deploymentId={deployment.id}>
                                <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                >
                                    Eliminar
                                </DropdownMenuItem>
                            </DeleteDialog>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            );
        },
    },
];
