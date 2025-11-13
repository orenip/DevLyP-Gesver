'use server';

import { z } from 'zod';
import prisma from './prisma';
import { revalidatePath } from 'next/cache';
import { deploymentSchema, adminSchema } from './definitions';
import { Prisma } from '@prisma/client';

export async function createOrUpdateDeployment(
  prevState: any,
  formData: FormData,
) {
  const validatedFields = deploymentSchema.safeParse({
    id: formData.get('id') ? Number(formData.get('id')) : undefined,
    fecha: new Date(formData.get('fecha') as string),
    programa: formData.get('programa'),
    entorno: formData.get('entorno'),
    version: formData.get('version'),
    accion: formData.get('accion'),
    responsable: formData.get('responsable'),
    comentario: formData.get('comentario'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Error de validación. Por favor, revise los campos.',
    };
  }

  const { id, ...data } = validatedFields.data;

  try {
    const programa = await prisma.programa.upsert({
      where: { nombre: data.programa },
      update: {},
      create: { nombre: data.programa },
    });

    const responsable = await prisma.responsable.upsert({
      where: { nombre: data.responsable },
      update: {},
      create: { nombre: data.responsable },
    });

    const deploymentData: any = {
      ...data,
      programaId: programa.id,
      responsableId: responsable.id,
    };
    delete deploymentData.programa;
    delete deploymentData.responsable;

    if (id) {
      await prisma.despliegue.update({
        where: { id },
        data: deploymentData,
      });
    } else {
      await prisma.despliegue.create({
        data: deploymentData,
      });
    }

    revalidatePath('/');
    revalidatePath('/summary');
    return { message: `Despliegue ${id ? 'actualizado' : 'creado'} correctamente.` };
  } catch (e) {
    console.error(e);
    return { message: 'Error en la base de datos.' };
  }
}

export async function deleteDeployment(id: number) {
  try {
    await prisma.despliegue.delete({
      where: { id },
    });
    revalidatePath('/');
    revalidatePath('/summary');
    return { success: true, message: 'Despliegue eliminado.' };
  } catch (e) {
    console.error(e);
    return { success: false, message: 'Error al eliminar el despliegue.' };
  }
}

export async function createOrUpdateProgram(prevState: any, formData: FormData) {
    const validatedFields = adminSchema.safeParse({
        id: formData.get('id') ? Number(formData.get('id')) : undefined,
        nombre: formData.get('nombre'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Error de validación.',
        };
    }
    
    const { id, nombre } = validatedFields.data;

    try {
        if (id) {
            await prisma.programa.update({ where: { id }, data: { nombre } });
        } else {
            await prisma.programa.create({ data: { nombre } });
        }
        revalidatePath('/admin');
        return { message: `Programa ${id ? 'actualizado' : 'creado'}.` };
    } catch (e: unknown) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
            return { errors: { nombre: ['El nombre del programa ya existe.'] }, message: 'Error: El nombre del programa ya existe.' };
        }
        return { message: 'Error en la base de datos.' };
    }
}

export async function deleteProgram(id: number) {
    try {
        await prisma.programa.delete({ where: { id } });
        revalidatePath('/admin');
        revalidatePath('/');
        revalidatePath('/summary');
        return { success: true, message: 'Programa eliminado.' };
    } catch (e) {
        return { success: false, message: 'Error al eliminar el programa.' };
    }
}

export async function createOrUpdateResponsible(prevState: any, formData: FormData) {
    const validatedFields = adminSchema.safeParse({
        id: formData.get('id') ? Number(formData.get('id')) : undefined,
        nombre: formData.get('nombre'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Error de validación.',
        };
    }

    const { id, nombre } = validatedFields.data;

    try {
        if (id) {
            await prisma.responsable.update({ where: { id }, data: { nombre } });
        } else {
            await prisma.responsable.create({ data: { nombre } });
        }
        revalidatePath('/admin');
        return { message: `Responsable ${id ? 'actualizado' : 'creado'}.` };
    } catch (e: unknown) {
         if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
            return { errors: { nombre: ['El nombre del responsable ya existe.'] }, message: 'Error: El nombre del responsable ya existe.' };
        }
        return { message: 'Error en la base de datos.' };
    }
}

export async function deleteResponsible(id: number) {
    try {
        await prisma.responsable.delete({ where: { id } });
        revalidatePath('/admin');
        revalidatePath('/');
        return { success: true, message: 'Responsable eliminado.' };
    } catch (e) {
        return { success: false, message: 'Error al eliminar el responsable.' };
    }
}