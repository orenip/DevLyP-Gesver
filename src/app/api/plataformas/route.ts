import { NextResponse } from 'next/server';
import { fetchPlatforms } from '@/lib/data';

export async function GET() {
  const plataformas = await fetchPlatforms();
  return NextResponse.json(plataformas);
}
