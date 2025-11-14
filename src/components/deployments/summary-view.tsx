import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Summary {
    programaNombre: string;
    Preproducción: string | null;
    Producción: string | null;
}

interface SummaryViewProps {
  summary: Summary[];
}

export function SummaryView({ summary }: SummaryViewProps) {
  if (summary.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <h3 className="text-xl font-medium">No hay despliegues</h3>
        <p className="text-sm text-muted-foreground">Añade un despliegue para ver el resumen aquí.</p>
      </div>
    )
  }
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {summary.map((s) => (
            <Card key={s.programaNombre}>
                <CardHeader>
                    <CardTitle>{s.programaNombre}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Preproducción</span>
                        {s.Preproducción ? <Badge variant="secondary">{s.Preproducción}</Badge> : <span>-</span>}
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Producción</span>
                        {s.Producción ? <Badge variant="default">{s.Producción}</Badge> : <span>-</span>}
                    </div>
                </CardContent>
            </Card>
        ))}
    </div>
  );
}
