// lib/auth.ts - Verifique se está assim
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'garcom' | 'caixa';
}

const users: User[] = [
  { id: 1, email: 'admin@restaurante.com', name: 'Administrador', role: 'admin' },
  { id: 2, email: 'garcom@restaurante.com', name: 'João Garçom', role: 'garcom' },
  { id: 3, email: 'caixa@restaurante.com', name: 'Maria Caixa', role: 'caixa' },
];

export async function login(email: string, password: string): Promise<{ user: User | null; token: string | null }> {
  const user = users.find(u => u.email === email);
  
  if (user && password === '123456') {
    const tokenData = { 
      id: user.id, 
      email: user.email,
      name: user.name,
      role: user.role,
      timestamp: Date.now()
    };
    const token = btoa(JSON.stringify(tokenData));
    return { user, token };
  }
  
  return { user: null, token: null };
}

export function logout(): void {
  localStorage.removeItem('auth_token');
  sessionStorage.removeItem('auth_token');
  localStorage.removeItem('usuario_nome');
  localStorage.removeItem('usuario_perfil');
  localStorage.removeItem('usuario_email');
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  
  if (token) {
    try {
      const decoded = JSON.parse(atob(token));
      return users.find(u => u.id === decoded.id) || null;
    } catch (error) {
      console.error('Erro ao decodificar token:', error);
      return null;
    }
  }
  
  // Fallback para dados separados
  const nome = localStorage.getItem('usuario_nome');
  const role = localStorage.getItem('usuario_perfil') as User['role'];
  const email = localStorage.getItem('usuario_email');
  
  if (nome && role && email) {
    return { id: Date.now(), name: nome, role, email };
  }
  
  return null;
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}

export function hasRole(role: User['role']): boolean {
  const user = getCurrentUser();
  return user?.role === role || false;
} 