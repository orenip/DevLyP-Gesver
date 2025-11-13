'use server';

import { z } from 'zod';
import prisma from './prisma';
import { revalidatePath } from 'next/cache';

const FormSchema = z.object({
  id: z.number().optional(),
  fecha: z.string(),
  programa: z.string().min(1, 'Programa no puede estar vacío.'),
  responsable: z.string().min(1, 'Responsable no puede estar vacío.'),
  entorno: z.enum(['Preproducción', 'Producción']),
  version: z.string().min(1, 'Versión no puede estar vacía.'),
  accion: z.string().optional(),
  comentario: z.string().optional(),
});

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
    const [programaRecord, responsableRecord] = await Promise.all([
      prisma.programa.upsert({
        where: { nombre: programa },
        update: {},
        create: { nombre: programa },
      }),
      prisma.responsable.upsert({
        where: { nombre: responsable },
        update: {},
        create: { nombre: responsable },
      }),
    ]);

    await prisma.despliegue.create({
      data: {
        ...deploymentData,
        fecha: new Date(fecha),
        programaId: programaRecord.id,
        responsableId: responsableRecord.id,
      },
    });
  } catch (error) {
    return { message: 'Error de base de datos: No se pudo crear el despliegue.' };
  }

  revalidatePath('/');
  return { message: 'Despliegue añadido exitosamente.' };
}

export async function updateDeployment(id: number, formData: FormData) {
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
        const [programaRecord, responsableRecord] = await Promise.all([
          prisma.programa.upsert({
            where: { nombre: programa },
            update: {},
            create: { nombre: programa },
          }),
          prisma.responsable.upsert({
            where: { nombre: responsable },
            update: {},
            create: { nombre: responsable },
          }),
        ]);
    
        await prisma.despliegue.update({
            where: { id },
            data: {
                ...deploymentData,
                fecha: new Date(fecha),
                programaId: programaRecord.id,
                responsableId: responsableRecord.id,
            },
        });
    } catch (error) {
        return { message: 'Error de base de datos: No se pudo actualizar el despliegue.' };
    }

    revalidatePath('/');
    return { message: 'Despliegue actualizado exitosamente.' };
}


export async function deleteDeployment(id: number) {
  try {
    await prisma.despliegue.delete({
      where: { id },
    });
    revalidatePath('/');
    return { message: 'Despliegue eliminado.' };
  } catch (error) {
    return { message: 'Database Error: Failed to delete deployment.' };
  }
}
