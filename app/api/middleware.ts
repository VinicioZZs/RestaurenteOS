// app/api/middleware.ts (ATUALIZADO)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Função para decodificar token JWT
function decodeToken(token: string): any {
  try {
    const base64Payload = token.split('.')[1];
    const payload = Buffer.from(base64Payload, 'base64').toString('utf-8');
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;
  
  // APIs PÚBLICAS
  const publicAPIs = [
    '/api/auth/login',
    '/api/auth/logout',
    '/api/auth/debug',
    '/api/test-auth'
  ];
  
  if (publicAPIs.includes(pathname)) {
    return NextResponse.next();
  }
  
  // Verificar autenticação
  if (!token) {
    console.log(`🚫 API bloqueada: ${pathname} - Sem token`);
    return NextResponse.json(
      { success: false, error: 'Não autenticado', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }
  
  // Decodificar token
  const user = decodeToken(token);
  if (!user) {
    console.log(`🚫 Token inválido: ${pathname}`);
    return NextResponse.json(
      { success: false, error: 'Token inválido', code: 'INVALID_TOKEN' },
      { status: 401 }
    );
  }
  
  // Verificar permissões específicas para rotas sensíveis
  if (pathname.startsWith('/api/usuarios')) {
    // Apenas admin pode gerenciar usuários
    if (!user.permissoes?.canManageUsers) {
      console.log(`🚫 Acesso negado a ${pathname} - Sem permissão`);
      return NextResponse.json(
        { success: false, error: 'Acesso negado', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }
  }
  
  if (pathname.startsWith('/api/configuracoes')) {
    // Apenas quem pode acessar configurações
    if (!user.permissoes?.canAccessSettings) {
      console.log(`🚫 Acesso negado a ${pathname} - Sem permissão`);
      return NextResponse.json(
        { success: false, error: 'Acesso negado', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};