// lib/api-auth.ts - Crie este arquivo
import { NextRequest } from 'next/server';

export interface APIUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'garcom' | 'caixa';
  isAdmin: boolean;
  isCaixa: boolean;
  isGarcom: boolean;
}

export function getAuthUser(request: NextRequest): APIUser | null {
  const id = request.headers.get('x-user-id');
  const email = request.headers.get('x-user-email');
  const name = request.headers.get('x-user-name');
  const role = request.headers.get('x-user-role') as APIUser['role'];
  
  if (!id || !role) {
    return null;
  }
  
  return {
    id,
    email: email || '',
    name: name || '',
    role: role || 'garcom',
    isAdmin: role === 'admin',
    isCaixa: role === 'caixa' || role === 'admin',
    isGarcom: role === 'garcom' || role === 'admin'
  };
}

export function requireRole(request: NextRequest, allowedRoles: APIUser['role'][]) {
  const user = getAuthUser(request);
  
  if (!user) {
    throw new Error('Usuário não autenticado');
  }
  
  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Acesso restrito. Permissões necessárias: ${allowedRoles.join(', ')}`);
  }
  
  return user;
}