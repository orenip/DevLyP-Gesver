import { DeploymentsTable } from '@/components/deployments/deployments-table';
import { LoadingSpinner } from '@/components/loading-spinner';
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
  
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DeploymentsTable
        query={query}
        entorno={entorno}
        programaId={programaId}
        responsableId={responsableId}
      />
    </Suspense>
  );
}
