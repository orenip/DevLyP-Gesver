'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { DeploymentWithRelations } from '@/lib/data';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DeploymentDetailsDialogProps {
    deployment: DeploymentWithRelations | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DeploymentDetailsDialog({ deployment, open, onOpenChange }: DeploymentDetailsDialogProps) {
  if (!deployment) return null;

  const getBadgeVariant = (entorno: string) => {
    return entorno === 'Producción' ? 'default' : 'secondary';
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detalles del Despliegue</DialogTitle>
          <DialogDescription>
            Información detallada para la versión {deployment.version} de {deployment.programa.nombre}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 text-sm">
            <div className="grid grid-cols-3 items-center gap-4">
                <span className="text-muted-foreground">Fecha</span>
                <span className="col-span-2">{format(new Date(deployment.fecha), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}</span>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
                <span className="text-muted-foreground">Responsable</span>
                <span className="col-span-2">{deployment.responsable.nombre}</span>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
                <span className="text-muted-foreground">Entorno</span>
                <div className="col-span-2">
                    <Badge variant={getBadgeVariant(deployment.entorno)}>{deployment.entorno}</Badge>
                </div>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
                <span className="text-muted-foreground">Plataforma</span>
                <div className="col-span-2">
                    <Badge variant="outline">{deployment.plataforma}</Badge>
                </div>
            </div>
             {deployment.accion && (
                <div className="grid grid-cols-3 items-center gap-4">
                    <span className="text-muted-foreground">Acción</span>
                    <span className="col-span-2">{deployment.accion}</span>
                </div>
            )}
             {deployment.comentario && (
                <div className="grid grid-cols-3 items-center gap-4">
                    <span className="text-muted-foreground">Comentario</span>
                    <p className="col-span-2 break-words">{deployment.comentario}</p>
                </div>
            )}
            {deployment.url && (
                <div className="grid grid-cols-3 items-center gap-4">
                    <span className="text-muted-foreground">URL Acceso</span>
                    <a href={deployment.url} target="_blank" rel="noopener noreferrer" className="col-span-2 text-primary hover:underline break-all">{deployment.url}</a>
                </div>
            )}
            {deployment.port && (
                    <div className="grid grid-cols-3 items-center gap-4">
                    <span className="text-muted-foreground">Puerto</span>
                    <span className="col-span-2">{deployment.port}</span>
                </div>
            )}
            {deployment.hasSwagger && (
                <div className="grid grid-cols-3 items-center gap-4">
                    <span className="text-muted-foreground">Swagger</span>
                    <div className="col-span-2">
                        <Badge variant="secondary">Activado</Badge>
                    </div>
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
