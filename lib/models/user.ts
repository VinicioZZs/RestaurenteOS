// app/lib/models/User.ts
export interface User {
  _id: string;
  email: string;
  nome: string;
  senhaHash: string; // Será hasheada
  role: 'admin' | 'gerente' | 'garcom' | 'caixa';
  
  // Permissões específicas
  permissoes: {
    // Gestão do sistema
    canManageUsers: boolean;
    canAccessSettings: boolean;
    canViewReports: boolean;
    
    // Produtos e Cardápio
    canManageProducts: boolean;
    canManageCategories: boolean;
    canManageAdicionais: boolean;
    
    // Comandas e Pedidos
    canOpenComanda: boolean;
    canCloseComanda: boolean;
    canRemoveItem: boolean;
    canClearComanda: boolean;
    canDeleteComanda: boolean;
    
    // Financeiro
    canProcessPayment: boolean;
    canGiveDiscount: boolean;
    canCancelPayment: boolean;
  };
  
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
  ultimoLogin?: string;
}

// Template de permissões por função
export const roleTemplates = {
  admin: {
    canManageUsers: true,
    canAccessSettings: true,
    canViewReports: true,
    canManageProducts: true,
    canManageCategories: true,
    canManageAdicionais: true,
    canOpenComanda: true,
    canCloseComanda: true,
    canRemoveItem: true,
    canClearComanda: true,
    canDeleteComanda: true,
    canProcessPayment: true,
    canGiveDiscount: true,
    canCancelPayment: true,
    canOpenCashier: true,
    canCloseCashier: true,
    canViewCashier: true,
    canManageCashWithdrawals: true,
  },
  gerente: {
    canManageUsers: false,
    canAccessSettings: true,
    canViewReports: true,
    canManageProducts: true,
    canManageCategories: true,
    canManageAdicionais: true,
    canOpenComanda: true,
    canCloseComanda: true,
    canRemoveItem: true,
    canClearComanda: true,
    canDeleteComanda: false,
    canProcessPayment: true,
    canGiveDiscount: true,
    canCancelPayment: true,
  },
  garcom: {
    canManageUsers: false,
    canAccessSettings: false,
    canViewReports: false,
    canManageProducts: false,
    canManageCategories: false,
    canManageAdicionais: false,
    canOpenComanda: true,
    canCloseComanda: false,
    canRemoveItem: true,
    canClearComanda: false,
    canDeleteComanda: false,
    canProcessPayment: false,
    canGiveDiscount: false,
    canCancelPayment: false,
  },
  caixa: {
    canManageUsers: false,
    canAccessSettings: false,
    canViewReports: true,
    canManageProducts: false,
    canManageCategories: false,
    canManageAdicionais: false,
    canOpenComanda: true,
    canCloseComanda: true,
    canRemoveItem: true,
    canClearComanda: false,
    canDeleteComanda: false,
    canProcessPayment: true,
    canGiveDiscount: true,
    canCancelPayment: true,
  }
};