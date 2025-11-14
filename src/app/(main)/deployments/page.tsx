import { DeploymentsTable } from '@/components/deployments/deployments-table';

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
    <DeploymentsTable
      query={query}
      entorno={entorno}
      programaId={programaId}
      responsableId={responsableId}
    />
  );
}
