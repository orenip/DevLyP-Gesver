import { ServiceForm } from '@/components/servicios/service-form';
import { createServicio } from '@/lib/actions-servicios';

export default function NuevoServicioPage() {
    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Nuevo servicio</h1>
                <p className="text-muted-foreground">Crea un nuevo servicio para agrupar programas.</p>
            </div>
            <ServiceForm action={createServicio} submitLabel="Crear servicio" />
        </div>
    );
}
