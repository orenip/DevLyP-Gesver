import { DeploymentsTable } from '@/components/deployments/deployments-table';
import { TableSkeleton } from '@/components/skeletons';
import { fetchFilteredDeployments, fetchPrograms, fetchResponsibles } from '@/lib/data';
import { Suspense } from 'react';

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

  const deployments = await fetchFilteredDeployments(query, entorno, programaId, responsableId);
  const programs = await fetchPrograms();
  const responsibles = await fetchResponsibles();

  return (
    <Suspense fallback={<TableSkeleton />}>
      <DeploymentsTable
        deployments={deployments}
        programs={programs}
        responsibles={responsibles}
      />
    </Suspense>
  );
}
