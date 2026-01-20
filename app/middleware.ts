// app/middleware.ts (raiz do projeto)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Rotas que SEMPRE permitem acesso
  const rotasPublicas = [
    '/',
    '/login',
    '/caixa',
    '/caixa/abertura',
    '/caixa/fechamento',
    '/configuracao',
    '/api/caixa'
  ];
  
  // Se é rota pública, permite
  const rotaPublica = rotasPublicas.some(rota => 
    pathname === rota || pathname.startsWith(`${rota}/`)
  );
  
  if (rotaPublica) {
    return NextResponse.next();
  }
  
  // Para /dashboard e /mesas, verificar caixa
  if (pathname === '/dashboard' || pathname.startsWith('/mesas/')) {
    try {
      const caixaResponse = await fetch(`${request.nextUrl.origin}/api/caixa/status`);
      const caixaData = await caixaResponse.json();
      
      if (caixaData.success && caixaData.data.status === 'fechado') {
        // Redireciona para dashboard (que vai mostrar tela de caixa fechado)
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      }
    } catch (error) {
      console.error('Erro middleware:', error);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};