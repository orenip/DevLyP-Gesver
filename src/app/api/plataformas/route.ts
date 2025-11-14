import { NextResponse } from 'next/server';
import { repository } from '@/lib/repository';

export async function GET() {
  const plataformas = await repository.getPlatforms();
  return NextResponse.json(plataformas);
}
