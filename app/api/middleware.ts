// app/api/middleware.ts (NOVO ARQUIVO!)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;
  
  console.log(`🔐 API middleware: ${pathname}`);
  
  // 🔥 APIs PÚBLICAS (permitir SEM token)
  const publicAPIs = [
    '/api/auth/login',
    '/api/auth/logout',
    '/api/auth/debug',
    '/api/test-auth'
  ];
  
  if (publicAPIs.includes(pathname)) {
    return NextResponse.next();
  }
  
  // 🔥 QUALQUER OUTRA API PRECISA DE TOKEN
  if (!token) {
    console.log(`🚫 API bloqueada: ${pathname}`);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Não autenticado',
        code: 'UNAUTHORIZED'
      },
      { status: 401 }
    );
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};