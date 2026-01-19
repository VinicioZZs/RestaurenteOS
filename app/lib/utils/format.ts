// app/lib/utils/format.ts
/**
 * Funções de formatação comuns para o sistema
 */

/**
 * Formata valor monetário
 */
export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valor);
}

/**
 * Formata data completa
 */
export function formatarData(data: Date | string): string {
  const dataObj = typeof data === 'string' ? new Date(data) : data;
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dataObj);
}

/**
 * Formata apenas hora
 */
export function formatarHora(data: Date | string): string {
  const dataObj = typeof data === 'string' ? new Date(data) : data;
  
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(dataObj);
}

/**
 * Formata CPF
 */
export function formatarCPF(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata telefone
 */
export function formatarTelefone(telefone: string): string {
  const apenasNumeros = telefone.replace(/\D/g, '');
  
  if (apenasNumeros.length === 11) {
    return apenasNumeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (apenasNumeros.length === 10) {
    return apenasNumeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return telefone;
}

/**
 * Formata porcentagem
 */
export function formatarPorcentagem(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2
  }).format(valor / 100);
}

/**
 * Formata número com separadores
 */
export function formatarNumero(valor: number): string {
  return new Intl.NumberFormat('pt-BR').format(valor);
}

/**
 * Formata bytes para tamanho legível
 */
export function formatarBytes(bytes: number): string {
  const unidades = ['B', 'KB', 'MB', 'GB', 'TB'];
  let tamanho = bytes;
  let unidadeIndex = 0;
  
  while (tamanho >= 1024 && unidadeIndex < unidades.length - 1) {
    tamanho /= 1024;
    unidadeIndex++;
  }
  
  return `${tamanho.toFixed(1)} ${unidades[unidadeIndex]}`;
}