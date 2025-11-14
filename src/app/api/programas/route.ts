import { NextResponse } from 'next/server';
import { repository } from '@/lib/repository';

export async function GET() {
  const programas = await repository.getPrograms();
  return NextResponse.json(programas);
}
