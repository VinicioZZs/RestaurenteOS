// lib/auth.ts - VERSÃO ATUALIZADA
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'garcom' | 'caixa';
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
      // Salva dados básicos no storage para o frontend
      localStorage.setItem('usuario_nome', data.user.name);
      localStorage.setItem('usuario_perfil', data.user.role);
      localStorage.setItem('usuario_email', data.user.email);
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
  localStorage.removeItem('auth_token');
  sessionStorage.removeItem('auth_token');
  localStorage.removeItem('usuario_nome');
  localStorage.removeItem('usuario_perfil');
  localStorage.removeItem('usuario_email');
  
  // Redireciona
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

export function getCurrentUser(): User | null {
  // Tenta pegar do localStorage (fallback)
  const nome = localStorage.getItem('usuario_nome');
  const role = localStorage.getItem('usuario_perfil') as User['role'];
  const email = localStorage.getItem('usuario_email');
  
  if (nome && role && email) {
    return { 
      id: Date.now(), 
      name: nome, 
      role, 
      email 
    };
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