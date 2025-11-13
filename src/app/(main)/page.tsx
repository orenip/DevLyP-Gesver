import prisma from '@/lib/prisma';
import { DeploymentsTable } from '@/components/deployments/deployments-table';
import { SummaryView } from '@/components/deployments/summary-view';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Suspense } from 'react';
import { TableSkeleton } from '@/components/skeletons';

export default async function Home({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    entorno?: string;
    programaId?: string;
    responsableId?: string;
  };
}) {
  const query = searchParams?.query || '';
  const entorno = searchParams?.entorno || '';
  const programaId = searchParams?.programaId;
  const responsableId = searchParams?.responsableId;

  const where: any = {};
  if (query) {
    where.OR = [
      { programa: { nombre: { contains: query } } },
      { version: { contains: query } },
      { responsable: { nombre: { contains: query } } },
      { comentario: { contains: query } },
      { accion: { contains: query } },
    ];
  }
  if (entorno) {
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

  const summary = await prisma.despliegue.groupBy({
    by: ['programaId', 'entorno'],
    _max: {
      version: true,
    },
    orderBy: {
      programaId: 'asc'
    }
  });

  const programs = await prisma.programa.findMany();
  const responsibles = await prisma.responsable.findMany();

  const summaryWithProgramNames = summary.map(s => {
    const program = programs.find(p => p.id === s.programaId);
    return {
      ...s,
      programaNombre: program?.nombre || 'Desconocido'
    }
  });

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Versiones</CardTitle>
            </CardHeader>
            <CardContent>
              <SummaryView summary={summaryWithProgramNames} />
            </CardContent>
          </Card>
        </div>
        <Suspense fallback={<TableSkeleton />}>
           <DeploymentsTable 
            deployments={deployments} 
            programs={programs}
            responsibles={responsibles}
          />
        </Suspense>
      </main>
    </div>
  );
}
