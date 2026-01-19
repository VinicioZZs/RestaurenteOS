// app/lib/utils/permissions.ts
// Sistema básico de permissões

export type PerfilUsuario = 
  | 'admin'        // Administrador total
  | 'gerente'      // Gerente do estabelecimento
  | 'caixa'        // Operador de caixa
  | 'garcom'       // Garçom/atendente
  | 'cozinha';     // Apenas cozinha

export const PERMISSOES = {
  ABRIR_CAIXA: ['admin', 'gerente', 'caixa'] as PerfilUsuario[],
  FECHAR_CAIXA: ['admin', 'gerente', 'caixa'] as PerfilUsuario[],
  ACESSAR_COMANDAS: ['admin', 'gerente', 'garcom', 'caixa'] as PerfilUsuario[],
  ACESSAR_DASHBOARD: ['admin', 'gerente', 'garcom', 'caixa'] as PerfilUsuario[],
  GERENCIAR_PRODUTOS: ['admin', 'gerente'] as PerfilUsuario[],
  GERENCIAR_USUARIOS: ['admin'] as PerfilUsuario[],
  ACESSAR_RELATORIOS: ['admin', 'gerente'] as PerfilUsuario[],
  FAZER_SANGRIA: ['admin', 'gerente'] as PerfilUsuario[],
  FAZER_SUPRIMENTO: ['admin', 'gerente'] as PerfilUsuario[],
};

/**
 * Verifica se um usuário tem determinada permissão
 */
export function verificarPermissao(
  usuarioPerfil: PerfilUsuario | string, 
  permissao: keyof typeof PERMISSOES
): boolean {
  const perfisPermitidos = PERMISSOES[permissao];
  return perfisPermitidos.includes(usuarioPerfil as PerfilUsuario);
}

/**
 * Obtém o perfil do usuário atual do localStorage
 */
export function obterPerfilUsuario(): PerfilUsuario {
  if (typeof window === 'undefined') return 'garcom';
  
  const perfilSalvo = localStorage.getItem('usuario_perfil');
  
  // Validação de perfis válidos
  const perfisValidos: PerfilUsuario[] = ['admin', 'gerente', 'caixa', 'garcom', 'cozinha'];
  
  if (perfilSalvo && perfisValidos.includes(perfilSalvo as PerfilUsuario)) {
    return perfilSalvo as PerfilUsuario;
  }
  
  // Padrão para desenvolvimento
  return 'garcom';
}

/**
 * Obtém o nome do usuário atual
 */
export function obterNomeUsuario(): string {
  if (typeof window === 'undefined') return 'Operador';
  
  return localStorage.getItem('usuario_nome') || 'Operador';
}

/**
 * Verifica todas as permissões de uma vez
 */
export function verificarPermissoesUsuario(): Record<string, boolean> {
  const perfil = obterPerfilUsuario();
  const permissoes: Record<string, boolean> = {};
  
  Object.keys(PERMISSOES).forEach(permissao => {
    permissoes[permissao] = verificarPermissao(perfil, permissao as keyof typeof PERMISSOES);
  });
  
  return permissoes;
}