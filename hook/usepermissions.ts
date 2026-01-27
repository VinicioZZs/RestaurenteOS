// hooks/usePermissions.ts
import { useEffect, useState } from 'react';

export interface UserPermissions {
  canManageUsers: boolean;
  canAccessSettings: boolean;
  canViewReports: boolean;
  canManageProducts: boolean;
  canManageCategories: boolean;
  canManageAdicionais: boolean;
  canOpenComanda: boolean;
  canCloseComanda: boolean;
  canRemoveItem: boolean;
  canClearComanda: boolean;
  canDeleteComanda: boolean;
  canProcessPayment: boolean;
  canGiveDiscount: boolean;
  canCancelPayment: boolean;
}

export default function usePermissions() {
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carregar permissões do usuário logado
    // Pode vir do localStorage, cookie ou API
    const loadPermissions = async () => {
      try {
        const token = localStorage.getItem('user_token');
        if (token) {
          // Decodificar JWT para pegar permissões
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          
          const user = JSON.parse(jsonPayload);
          setPermissions(user.permissoes);
        }
      } catch (error) {
        console.error('Erro ao carregar permissões:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, []);

  return { permissions, loading };
}