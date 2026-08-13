import Link from 'next/link';
import { repository } from '@/lib/repository';
import { ServiceCard } from '@/components/servicios/service-card';
import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { ProgramaConResumen } from '@/lib/repository';
import { MiniProgramGrid } from '@/components/servicios/mini-program-grid';

export default async function ServiciosPage() {
    return (
        <div className="space-y-8">
            <Suspense fallback={<LoadingSpinner />}>
                <ServiciosContent />
            </Suspense>
        </div>
    );
}

async function ServiciosContent() {
    const [servicios, programasSinServicio, summary] = await Promise.all([
        repository.getServicios(),
        repository.getProgramasSinServicio(),
        repository.getSummary(),
    ]);

    const summaryMap = new Map(summary.map(s => [s.programaId, s]));

    const programasHuerfanosConResumen: ProgramaConResumen[] = programasSinServicio.map(p => {
        const s = summaryMap.get(p.id);
        return {
            ...p,
            ultimoPreprod: s?.Preproducción ?? null,
            ultimoProd: s?.Producción ?? null,
        };
    });

    return (
        <>
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Servicios</h1>
                        <p className="text-muted-foreground text-sm">
                            {servicios.length} servicios · {programasHuerfanosConResumen.length} sin asignar
                        </p>
                    </div>
                    <Button asChild size="sm">
                        <Link href="/servicios/nuevo">
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo servicio
                        </Link>
                    </Button>
                </div>

                {servicios.length === 0 ? (
                    <div className="border rounded-xl p-12 text-center text-muted-foreground">
                        <p>No hay servicios creados.</p>
                        <Button asChild className="mt-4" size="sm">
                            <Link href="/servicios/nuevo">Crear primer servicio</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {servicios.map(servicio => (
                            <ServiceCard key={servicio.id} servicio={servicio} />
                        ))}
                    </div>
                )}
            </section>

            {programasHuerfanosConResumen.length > 0 && (
                <section className="space-y-3">
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Sin servicio asignado
                        </h2>
                        <span className="inline-flex items-center justify-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                            {programasHuerfanosConResumen.length}
                        </span>
                    </div>
                    <MiniProgramGrid programas={programasHuerfanosConResumen} />
                </section>
            )}
        </>
    );
}
