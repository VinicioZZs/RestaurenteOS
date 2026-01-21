// app/middleware.ts - VERSÃO CORRIGIDA
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const fullPath = pathname + search;
  
  console.log('🚨 Middleware interceptando:', {
    path: fullPath,
    method: request.method
  });
  
  // 🔥 LISTA COMPLETA DE ROTAS PÚBLICAS
  const PUBLIC_ROUTES = [
    '/',                     // Página inicial/login
    '/login',               // Página de login
    '/api/auth/login',      // API de login
    '/api/auth/logout',     // API de logout
    '/api/auth/debug',      // API de debug
    '/api/test-auth',       // API de teste
    '/_next',               // Assets do Next.js
    '/favicon.ico',         // Favicon
  ];
  
  // Verificar se é rota pública
  const isPublicRoute = PUBLIC_ROUTES.some(route => {
    // Verifica se começa com a rota
    return fullPath.startsWith(route);
  });
  
  if (isPublicRoute) {
    console.log('✅ Rota pública, acesso permitido');
    return NextResponse.next();
  }
  
  // 🔥 VERIFICAR AUTENTICAÇÃO
  const token = request.cookies.get('auth_token')?.value;
  
  if (!token) {
    console.log('❌ Usuário não autenticado, redirecionando para login');
    
    // 🔥 IMPORTANTE: Criar URL de login CORRETA
    const loginUrl = new URL('/login', request.url);
    
    // Se não está tentando acessar a raiz, adiciona callbackUrl
    if (pathname !== '/') {
      loginUrl.searchParams.set('callbackUrl', encodeURI(fullPath));
    }
    
    console.log('🔀 Redirecionando para:', loginUrl.toString());
    
    return NextResponse.redirect(loginUrl);
  }
  
  // 🔥 VALIDAR TOKEN
  try {
    const decodedStr = Buffer.from(token, 'base64').toString('utf-8');
    const decoded = JSON.parse(decodedStr);
    
    console.log('✅ Usuário autenticado:', {
      id: decoded.id,
      name: decoded.name,
      role: decoded.role
    });
    
    // Se o usuário está tentando acessar a raiz, redireciona para dashboard
    if (pathname === '/') {
      console.log('🏠 Raiz acessada, redirecionando para dashboard');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    return NextResponse.next();
    
  } catch (error: any) {
    console.error('❌ Token inválido:', error.message);
    
    // Limpar cookie inválido
    const response = NextResponse.redirect(new URL('/login?expired=true', request.url));
    response.cookies.delete('auth_token');
    
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:ico|png|jpg|jpeg|gif|svg|css|js)$).*)',
  ],
};