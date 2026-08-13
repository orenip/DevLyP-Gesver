'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { DeploymentWithRelations } from '@/lib/repository';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, User, Server, Tag, MessageSquare, Link2, Wifi, BookOpen, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeploymentDetailsDialogProps {
    deployment: DeploymentWithRelations | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DeploymentDetailsDialog({ deployment, open, onOpenChange }: DeploymentDetailsDialogProps) {
    if (!deployment) return null;

    const isProd = deployment.entorno === 'Producción';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md p-0 overflow-hidden gap-0">
                {/* Header con color según entorno */}
                <div className={cn(
                    'px-6 pt-5 pb-4',
                    isProd
                        ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-b border-green-100'
                        : 'bg-gradient-to-br from-amber-50 to-orange-50 border-b border-amber-100'
                )}>
                    <DialogHeader>
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <DialogTitle className="text-lg font-bold leading-tight truncate">
                                    {deployment.programa.nombre}
                                </DialogTitle>
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            'text-xs font-mono font-bold px-2',
                                            isProd
                                                ? 'bg-green-100 text-green-800 border-green-300'
                                                : 'bg-amber-100 text-amber-800 border-amber-300'
                                        )}
                                    >
                                        v{deployment.version}
                                    </Badge>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            'text-xs',
                                            isProd
                                                ? 'bg-green-100 text-green-700 border-green-200'
                                                : 'bg-amber-100 text-amber-700 border-amber-200'
                                        )}
                                    >
                                        {deployment.entorno}
                                    </Badge>
                                    {deployment.hasSwagger && (
                                        <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                                            Swagger
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </DialogHeader>
                </div>

                {/* Body */}
                <div className="px-6 py-4 space-y-3">
                    <DetailRow icon={<Calendar className="h-3.5 w-3.5" />} label="Fecha">
                        {format(new Date(deployment.fecha), "d 'de' MMMM yyyy · HH:mm", { locale: es })}
                    </DetailRow>

                    <DetailRow icon={<User className="h-3.5 w-3.5" />} label="Responsable">
                        <span className="font-medium">{deployment.responsable.nombre}</span>
                    </DetailRow>

                    <DetailRow icon={<Server className="h-3.5 w-3.5" />} label="Plataforma">
                        <Badge variant="outline" className="text-xs">{deployment.plataforma}</Badge>
                    </DetailRow>

                    {deployment.accion && (
                        <DetailRow icon={<Tag className="h-3.5 w-3.5" />} label="Acción">
                            {deployment.accion}
                        </DetailRow>
                    )}

                    {deployment.port && (
                        <DetailRow icon={<Wifi className="h-3.5 w-3.5" />} label="Puerto">
                            <span className="font-mono font-bold text-sm">{deployment.port}</span>
                        </DetailRow>
                    )}

                    {deployment.url && (
                        <DetailRow icon={<Link2 className="h-3.5 w-3.5" />} label="URL">
                            <a
                                href={deployment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline break-all flex items-center gap-1 text-sm"
                            >
                                <span className="truncate max-w-52">{deployment.url}</span>
                                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            </a>
                        </DetailRow>
                    )}

                    {deployment.hasSwagger && deployment.url && (
                        <DetailRow icon={<BookOpen className="h-3.5 w-3.5" />} label="Swagger UI">
                            <a
                                href={`${deployment.url}/swagger`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                            >
                                Abrir Swagger <ExternalLink className="h-3 w-3" />
                            </a>
                        </DetailRow>
                    )}

                    {deployment.comentario && (
                        <div className="pt-1">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                                <MessageSquare className="h-3.5 w-3.5" />
                                <span className="font-medium uppercase tracking-wide">Comentario</span>
                            </div>
                            <p className={cn(
                                'text-sm rounded-lg px-3 py-2.5 border leading-relaxed',
                                isProd ? 'bg-green-50/50 border-green-100' : 'bg-amber-50/50 border-amber-100'
                            )}>
                                {deployment.comentario}
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function DetailRow({ icon, label, children }: {
    icon: React.ReactNode;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="flex items-center gap-1.5 text-muted-foreground w-28 flex-shrink-0 pt-0.5">
                {icon}
                <span className="text-xs font-medium">{label}</span>
            </div>
            <div className="text-sm text-foreground flex-1 min-w-0">
                {children}
            </div>
        </div>
    );
}
