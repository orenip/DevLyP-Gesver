import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const responsables = await prisma.responsable.findMany();
  return NextResponse.json(responsables);
}
