'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { readDb, writeDb, Despliegue, Programa, Responsable } from './data';
import { randomUUID } from 'crypto';

const FormSchema = z.object({
  id: z.string().optional(),
  fecha: z.string(),
  programa: z.string().min(1, 'Programa no puede estar vacío.'),
  responsable: z.string().min(1, 'Responsable no puede estar vacío.'),
  entorno: z.enum(['Preproducción', 'Producción']),
  plataforma: z.enum(['IIS', 'Docker']),
  version: z.string().min(1, 'Versión no puede estar vacía.'),
  accion: z.string().optional(),
  comentario: z.string().optional(),
});

const getOrCreate = async (collectionName: 'programas' | 'responsables', name: string) => {
    const db = await readDb();
    let collection: (Programa[] | Responsable[]) = db[collectionName];
    
    let item = collection.find(p => p.nombre.toLowerCase() === name.toLowerCase());

    if (!item) {
        const newItem = { id: randomUUID(), nombre: name };
        (db[collectionName] as any[]).push(newItem);
        await writeDb(db);
        return newItem.id;
    }
    return item.id;
};

export async function saveDeployment(formData: FormData) {
  const validatedFields = FormSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Error de validación.',
    };
  }
  
  const { fecha, programa, responsable, ...deploymentData } = validatedFields.data;

  try {
    const programaId = await getOrCreate('programas', programa);
    const responsableId = await getOrCreate('responsables', responsable);

    const db = await readDb();

    const newDeployment: Despliegue = {
        id: randomUUID(),
        ...deploymentData,
        fecha: new Date(fecha).toISOString(),
        programaId: programaId,
        responsableId: responsableId,
    };
    db.despliegues.push(newDeployment);
    await writeDb(db);

  } catch (error) {
    console.error(error);
    return { message: 'Error de base de datos: No se pudo crear el despliegue.' };
  }

  revalidatePath('/deployments');
  revalidatePath('/');
  return { message: 'Despliegue añadido exitosamente.' };
}

export async function updateDeployment(id: string, formData: FormData) {
    const validatedFields = FormSchema.safeParse(Object.fromEntries(formData.entries()));
    
      if (!validatedFields.success) {
        return {
          errors: validatedFields.error.flatten().fieldErrors,
          message: 'Error de validación.',
        };
      }

      const { fecha, programa, responsable, ...deploymentData } = validatedFields.data;

      try {
        const programaId = await getOrCreate('programas', programa);
        const responsableId = await getOrCreate('responsables', responsable);
        
        const db = await readDb();

        const deploymentIndex = db.despliegues.findIndex(d => d.id === id);
        if (deploymentIndex === -1) {
            return { message: 'Error: Despliegue no encontrado.' };
        }
    
        db.despliegues[deploymentIndex] = {
            ...db.despliegues[deploymentIndex],
            ...deploymentData,
            fecha: new Date(fecha).toISOString(),
            programaId,
            responsableId
        };
        await writeDb(db);

    } catch (error) {
        console.error(error);
        return { message: 'Error de base de datos: No se pudo actualizar el despliegue.' };
    }

    revalidatePath('/deployments');
    revalidatePath('/');
    return { message: 'Despliegue actualizado exitosamente.' };
}


export async function deleteDeployment(id: string) {
  try {
    const db = await readDb();
    db.despliegues = db.despliegues.filter(d => d.id !== id);
    await writeDb(db);

    revalidatePath('/deployments');
    revalidatePath('/');
    return { message: 'Despliegue eliminado.' };
  } catch (error) {
    return { message: 'Database Error: Failed to delete deployment.' };
  }
}