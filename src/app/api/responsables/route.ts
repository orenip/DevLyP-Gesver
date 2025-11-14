import { NextResponse } from 'next/server';
import { repository } from '@/lib/repository';

export async function GET() {
  const responsables = await repository.getResponsibles();
  return NextResponse.json(responsables);
}
