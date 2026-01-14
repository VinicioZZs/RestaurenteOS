// lib/auth.ts - Sistema simples de autenticação
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'garcom' | 'caixa';
}

// Usuários mockados (depois trocar por banco de dados)
const users: User[] = [
  { id: 1, email: 'admin@restaurante.com', name: 'Administrador', role: 'admin' },
  { id: 2, email: 'garcom@restaurante.com', name: 'João Garçom', role: 'garcom' },
  { id: 3, email: 'caixa@restaurante.com', name: 'Maria Caixa', role: 'caixa' },
];

export async function login(email: string, password: string): Promise<{ user: User | null; token: string | null }> {
  // Em produção, verificar no banco de dados
  const user = users.find(u => u.email === email);
  
  if (user && password === '123456') { // Senha padrão para demo
    const token = btoa(JSON.stringify({ id: user.id, email: user.email }));
    return { user, token };
  }
  
  return { user: null, token: null };
}

export function logout(): void {
  localStorage.removeItem('auth_token');
  sessionStorage.removeItem('auth_token');
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  if (!token) return null;
  
  try {
    const decoded = JSON.parse(atob(token));
    return users.find(u => u.id === decoded.id) || null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

export function hasRole(role: User['role']): boolean {
  const user = getCurrentUser();
  return user?.role === role || false;
}