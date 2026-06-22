import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import type { ServicioWithStats } from '@/lib/repository';
import { cn } from '@/lib/utils';

interface ServiceCardProps {
    servicio: ServicioWithStats;
}

export function ServiceCard({ servicio }: ServiceCardProps) {
    const color = servicio.color ?? '#6B7280';

    return (
        <Link href={`/servicios/${servicio.id}`}>
            <div className={cn(
                'border rounded-xl bg-background shadow-sm hover:shadow-md transition-all duration-200',
                'hover:-translate-y-0.5 cursor-pointer overflow-hidden'
            )}>
                <div className="h-1.5 w-full" style={{ backgroundColor: color }} />
                <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold leading-tight">{servicio.nombre}</h3>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{servicio.numProgramas} prog.</span>
                    </div>
                    {servicio.descripcion && <p className="text-xs text-muted-foreground line-clamp-2">{servicio.descripcion}</p>}
                    <div className="flex items-center justify-between">
                        <div className="flex gap-1.5">
                            {servicio.tieneProduccion && <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 text-xs px-2 py-0">Prod</Badge>}
                            {servicio.tienePreproduccion && <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 text-xs px-2 py-0">Preprod</Badge>}
                            {!servicio.tieneProduccion && !servicio.tienePreproduccion && <Badge variant="outline" className="text-xs px-2 py-0">Sin deploys</Badge>}
                        </div>
                        {servicio.ultimoDespliegue && (
                            <span className="text-xs text-muted-foreground">{new Date(servicio.ultimoDespliegue).toLocaleDateString('es-ES')}</span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
