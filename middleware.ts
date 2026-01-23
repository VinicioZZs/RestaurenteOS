// middleware.ts - LOCALIZADO NA RAIZ DO PROJETO, serve pro middleware redirecionar pra pagina de login mané
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const fullPath = pathname + search;
  
  console.log('🔐 Middleware a verificar rota:', fullPath);
  
  // 1. DEFINIÇÃO DE ROTAS PÚBLICAS
  // Adicionamos a raiz '/' como pública pois é onde fica o seu login original
  const PUBLIC_ROUTES = [
    '/',
    '/api/auth/login',
    '/api/auth/logout',
    '/api/auth/debug',
    '/_next',
    '/favicon.ico',
  ];
  
  const isPublicRoute = PUBLIC_ROUTES.some(route => {
    if (route === '/') return pathname === '/';
    return pathname.startsWith(route);
  });
  
  if (isPublicRoute) {
    console.log('✅ Rota pública ou raiz, acesso livre');
    return NextResponse.next();
  }
  
  // 2. VERIFICAÇÃO DO TOKEN (Cookie)
  const token = request.cookies.get('auth_token')?.value;
  
  if (!token || token === 'undefined' || token === '') {
    console.log('❌ Sem token válido. A redirecionar para o login principal...');
    
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Sessão expirada' },
        { status: 401 }
      );
    } 
    
    // REDIRECIONAMENTO CORRIGIDO: Agora aponta para '/' (sua tela Servyx)
    const loginUrl = new URL('/', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('callbackUrl', encodeURI(fullPath));
    }
    return NextResponse.redirect(loginUrl);
  }
  
  // 3. VALIDAÇÃO DO CONTEÚDO DO TOKEN
  try {
    const decodedStr = Buffer.from(token, 'base64').toString('utf-8');
    const decoded = JSON.parse(decodedStr);
    
    if (decoded.exp && decoded.exp < Date.now()) {
      throw new Error('Token expirado');
    }
    
    if (pathname.startsWith('/api/')) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', decoded.id?.toString() || '');
      requestHeaders.set('x-user-role', decoded.role || '');
      
      return NextResponse.next({
        request: { headers: requestHeaders },
      });
    }
    
    return NextResponse.next();
    
  } catch (error: any) {
    console.error('❌ Erro no Token:', error.message);
    
    const response = pathname.startsWith('/api/') 
      ? NextResponse.json({ success: false, error: 'Sessão inválida' }, { status: 401 })
      : NextResponse.redirect(new URL('/?expired=true', request.url)); // Redireciona para a raiz com aviso
    
    response.cookies.delete('auth_token');
    return response;
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};