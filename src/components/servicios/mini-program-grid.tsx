'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { DeploymentDetailsDialog } from '@/components/deployments/deployment-details-dialog';
import type { ProgramaConResumen, DeploymentWithRelations } from '@/lib/repository';
import { cn } from '@/lib/utils';

interface MiniProgramGridProps {
    programas: ProgramaConResumen[];
}

export function MiniProgramGrid({ programas }: MiniProgramGridProps) {
    const [selectedDeployment, setSelectedDeployment] = useState<DeploymentWithRelations | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    function openDetail(deployment: DeploymentWithRelations) {
        setSelectedDeployment(deployment);
        setDialogOpen(true);
    }

    return (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                {programas.map(p => (
                    <MiniProgramCard key={p.id} programa={p} onOpenDetail={openDetail} />
                ))}
            </div>
            <DeploymentDetailsDialog
                deployment={selectedDeployment as any}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
            />
        </>
    );
}

function MiniProgramCard({
    programa,
    onOpenDetail,
}: {
    programa: ProgramaConResumen;
    onOpenDetail: (d: DeploymentWithRelations) => void;
}) {
    const hasProd = !!programa.ultimoProd;
    const hasPreprod = !!programa.ultimoPreprod;

    return (
        <div className={cn(
            'border rounded-lg p-2.5 bg-background hover:shadow-sm transition-shadow cursor-default',
            'flex flex-col gap-1.5'
        )}>
            <p className="text-xs font-medium leading-tight truncate" title={programa.nombre}>
                {programa.nombre}
            </p>
            <div className="flex flex-wrap gap-1">
                {hasProd ? (
                    <button
                        onClick={() => onOpenDetail(programa.ultimoProd!)}
                        className="inline-flex"
                    >
                        <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 bg-green-100 text-green-800 border-green-200 hover:opacity-80 cursor-pointer transition-opacity"
                        >
                            v{programa.ultimoProd!.version}
                        </Badge>
                    </button>
                ) : (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                        sin prod
                    </Badge>
                )}
                {hasPreprod && (
                    <button
                        onClick={() => onOpenDetail(programa.ultimoPreprod!)}
                        className="inline-flex"
                    >
                        <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-800 border-amber-200 hover:opacity-80 cursor-pointer transition-opacity"
                        >
                            v{programa.ultimoPreprod!.version}
                        </Badge>
                    </button>
                )}
            </div>
        </div>
    );
}
