import { repository } from '@/lib/repository';
import { ServiceCard } from '@/components/servicios/service-card';
import { ProgramCard } from '@/components/servicios/program-card';
import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/loading-spinner';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { ProgramaConResumen } from '@/lib/repository';

export default async function Home() {
    return (
        <div className="space-y-8">
            <Suspense fallback={<LoadingSpinner />}>
                <HomeContent />
            </Suspense>
        </div>
    );
}

async function HomeContent() {
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
                    <h1 className="text-2xl font-bold tracking-tight">Servicios</h1>
                    <Button asChild size="sm" variant="outline">
                        <Link href="/servicios/nuevo"><Plus className="mr-2 h-4 w-4" />Nuevo servicio</Link>
                    </Button>
                </div>
                {servicios.length === 0 ? (
                    <div className="border rounded-xl p-12 text-center text-muted-foreground">
                        <p>No hay servicios creados.</p>
                        <Button asChild className="mt-4" size="sm"><Link href="/servicios/nuevo">Crear primer servicio</Link></Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {servicios.map(servicio => <ServiceCard key={servicio.id} servicio={servicio} />)}
                    </div>
                )}
            </section>

            {programasHuerfanosConResumen.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-muted-foreground">Sin servicio asignado ({programasHuerfanosConResumen.length})</h2>
                        <Link href="/servicios" className="text-sm underline text-muted-foreground hover:text-foreground">Gestionar →</Link>
                    </div>
                    <div className="space-y-2">
                        {programasHuerfanosConResumen.map(p => <ProgramCard key={p.id} programa={p} />)}
                    </div>
                </section>
            )}
        </>
    );
}
