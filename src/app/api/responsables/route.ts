import { NextResponse } from 'next/server';
import { fetchResponsibles } from '@/lib/data';

export async function GET() {
  const responsables = await fetchResponsibles();
  return NextResponse.json(responsables);
}
