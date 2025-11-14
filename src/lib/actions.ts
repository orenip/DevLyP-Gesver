'use server';

import { revalidatePath } from 'next/cache';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { z } from 'zod';

const FormSchema = z.object({
  id: z.string().optional(),
  fecha: z.string(),
  programa: z.string().min(1, 'Programa no puede estar vacío.'),
  responsable: z.string().min(1, 'Responsable no puede estar vacío.'),
  entorno: z.enum(['Preproducción', 'Producción']),
  version: z.string().min(1, 'Versión no puede estar vacía.'),
  accion: z.string().optional(),
  comentario: z.string().optional(),
});

const getOrCreate = async (collectionName: string, name: string) => {
    const q = query(collection(db, collectionName), where("nombre", "==", name));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        return snapshot.docs[0].id;
    } else {
        const docRef = await addDoc(collection(db, collectionName), { nombre: name });
        return docRef.id;
    }
};

export async function saveDeployment(formData: FormData) {
  const validatedFields = FormSchema.safeParse({
    fecha: formData.get('fecha'),
    programa: formData.get('programa'),
    responsable: formData.get('responsable'),
    entorno: formData.get('entorno'),
    version: formData.get('version'),
    accion: formData.get('accion'),
    comentario: formData.get('comentario'),
  });

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

    await addDoc(collection(db, 'despliegues'), {
        ...deploymentData,
        fecha: new Date(fecha),
        programaId: programaId,
        responsableId: responsableId,
    });
  } catch (error) {
    console.error(error);
    return { message: 'Error de base de datos: No se pudo crear el despliegue.' };
  }

  revalidatePath('/');
  return { message: 'Despliegue añadido exitosamente.' };
}

export async function updateDeployment(id: string, formData: FormData) {
    const validatedFields = FormSchema.safeParse({
        fecha: formData.get('fecha'),
        programa: formData.get('programa'),
        responsable: formData.get('responsable'),
        entorno: formData.get('entorno'),
        version: formData.get('version'),
        accion: formData.get('accion'),
        comentario: formData.get('comentario'),
      });
    
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
    
        await updateDoc(doc(db, 'despliegues', id), {
            ...deploymentData,
            fecha: new Date(fecha),
            programaId: programaId,
            responsableId: responsableId,
        });
    } catch (error) {
        console.error(error);
        return { message: 'Error de base de datos: No se pudo actualizar el despliegue.' };
    }

    revalidatePath('/');
    return { message: 'Despliegue actualizado exitosamente.' };
}


export async function deleteDeployment(id: string) {
  try {
    await deleteDoc(doc(db, 'despliegues', id));
    revalidatePath('/');
    return { message: 'Despliegue eliminado.' };
  } catch (error) {
    return { message: 'Database Error: Failed to delete deployment.' };
  }
}
