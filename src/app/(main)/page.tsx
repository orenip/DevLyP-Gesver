import { SummaryView } from '@/components/deployments/summary-view';
import { LoadingSpinner } from '@/components/loading-spinner';
import { repository } from '@/lib/repository';
import { Suspense } from 'react';

export default async function Home() {
  
  return (
    <div>
        <h1 className="text-2xl font-bold tracking-tight mb-4">Resumen de Versiones</h1>
        <Suspense fallback={<LoadingSpinner />}>
            <SummaryData />
        </Suspense>
    </div>
  );
}

async function SummaryData() {
    const summary = await repository.getSummary();
    return <SummaryView summary={summary} />;
}
