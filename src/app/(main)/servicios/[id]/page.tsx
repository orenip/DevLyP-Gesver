import { notFound } from 'next/navigation';
import Link from 'next/link';
import { repository } from '@/lib/repository';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil } from 'lucide-react';
import { ProgramCard } from '@/components/servicios/program-card';
import { AsociacionesModal } from '@/components/servicios/asociaciones-modal';

export default async function ServicioDetailPage({ params }: { params: { id: string } }) {
    const [servicio, programas, todosLosProgramas] = await Promise.all([
        repository.getServicioById(params.id),
        repository.getProgramasByServicio(params.id),
        repository.getProgramasConServicio(),
    ]);

    if (!servicio) notFound();

    const programasAsociadosIds = programas.map(p => p.id);

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <span className="h-5 w-5 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: servicio.color ?? '#6B7280' }} />
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{servicio.nombre}</h1>
                        {servicio.descripcion && <p className="text-muted-foreground mt-0.5">{servicio.descripcion}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <AsociacionesModal servicioId={params.id} todosLosProgramas={todosLosProgramas} programasAsociados={programasAsociadosIds} />
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/servicios/${params.id}/editar`}><Pencil className="mr-2 h-4 w-4" />Editar</Link>
                    </Button>
                </div>
            </div>

            <div className="flex gap-4 flex-wrap">
                <Badge variant="outline" className="text-sm px-3 py-1">{programas.length} programa{programas.length !== 1 ? 's' : ''}</Badge>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 text-sm px-3 py-1">{programas.filter(p => p.ultimoProd).length} en producción</Badge>
                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 text-sm px-3 py-1">{programas.filter(p => p.ultimoPreprod).length} en preproducción</Badge>
            </div>

            {programas.length === 0 ? (
                <div className="border rounded-xl p-12 text-center text-muted-foreground">
                    <p>No hay programas asociados a este servicio.</p>
                    <p className="text-sm mt-1">Usa &quot;Gestionar programas&quot; para asociar programas.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {programas.map(programa => <ProgramCard key={programa.id} programa={programa} />)}
                </div>
            )}

            <div className="pt-2">
                <Link href="/servicios" className="text-sm text-muted-foreground hover:underline">← Volver a servicios</Link>
            </div>
        </div>
    );
}
