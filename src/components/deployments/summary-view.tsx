'use client'

import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DeploymentWithRelations, SummaryItem } from '@/lib/data';
import { useState } from 'react';
import { DeploymentDetailsDialog } from './deployment-details-dialog';

interface SummaryViewProps {
  summary: SummaryItem[];
}

export function SummaryView({ summary }: SummaryViewProps) {
  const [selectedDeployment, setSelectedDeployment] = useState<DeploymentWithRelations | null>(null);

  if (summary.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <h3 className="text-xl font-medium">No hay despliegues</h3>
        <p className="text-sm text-muted-foreground">Añade un despliegue para ver el resumen aquí.</p>
      </div>
    )
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedDeployment(null);
    }
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {summary.map((s) => (
              <Card key={s.programaNombre}>
                  <CardHeader>
                      <CardTitle>{s.programaNombre}</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                      <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Preproducción</span>
                          {s.Preproducción ? (
                            <Badge 
                              variant="secondary" 
                              className="cursor-pointer"
                              onClick={() => setSelectedDeployment(s.Preproducción)}
                            >
                              {s.Preproducción.version}
                            </Badge>
                          ) : (
                            <span>-</span>
                          )}
                      </div>
                      <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Producción</span>
                          {s.Producción ? (
                            <Badge 
                              variant="default"
                              className="cursor-pointer"
                              onClick={() => setSelectedDeployment(s.Producción)}
                            >
                               {s.Producción.version}
                            </Badge>
                          ) : (
                            <span>-</span>
                          )}
                      </div>
                  </CardContent>
              </Card>
          ))}
      </div>
      <DeploymentDetailsDialog 
        deployment={selectedDeployment} 
        open={!!selectedDeployment}
        onOpenChange={handleOpenChange}
      />
    </>
  );
}
