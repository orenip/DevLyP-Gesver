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
import { repository } from '@/lib/repository';
import Link from 'next/link';
import { ExportButton } from './export-button';
import { DataTable } from './data-table';
import { columns } from './columns';

interface DeploymentsTableProps {
  query: string;
  entorno: string;
  programaId?: string;
  responsableId?: string;
}

export async function DeploymentsTable({ query, entorno, programaId, responsableId }: DeploymentsTableProps) {
  try {
    const [programs, responsibles, deployments] = await Promise.all([
      repository.getPrograms(),
      repository.getResponsibles(),
      repository.getFilteredDeployments(query, entorno, programaId, responsableId),
    ]);

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
  } catch (error) {
    console.error('Failed to load deployments data:', error);
    return (
      <Card>
        <CardHeader>
          <CardTitle>Despliegues</CardTitle>
          <CardDescription>Error</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error al cargar los despliegues. Por favor, revisa los logs del servidor e inténtalo de nuevo más tarde.</p>
        </CardContent>
      </Card>
    );
  }
}
