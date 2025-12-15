import { DeploymentsTable } from '@/components/deployments/deployments-table';
import { DeploymentsTableSkeleton } from '@/components/skeletons';
import { repository } from '@/lib/repository';
import { Suspense } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default async function DeploymentsPage({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    entorno?: string;
    programaId?: string;
    responsableId?: string;
  };
}) {
  const query = searchParams?.query || '';
  const entorno = searchParams?.entorno || '';
  const programaId = searchParams?.programaId;
  const responsableId = searchParams?.responsableId;

  try {
    const [programs, responsibles, deployments] = await Promise.all([
      repository.getPrograms(),
      repository.getResponsibles(),
      repository.getFilteredDeployments(query, entorno, programaId, responsableId),
    ]);

    return (
      <Suspense fallback={<DeploymentsTableSkeleton />}>
        <DeploymentsTable
          programs={programs}
          responsibles={responsibles}
          deployments={deployments}
        />
      </Suspense>
    );
  } catch (error) {
    console.error('Failed to load deployments page data:', error);
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>
            Ha ocurrido un error al cargar los datos de los despliegues.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Por favor, comprueba la conexión con la base de datos e inténtalo de nuevo más tarde.</p>
        </CardContent>
      </Card>
    );
  }
}
