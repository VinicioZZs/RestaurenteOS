// app/api/auth/debug/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    method: 'GET',
    cookies: Object.fromEntries(request.cookies),
    headers: Object.fromEntries(request.headers),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  return NextResponse.json({
    method: 'POST',
    body: body,
    cookies: Object.fromEntries(request.cookies),
    headers: Object.fromEntries(request.headers),
  });
}