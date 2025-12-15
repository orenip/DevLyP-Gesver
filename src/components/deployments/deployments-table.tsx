import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '../ui/button';
import { PlusCircle } from 'lucide-react';
import { Filters } from './filters';
import Link from 'next/link';
import { ExportButton } from './export-button';
import { DataTable } from './data-table';
import { columns } from './columns';
import type { DeploymentWithRelations, Programa, Responsable } from '@/lib/repository';

interface DeploymentsTableProps {
  programs: Programa[];
  responsibles: Responsable[];
  deployments: DeploymentWithRelations[];
}

export function DeploymentsTable({ programs, responsibles, deployments }: DeploymentsTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Despliegues</CardTitle>
            <CardDescription>
              Gestiona los despliegues de tus aplicaciones.
            </CardDescription>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <ExportButton deployments={deployments} />
            <Link href="/deployments/new" className="w-full sm:w-auto">
              <Button size="sm" className="gap-1 w-full">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Añadir Despliegue
                </span>
              </Button>
            </Link>
          </div>
        </div>
        <Filters programs={programs} responsibles={responsibles} />
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={deployments} />
      </CardContent>
    </Card>
  );
}
