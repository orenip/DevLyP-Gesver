import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const programas = await prisma.programa.findMany();
  return NextResponse.json(programas);
}
