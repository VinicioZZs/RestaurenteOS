// app/middleware.ts - VERSÃO FINAL COM TODAS SUAS APIs
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const fullPath = pathname + search;
  
  console.log('🔐 Middleware:', {
    path: fullPath,
    method: request.method
  });
  
  // 🔥 ROTAS COMPLETAMENTE PÚBLICAS (SEM AUTENTICAÇÃO)
  const PUBLIC_ROUTES = [
    // Páginas web
    '/',                     // Login page
    '/login',               // Login page
    
    // APIs de autenticação (precisam ser públicas)
    '/api/auth/login',      // API de login (óbvio)
    '/api/auth/logout',     // API de logout (permite sem auth)
    '/api/auth/debug',      // Debug
    
    // Assets do Next.js
    '/_next',
    '/favicon.ico',
  ];
  
  // Verificar se é rota pública
  const isPublicRoute = PUBLIC_ROUTES.some(route => {
    return fullPath.startsWith(route);
  });
  
  if (isPublicRoute) {
    console.log('✅ Rota pública, acesso permitido');
    return NextResponse.next();
  }
  
  // 🔥 A PARTIR DAQUI, TUDO PRECISA DE AUTENTICAÇÃO
  // Isso inclui TODAS suas APIs (exceto as listadas acima)
  
  const token = request.cookies.get('auth_token')?.value;
  
  if (!token) {
    console.log('❌ Acesso negado: sem token de autenticação');
    
    // 🔥 DIFERENCIAR ENTRE API E PÁGINA WEB
    if (pathname.startsWith('/api/')) {
      // API → retorna JSON error
      return NextResponse.json(
        { 
          success: false, 
          error: 'Não autenticado',
          code: 'UNAUTHORIZED',
          message: 'Faça login para acessar esta API'
        },
        { status: 401 }
      );
    } else {
      // Página web → redireciona para login
      const loginUrl = new URL('/login', request.url);
      if (pathname !== '/') {
        loginUrl.searchParams.set('callbackUrl', encodeURI(fullPath));
      }
      return NextResponse.redirect(loginUrl);
    }
  }
  
  // 🔥 VALIDAR TOKEN
  try {
    const decodedStr = Buffer.from(token, 'base64').toString('utf-8');
    const decoded = JSON.parse(decodedStr);
    
    // Verificar se token expirou
    if (decoded.exp && decoded.exp < Date.now()) {
      throw new Error('Token expirado');
    }
    
    console.log('✅ Usuário autenticado:', {
      id: decoded.id,
      name: decoded.name,
      role: decoded.role,
      email: decoded.email
    });
    
    // 🔥 ADICIONA DADOS DO USUÁRIO NO HEADER (PARA APIs)
    if (pathname.startsWith('/api/')) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', decoded.id?.toString() || '');
      requestHeaders.set('x-user-email', decoded.email || '');
      requestHeaders.set('x-user-name', decoded.name || '');
      requestHeaders.set('x-user-role', decoded.role || '');
      
      // 🔥 ADICIONA PERMISSÕES BASEADAS NO ROLE
      requestHeaders.set('x-permission-admin', (decoded.role === 'admin').toString());
      requestHeaders.set('x-permission-caixa', (decoded.role === 'caixa' || decoded.role === 'admin').toString());
      requestHeaders.set('x-permission-garcom', (decoded.role === 'garcom' || decoded.role === 'admin').toString());
      
      console.log('👤 Headers adicionados para API:', {
        userId: decoded.id,
        userRole: decoded.role
      });
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
    
    // Se tentar acessar raiz já autenticado, vai para dashboard
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    return NextResponse.next();
    
  } catch (error: any) {
    console.error('❌ Token inválido:', error.message);
    
    // Limpar cookie inválido
    const response = pathname.startsWith('/api/') 
      ? NextResponse.json(
          { 
            success: false, 
            error: 'Token inválido ou expirado',
            code: 'INVALID_TOKEN'
          },
          { status: 401 }
        )
      : NextResponse.redirect(new URL('/login?expired=true', request.url));
    
    response.cookies.delete('auth_token');
    return response;
  }
}

export const config = {
  matcher: [
    // Intercepta TUDO, exceto:
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:ico|png|jpg|jpeg|gif|svg|css|js)$).*)',
  ],
};