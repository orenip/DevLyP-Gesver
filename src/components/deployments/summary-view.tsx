'use client'

import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { DeploymentWithRelations, SummaryItem } from '@/lib/repository';
import { useState } from 'react';
import { DeploymentDetailsDialog } from './deployment-details-dialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Server, User } from 'lucide-react';

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

  const DeploymentInfo = ({ deployment, environment }: { deployment: DeploymentWithRelations | null, environment: 'Preproducción' | 'Producción' }) => {
    return (
        <div className="bg-muted/50 rounded-lg p-4 flex flex-col justify-between flex-grow">
            {deployment ? (
            <>
                <div>
                    <Badge 
                        variant={environment === 'Producción' ? 'default' : 'secondary'}
                        className="cursor-pointer text-base"
                        onClick={() => setSelectedDeployment(deployment)}
                    >
                        v{deployment.version}
                    </Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-2 mt-3">
                    <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5" />
                        <span>{deployment.responsable.nombre}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{format(new Date(deployment.fecha), "dd/MM/yyyy")}</span>
                    </div>
                </div>
            </>
            ) : (
                <div className="flex flex-col justify-center items-center h-full text-sm text-muted-foreground flex-grow">
                    <div className="flex flex-col items-center gap-2">
                        <Server className="w-5 h-5" />
                        <span>Sin datos</span>
                    </div>
                </div>
            )}
        </div>
    );
  };

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {summary.map((s) => (
              <Card key={s.programaId} className="flex flex-col">
                  <CardHeader>
                      <CardTitle className="truncate">{s.programaNombre}</CardTitle>
                      <CardDescription>Últimas versiones desplegadas</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <h4 className="text-sm font-semibold mb-2 text-center text-muted-foreground">Preproducción</h4>
                        <DeploymentInfo deployment={s.Preproducción} environment="Preproducción" />
                      </div>
                      <div className="flex flex-col">
                        <h4 className="text-sm font-semibold mb-2 text-center text-muted-foreground">Producción</h4>
                        <DeploymentInfo deployment={s.Producción} environment="Producción" />
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
