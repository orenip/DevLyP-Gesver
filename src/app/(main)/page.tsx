import { SummaryView } from '@/components/deployments/summary-view';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchSummary } from '@/lib/data';

export default async function Home() {
  const summary = await fetchSummary();

  return (
    <div>
        <h1 className="text-2xl font-bold tracking-tight mb-4">Resumen de Versiones</h1>
        <SummaryView summary={summary} />
    </div>
  );
}
