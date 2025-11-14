'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { readDb, writeDb, Despliegue, Programa, Responsable, Plataforma } from './data';
import { randomUUID } from 'crypto';

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

const getOrCreate = async (collectionName: 'programas' | 'responsables' | 'plataformas', name: string) => {
    const db = await readDb();
    let collection: (Programa[] | Responsable[] | Plataforma[]) = db[collectionName] || [];
    
    let item = collection.find(p => p.nombre.toLowerCase() === name.toLowerCase());

    if (!item) {
        const newItem = { id: randomUUID(), nombre: name };
        if (!db[collectionName]) {
          db[collectionName] = [];
        }
        (db[collectionName] as any[]).push(newItem);
        await writeDb(db);
        return newItem.id;
    }
    return item.id;
};

const handleDeployment = async (formData: FormData, id?: string) => {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = FormSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Error de validación.',
    };
  }
  
  const { fecha, programa, responsable, plataforma, hasSwagger, ...deploymentData } = validatedFields.data;

  try {
    const programaId = await getOrCreate('programas', programa);
    const responsableId = await getOrCreate('responsables', responsable);
    const plataformaId = await getOrCreate('plataformas', plataforma);

    const db = await readDb();

    // We store the name of the platform directly in the deployment
    const plataformaNombre = db.plataformas.find(p => p.id === plataformaId)?.nombre || plataforma;

    if (id) {
        // Update
        const deploymentIndex = db.despliegues.findIndex(d => d.id === id);
        if (deploymentIndex === -1) {
            return { message: 'Error: Despliegue no encontrado.' };
        }
        
        db.despliegues[deploymentIndex] = {
            ...db.despliegues[deploymentIndex],
            ...deploymentData,
            fecha: new Date(fecha).toISOString(),
            programaId,
            responsableId,
            plataforma: plataformaNombre,
            hasSwagger: hasSwagger === 'on',
        };
    } else {
        // Create
        const newDeployment: Despliegue = {
            id: randomUUID(),
            ...deploymentData,
            fecha: new Date(fecha).toISOString(),
            programaId: programaId,
            responsableId: responsableId,
            plataforma: plataformaNombre,
            hasSwagger: hasSwagger === 'on',
        };
        db.despliegues.push(newDeployment);
    }
    
    await writeDb(db);

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
