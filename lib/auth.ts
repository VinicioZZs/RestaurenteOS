// lib/auth.ts - VERSÃO ATUALIZADA
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'garcom' | 'caixa';
    permissions?: string[]; // Adicione esta linha

}

interface LoginResponse {
  user: User | null;
  token?: string; 
}

const users = [
  { id: 1, email: 'admin@restaurante.com', name: 'Administrador', role: 'admin' },
  { id: 2, email: 'garcom@restaurante.com', name: 'João Garçom', role: 'garcom' },
  { id: 3, email: 'caixa@restaurante.com', name: 'Maria Caixa', role: 'caixa' },
];

export async function login(email: string, password: string): Promise<{ user: User | null }> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      // ✅ SALVA O USUÁRIO COMPLETO COM PERMISSÕES
      localStorage.setItem('user', JSON.stringify(data.user)); // ← MUDOU AQUI
      return { user: data.user };
    }
    
    return { user: null };
  } catch (error) {
    console.error('Erro na API de login:', error);
    return { user: null };
  }
}

export function logout(): void {
  // Chama API de logout
  fetch('/api/auth/logout', { method: 'POST' })
    .catch(console.error);
  
  // Limpa frontend
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    localStorage.removeItem('usuario_nome');
    localStorage.removeItem('usuario_perfil');
    localStorage.removeItem('usuario_email');
  
  // Redireciona
    window.location.href = '/login';
  }
}

export function getCurrentUser(): User | null {
  // ✅ Pega o usuário completo do localStorage
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch (e) {
      console.error('Erro ao parsear usuário:', e);
    }
  }
  return null;
}

export function isAuthenticated(): boolean {
  // Verifica se tem token no cookie (isso o middleware verifica)
  // Aqui só verificamos se temos dados no localStorage
  return !!getCurrentUser();
}

export function hasRole(role: User['role']): boolean {
  const user = getCurrentUser();
  return user?.role === role || false;
}