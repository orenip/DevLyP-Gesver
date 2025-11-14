import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DataTable } from '@/components/deployments/data-table';
import { columns } from '@/components/deployments/columns';
import { Button } from '../ui/button';
import { PlusCircle } from 'lucide-react';
import { Filters } from './filters';
import { repository } from '@/lib/repository';
import { Suspense } from 'react';
import Link from 'next/link';
import { ExportButton } from './export-button';
import { LoadingSpinner } from '../loading-spinner';

interface DeploymentsTableProps {
  query: string;
  entorno: string;
  programaId?: string;
  responsableId?: string;
}

export function DeploymentsTable({ query, entorno, programaId, responsableId }: DeploymentsTableProps) {
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
            <Suspense fallback={null}>
              <ExportButtonWrapper
                  query={query}
                  entorno={entorno}
                  programaId={programaId}
                  responsableId={responsableId}
                />
            </Suspense>
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
        <Suspense fallback={null}>
          <FiltersWrapper />
        </Suspense>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<LoadingSpinner />}>
          <DeploymentsData
            query={query}
            entorno={entorno}
            programaId={programaId}
            responsableId={responsableId}
          />
        </Suspense>
      </CardContent>
    </Card>
  );
}

async function FiltersWrapper() {
  const [programs, responsibles] = await Promise.all([
    repository.getPrograms(),
    repository.getResponsibles(),
  ]);
  return <Filters programs={programs} responsibles={responsibles} />;
}

async function ExportButtonWrapper(props: DeploymentsTableProps) {
  const deployments = await repository.getFilteredDeployments(props.query, props.entorno, props.programaId, props.responsableId);
  return <ExportButton deployments={deployments} />;
}

async function DeploymentsData({ query, entorno, programaId, responsableId }: DeploymentsTableProps) {
  const deployments = await repository.getFilteredDeployments(query, entorno, programaId, responsableId);
  return <DataTable columns={columns} data={deployments} />;
}
