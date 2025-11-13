import 'server-only';
import prisma from './prisma';
import { Entorno } from './definitions';

export async function fetchFilteredDeployments(
  query: string,
  entorno: string,
  programaId: string,
  responsableId: string,
) {
  try {
    const where: any = {};
    if (query) {
      where.OR = [
        { version: { contains: query } },
        { accion: { contains: query } },
        { comentario: { contains: query } },
        { programa: { nombre: { contains: query } } },
        { responsable: { nombre: { contains: query } } },
      ];
    }
    if (entorno && Object.values(Entorno).includes(entorno as Entorno)) {
        where.entorno = entorno;
    }
    if (programaId) {
        where.programaId = parseInt(programaId);
    }
    if (responsableId) {
        where.responsableId = parseInt(responsableId);
    }

    const deployments = await prisma.despliegue.findMany({
      where,
      include: {
        programa: true,
        responsable: true,
      },
      orderBy: {
        fecha: 'desc',
      },
    });
    return deployments;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch deployments.');
  }
}

export async function fetchPrograms() {
  try {
    const programas = await prisma.programa.findMany({
        orderBy: { nombre: 'asc' }
    });
    return programas;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch programs.');
  }
}

export async function fetchResponsibles() {
  try {
    const responsables = await prisma.responsable.findMany({
        orderBy: { nombre: 'asc' }
    });
    return responsables;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch responsables.');
  }
}

export async function fetchSummaryData() {
    try {
        const programas = await fetchPrograms();
        const summary = await Promise.all(
            programas.map(async (programa) => {
                const lastProd = await prisma.despliegue.findFirst({
                    where: { programaId: programa.id, entorno: 'Produccion' },
                    orderBy: { fecha: 'desc' },
                });
                const lastPre = await prisma.despliegue.findFirst({
                    where: { programaId: programa.id, entorno: 'Preproduccion' },
                    orderBy: { fecha: 'desc' },
                });

                return {
                    programa: programa.nombre,
                    produccion: lastProd ? { version: lastProd.version, fecha: lastProd.fecha } : null,
                    preproduccion: lastPre ? { version: lastPre.version, fecha: lastPre.fecha } : null,
                };
            })
        );
        return summary;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch summary data.');
    }
}


export async function fetchDeploymentById(id: number) {
    try {
        const deployment = await prisma.despliegue.findUnique({
            where: { id },
            include: {
                programa: true,
                responsable: true,
            },
        });
        return deployment;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch deployment.');
    }
}

export async function fetchLastDeploymentDate() {
    try {
        const lastDeployment = await prisma.despliegue.findFirst({
            orderBy: { fecha: 'desc' },
            select: { fecha: true }
        });
        return lastDeployment?.fecha ?? null;
    } catch (error) {
        console.error('Database Error:', error);
        throw new Error('Failed to fetch last deployment date.');
    }
}
