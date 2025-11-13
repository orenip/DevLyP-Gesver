import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DataTable } from '@/components/deployments/data-table';
import { columns, Deployment } from '@/components/deployments/columns';
import { DeploymentSheet } from './deployment-sheet';
import { Button } from '../ui/button';
import { PlusCircle } from 'lucide-react';
import { Filters } from './filters';
import { Programa, Responsable } from '@prisma/client';

interface DeploymentsTableProps {
  deployments: Deployment[];
  programs: Programa[];
  responsibles: Responsable[];
}

export function DeploymentsTable({ deployments, programs, responsibles }: DeploymentsTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Despliegues</CardTitle>
            <CardDescription>
              Gestiona los despliegues de tus aplicaciones.
            </CardDescription>
          </div>
          <DeploymentSheet>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Añadir Despliegue
              </span>
            </Button>
          </DeploymentSheet>
        </div>
        <Filters programs={programs} responsibles={responsibles} />
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={deployments} />
      </CardContent>
    </Card>
  );
}
