import { notFound } from 'next/navigation';
import { repository } from '@/lib/repository';
import { ServiceForm } from '@/components/servicios/service-form';
import { updateServicio } from '@/lib/actions-servicios';

export default async function EditarServicioPage({ params }: { params: { id: string } }) {
    const servicio = await repository.getServicioById(params.id);
    if (!servicio) notFound();

    const boundAction = updateServicio.bind(null, params.id);

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Editar servicio</h1>
                <p className="text-muted-foreground">Modifica los datos del servicio &quot;{servicio.nombre}&quot;.</p>
            </div>
            <ServiceForm
                action={boundAction}
                defaultValues={{ nombre: servicio.nombre, descripcion: servicio.descripcion ?? '', color: servicio.color ?? undefined }}
                submitLabel="Guardar cambios"
            />
        </div>
    );
}
