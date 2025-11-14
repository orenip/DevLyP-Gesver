import { SummaryView } from '@/components/deployments/summary-view';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchSummary } from '@/lib/data';

export default async function Home() {
  const summary = await fetchSummary();

  return (
    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1 md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle>Resumen de Versiones</CardTitle>
            </CardHeader>
            <CardContent>
              <SummaryView summary={summary} />
            </CardContent>
        </Card>
    </div>
  );
}
