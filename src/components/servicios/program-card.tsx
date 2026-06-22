'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DeploymentDetailsDialog } from '@/components/deployments/deployment-details-dialog';
import type { ProgramaConResumen, DeploymentWithRelations } from '@/lib/repository';
import { ENTORNO_STYLES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface ProgramCardProps {
    programa: ProgramaConResumen;
}

export function ProgramCard({ programa }: ProgramCardProps) {
    const [expanded, setExpanded] = useState(false);
    const [selectedDeployment, setSelectedDeployment] = useState<DeploymentWithRelations | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    function openDetail(deployment: DeploymentWithRelations) {
        setSelectedDeployment(deployment);
        setDialogOpen(true);
    }

    return (
        <>
            <div className="border rounded-xl bg-background shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 p-4 cursor-pointer select-none" onClick={() => setExpanded(v => !v)}>
                    <span className="font-medium flex-1">{programa.nombre}</span>
                    <VersionBadge entorno="Preproducción" deployment={programa.ultimoPreprod} onClick={openDetail} />
                    <VersionBadge entorno="Producción" deployment={programa.ultimoProd} onClick={openDetail} />
                    <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" tabIndex={-1}>
                        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </div>
                {expanded && (
                    <div className="border-t grid grid-cols-2 divide-x">
                        <EntornoDetail label="Preproducción" deployment={programa.ultimoPreprod} onOpen={openDetail} />
                        <EntornoDetail label="Producción" deployment={programa.ultimoProd} onOpen={openDetail} />
                    </div>
                )}
            </div>
            <DeploymentDetailsDialog
                deployment={selectedDeployment as any}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
            />
        </>
    );
}

function VersionBadge({ entorno, deployment, onClick }: {
    entorno: 'Preproducción' | 'Producción';
    deployment: DeploymentWithRelations | null;
    onClick: (d: DeploymentWithRelations) => void;
}) {
    const styles = ENTORNO_STYLES[entorno];
    if (!deployment) {
        return <Badge variant="outline" className="text-xs text-muted-foreground">Sin {entorno === 'Producción' ? 'prod' : 'preprod'}</Badge>;
    }
    return (
        <Badge variant="outline" className={cn('text-xs cursor-pointer hover:opacity-80 transition-opacity', styles.badge)}
            onClick={(e) => { e.stopPropagation(); onClick(deployment); }}>
            {deployment.version}
        </Badge>
    );
}

function EntornoDetail({ label, deployment, onOpen }: {
    label: string;
    deployment: DeploymentWithRelations | null;
    onOpen: (d: DeploymentWithRelations) => void;
}) {
    const styles = ENTORNO_STYLES[label as 'Preproducción' | 'Producción'];
    const textColorClass = styles.badge.split(' ')[1];
    return (
        <div className="p-4 space-y-2">
            <p className={cn('text-xs font-semibold uppercase tracking-wide', textColorClass)}>{label}</p>
            {deployment ? (
                <>
                    <p className="font-mono text-sm font-medium">{deployment.version}</p>
                    <p className="text-xs text-muted-foreground">📅 {new Date(deployment.fecha).toLocaleDateString('es-ES')}</p>
                    <p className="text-xs text-muted-foreground">👤 {deployment.responsable.nombre}</p>
                    <p className="text-xs text-muted-foreground">🏷️ {deployment.plataforma}</p>
                    {deployment.comentario && <p className="text-xs text-muted-foreground line-clamp-2">💬 {deployment.comentario}</p>}
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => onOpen(deployment)}>
                        Ver detalles completos →
                    </Button>
                </>
            ) : (
                <p className="text-xs text-muted-foreground">Sin despliegues registrados</p>
            )}
        </div>
    );
}
