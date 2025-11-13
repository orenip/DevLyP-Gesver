import { fetchFilteredDeployments, fetchPrograms, fetchResponsibles } from '@/lib/data';
import { DeploymentsTable } from '@/components/deployments/deployments-table';
import type { SearchParams } from '@/lib/definitions';

export default async function DeploymentsPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const query = searchParams?.query || '';
  const entorno = searchParams?.entorno || '';
  const programaId = searchParams?.programaId || '';
  const responsableId = searchParams?.responsableId || '';

  const [deployments, programs, responsibles] = await Promise.all([
    fetchFilteredDeployments(query, entorno, programaId, responsableId),
    fetchPrograms(),
    fetchResponsibles(),
  ]);

  return (
    <DeploymentsTable
      deployments={deployments}
      programs={programs}
      responsibles={responsibles}
    />
  );
}
