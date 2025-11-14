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
import { fetchFilteredDeployments, fetchPrograms, fetchResponsibles } from '@/lib/data';
import { Suspense } from 'react';
import { TableSkeleton } from '../skeletons';
import Link from 'next/link';

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
          <Link href="/deployments/new">
            <Button size="sm" className="gap-1 w-full sm:w-auto">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Añadir Despliegue
              </span>
            </Button>
          </Link>
        </div>
        <Suspense fallback={null}>
          <FiltersWrapper />
        </Suspense>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<TableSkeleton />}>
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
    fetchPrograms(),
    fetchResponsibles(),
  ]);
  return <Filters programs={programs} responsibles={responsibles} />;
}

async function DeploymentsData({ query, entorno, programaId, responsableId }: DeploymentsTableProps) {
  const deployments = await fetchFilteredDeployments(query, entorno, programaId, responsableId);
  return <DataTable columns={columns} data={deployments} />;
}
