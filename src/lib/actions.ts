'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { repository } from './repository';

// This schema is now only for server-side validation, 
// the primary validation happens on the client.
const FormSchema = z.object({
  id: z.string().optional(),
  fecha: z.string(),
  programa: z.string().min(1, 'Programa no puede estar vacío.'),
  responsable: z.string().min(1, 'Responsable no puede estar vacío.'),
  entorno: z.enum(['Preproducción', 'Producción']),
  plataforma: z.string().min(1, 'Plataforma no puede estar vacía.'),
  version: z.string().min(1, 'Versión no puede estar vacía.'),
  accion: z.string().optional(),
  comentario: z.string().optional(),
  hasSwagger: z.string().optional(),
  url: z.string().optional(),
  port: z.string().optional(),
});

const handleDeployment = async (formData: FormData, id?: string) => {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = FormSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Error de validación del servidor.',
    };
  }
  
  const { fecha, programa, responsable, plataforma, hasSwagger, ...deploymentData } = validatedFields.data;

  try {
    const deploymentPayload = {
      ...deploymentData,
      fecha: new Date(fecha).toISOString(),
      hasSwagger: hasSwagger === 'on',
    }

    if (id) {
        await repository.updateDeployment(id, {
            ...deploymentPayload,
            programa,
            responsable,
            plataforma,
        });
    } else {
        await repository.createDeployment({
            ...deploymentPayload,
            programa,
            responsable,
            plataforma,
        });
    }
  } catch (error) {
    console.error(error);
    return { message: 'Error de base de datos.' };
  }

  revalidatePath('/deployments');
  revalidatePath('/');
  return { message: id ? 'Despliegue actualizado exitosamente.' : 'Despliegue añadido exitosamente.' };
}


export async function saveDeployment(formData: FormData) {
    return handleDeployment(formData);
}

export async function updateDeployment(id: string, formData: FormData) {
    return handleDeployment(formData, id);
}


export async function deleteDeployment(id: string) {
  try {
    await repository.deleteDeployment(id);
    revalidatePath('/deployments');
    revalidatePath('/');
    return { message: 'Despliegue eliminado.' };
  } catch (error) {
    return { message: 'Database Error: Failed to delete deployment.' };
  }
}
