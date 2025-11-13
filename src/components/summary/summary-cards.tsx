'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { SummaryData } from '@/lib/definitions';
import { formatDate } from '@/lib/utils';
import { Server, Beaker } from 'lucide-react';

export function SummaryCards({ data }: { data: SummaryData }) {
  if (data.length === 0) {
    return (
        <Card className="text-center">
            <CardHeader>
                <CardTitle>Sin Datos</CardTitle>
            </CardHeader>
            <CardContent>
                <p>No hay datos de despliegue para mostrar un resumen. Comience añadiendo un despliegue.</p>
            </CardContent>
        </Card>
    )
  }
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {data.map((summary) => (
        <Card key={summary.programa}>
          <CardHeader>
            <CardTitle>{summary.programa}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Beaker className="h-4 w-4 text-yellow-500" />
                <span>Última en Preproducción</span>
              </div>
              {summary.preproduccion ? (
                <>
                  <p className="text-lg font-semibold">{summary.preproduccion.version}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(summary.preproduccion.fecha, "d MMM yyyy 'a las' HH:mm")}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Sin datos</p>
              )}
            </div>
            <Separator />
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Server className="h-4 w-4 text-green-500" />
                <span>Última en Producción</span>
              </div>
              {summary.produccion ? (
                <>
                  <p className="text-lg font-semibold">{summary.produccion.version}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(summary.produccion.fecha, "d MMM yyyy 'a las' HH:mm")}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Sin datos</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
