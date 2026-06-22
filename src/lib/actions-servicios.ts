'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { repository } from './repository';

const ServicioSchema = z.object({
    nombre: z.string().min(1, 'Nombre requerido').max(100),
    descripcion: z.string().optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color inválido').optional(),
});

export async function createServicio(formData: FormData) {
    const raw = Object.fromEntries(formData.entries());
    const validated = ServicioSchema.safeParse(raw);
    if (!validated.success) {
        return { errors: validated.error.flatten().fieldErrors, message: 'Error de validación.' };
    }
    try {
        await repository.createServicio(validated.data);
    } catch {
        return { message: 'Error al crear el servicio.' };
    }
    revalidatePath('/servicios');
    revalidatePath('/');
    return { message: 'Servicio creado.' };
}

export async function updateServicio(id: string, formData: FormData) {
    const raw = Object.fromEntries(formData.entries());
    const validated = ServicioSchema.safeParse(raw);
    if (!validated.success) {
        return { errors: validated.error.flatten().fieldErrors, message: 'Error de validación.' };
    }
    try {
        await repository.updateServicio(id, validated.data);
    } catch {
        return { message: 'Error al actualizar el servicio.' };
    }
    revalidatePath('/servicios');
    revalidatePath('/');
    return { message: 'Servicio actualizado.' };
}

export async function deleteServicio(id: string) {
    try {
        await repository.deleteServicio(id);
    } catch {
        return { message: 'Error al eliminar el servicio.' };
    }
    revalidatePath('/servicios');
    revalidatePath('/');
    return { message: 'Servicio eliminado. Los programas asociados quedan sin servicio.' };
}

export async function updateAsociaciones(
    servicioId: string,
    programaIds: string[],
    todosLosProgramas: Array<{ id: string; servicioId: string | null }>
) {
    try {
        for (const programa of todosLosProgramas) {
            const debeEstarAsociado = programaIds.includes(programa.id);
            const estaAsociado = programa.servicioId === servicioId;
            if (debeEstarAsociado && !estaAsociado) {
                await repository.updateProgramaServicio(programa.id, servicioId);
            } else if (!debeEstarAsociado && estaAsociado) {
                await repository.updateProgramaServicio(programa.id, null);
            }
        }
    } catch {
        return { message: 'Error al actualizar asociaciones.' };
    }
    revalidatePath(`/servicios/${servicioId}`);
    revalidatePath('/servicios');
    revalidatePath('/');
    return { message: 'Asociaciones actualizadas.' };
}
