import { DeploymentsTable } from '@/components/deployments/deployments-table';
import { SummaryView } from '@/components/deployments/summary-view';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Suspense } from 'react';
import { TableSkeleton } from '@/components/skeletons';
import { fetchFilteredDeployments, fetchPrograms, fetchResponsibles, fetchSummary } from '@/lib/data';

export default async function Home({
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
  const summary = await fetchSummary();
  const programs = await fetchPrograms();
  const responsibles = await fetchResponsibles();

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Versiones</CardTitle>
            </CardHeader>
            <CardContent>
              <SummaryView summary={summary} />
            </CardContent>
          </Card>
        </div>
        <Suspense fallback={<TableSkeleton />}>
           <DeploymentsTable 
            deployments={deployments} 
            programs={programs}
            responsibles={responsibles}
          />
        </Suspense>
      </main>
    </div>
  );
}
