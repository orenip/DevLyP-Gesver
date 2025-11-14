import { NextResponse } from 'next/server';
import { fetchPrograms } from '@/lib/data';

export async function GET() {
  const programas = await fetchPrograms();
  return NextResponse.json(programas);
}
