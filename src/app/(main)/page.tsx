import { SummaryView } from '@/components/deployments/summary-view';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchSummary } from '@/lib/data';
import { Suspense } from 'react';

export default async function Home() {
  
  return (
    <div>
        <h1 className="text-2xl font-bold tracking-tight mb-4">Resumen de Versiones</h1>
        <Suspense fallback={<SummarySkeleton/>}>
            <SummaryData />
        </Suspense>
    </div>
  );
}

async function SummaryData() {
    const summary = await fetchSummary();
    return <SummaryView summary={summary} />;
}

function SummarySkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <div className="h-6 bg-muted rounded w-3/4" />
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="flex items-center justify-between">
                            <div className="h-4 bg-muted rounded w-1/3" />
                            <div className="h-6 bg-muted rounded w-1/4" />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="h-4 bg-muted rounded w-1/3" />
                            <div className="h-6 bg-muted rounded w-1/4" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
