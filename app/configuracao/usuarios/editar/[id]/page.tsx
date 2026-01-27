// app/configuracao/usuarios/editar/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Save, 
  ArrowLeft, 
  User, 
  Shield,
  Check,
  X,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface Permissoes {
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

type UserRole = 'admin' | 'gerente' | 'garcom' | 'caixa';

const roleTemplates: Record<UserRole, Permissoes> = {
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

const todasPermissoes = [
  { id: 'canManageUsers', nome: 'Gerenciar Usuários', descricao: 'Pode adicionar/editar/excluir usuários', categoria: 'Sistema' },
  { id: 'canAccessSettings', nome: 'Acessar Configurações', descricao: 'Pode acessar todas as configurações', categoria: 'Sistema' },
  { id: 'canViewReports', nome: 'Visualizar Relatórios', descricao: 'Pode acessar a aba de relatórios', categoria: 'Sistema' },
  { id: 'canManageProducts', nome: 'Gerenciar Produtos', descricao: 'Pode adicionar/editar/excluir produtos', categoria: 'Cardápio' },
  { id: 'canManageCategories', nome: 'Gerenciar Categorias', descricao: 'Pode gerenciar categorias de produtos', categoria: 'Cardápio' },
  { id: 'canManageAdicionais', nome: 'Gerenciar Adicionais', descricao: 'Pode gerenciar itens adicionais', categoria: 'Cardápio' },
  { id: 'canOpenComanda', nome: 'Abrir Comanda', descricao: 'Pode abrir novas comandas', categoria: 'Comandas' },
  { id: 'canCloseComanda', nome: 'Fechar Comanda', descricao: 'Pode fechar e processar pagamentos', categoria: 'Comandas' },
  { id: 'canRemoveItem', nome: 'Remover Item', descricao: 'Pode remover itens da comanda', categoria: 'Comandas' },
  { id: 'canClearComanda', nome: 'Limpar Comanda', descricao: 'Pode limpar toda a comanda', categoria: 'Comandas' },
  { id: 'canDeleteComanda', nome: 'Excluir Comanda', descricao: 'Pode excluir comandas permanentemente', categoria: 'Comandas' },
  { id: 'canProcessPayment', nome: 'Processar Pagamento', descricao: 'Pode realizar pagamentos', categoria: 'Financeiro' },
  { id: 'canGiveDiscount', nome: 'Dar Desconto', descricao: 'Pode aplicar descontos', categoria: 'Financeiro' },
  { id: 'canCancelPayment', nome: 'Cancelar Pagamento', descricao: 'Pode cancelar pagamentos', categoria: 'Financeiro' },
  { id: 'canManagePayments', nome: 'Gerenciar Meios de Pagamento', descricao: 'Pode configurar formas de pagamento personalizadas', categoria: 'Financeiro' },

];

const categoriasPermissoes = Array.from(new Set(todasPermissoes.map(p => p.categoria)));

export default function EditarUsuarioPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    role: 'garcom' as UserRole,
    ativo: true,
    permissoes: roleTemplates.garcom
  });
  
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [usuarioLogado, setUsuarioLogado] = useState<any>(null);

  useEffect(() => {
    // Carrega usuário logado
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUsuarioLogado(JSON.parse(userStr));
      } catch (e) {
        console.error('Erro ao carregar usuário logado:', e);
      }
    }
    
    if (id) {
      carregarUsuario(id);
    }
  }, [id]);

  const carregarUsuario = async (usuarioId: string) => {
  try {
    setCarregando(true);
    console.log('🔄 Carregando usuário ID:', usuarioId);
    
    const response = await fetch(`/api/usuarios/${usuarioId}`);
    
    console.log('📥 Resposta da API:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    });
    
    if (!response.ok) {
      throw new Error(`Erro ${response.status}: ${response.statusText}`);
    }
    
    // Verificar se a resposta tem conteúdo
    const responseText = await response.text();
    console.log('📄 Conteúdo da resposta:', responseText);
    
    if (!responseText) {
      throw new Error('Resposta vazia da API');
    }
    
    const data = JSON.parse(responseText);
    console.log('📊 Dados parseados:', data);
    
    if (data.success) {
      const usuario = data.data;
      
      // Garantir que o role é válido
      const roleValido: UserRole = ['admin', 'gerente', 'garcom', 'caixa'].includes(usuario.role)
        ? usuario.role as UserRole
        : 'garcom';
      
      setFormData({
        nome: usuario.nome,
        email: usuario.email,
        senha: '',
        confirmarSenha: '',
        role: roleValido,
        ativo: usuario.ativo,
        permissoes: usuario.permissoes || roleTemplates[roleValido]
      });
    } else {
      setErro(data.error || 'Erro ao carregar usuário');
    }
  } catch (error: any) {
    console.error('❌ Erro ao carregar usuário:', error);
    setErro(`Erro: ${error.message}`);
  } finally {
    setCarregando(false);
  }
};

  const handleRoleChange = (role: UserRole) => {
    setFormData({
      ...formData,
      role,
      permissoes: roleTemplates[role]
    });
  };

  const togglePermissao = (permissaoId: string) => {
    setFormData({
      ...formData,
      permissoes: {
        ...formData.permissoes,
        [permissaoId]: !formData.permissoes[permissaoId as keyof Permissoes]
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    
    // Validações
    if (!formData.nome.trim()) {
      setErro('Nome é obrigatório');
      return;
    }
    
    if (!formData.email.trim()) {
      setErro('Email é obrigatório');
      return;
    }
    
    if (formData.senha && formData.senha !== formData.confirmarSenha) {
      setErro('As senhas não conferem');
      return;
    }
    
    // Verificar se usuário logado tem permissão
    if (!usuarioLogado?.permissoes?.canManageUsers) {
      setErro('Você não tem permissão para editar usuários');
      return;
    }
    
     try {
    setSalvando(true);
    
    const payload = {
      nome: formData.nome,
      email: formData.email,
      role: formData.role,
      ativo: formData.ativo,
      permissoes: formData.permissoes,
      ...(formData.senha && { senha: formData.senha })
    };
    
    console.log('📤 Enviando para API PUT:', {
      url: `/api/usuarios/${id}`,
      payload
    });
    
    const response = await fetch(`/api/usuarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    console.log('📥 Resposta da API PUT:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    });
    
    // VERIFIQUE SE TEM CONTEÚDO
    const responseText = await response.text();
    console.log('📄 Conteúdo da resposta:', responseText);
    
    if (!responseText) {
      throw new Error('Resposta vazia da API');
    }
    
    const data = JSON.parse(responseText);
    console.log('📊 Dados parseados:', data);
    
    if (data.success) {
      alert('Usuário atualizado com sucesso!');
      router.push('/configuracao/usuarios');
    } else {
      setErro(data.error || 'Erro ao salvar usuário');
    }
  } catch (error: any) {
    console.error('❌ Erro completo ao salvar:', error);
    setErro(`Erro: ${error.message}`);
  } finally {
    setSalvando(false);
  }
};

  if (carregando) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando usuário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <button
            onClick={() => router.push('/configuracao/usuarios')}
            className="mr-4 p-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Editar Usuário
            </h1>
            <p className="text-gray-600">
              Atualize os dados do usuário
            </p>
          </div>
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={salvando}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center"
        >
          {salvando ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              Salvar Alterações
            </>
          )}
        </button>
      </div>

      {erro && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {erro}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário Básico */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <User className="h-5 w-5 mr-2 text-purple-600" />
              Informações Básicas
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ex: João da Silva"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="usuario@restaurante.com"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nova Senha
                  </label>
                  <input
                    type="password"
                    value={formData.senha}
                    onChange={(e) => setFormData({...formData, senha: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Deixe em branco para manter atual"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Deixe vazio para não alterar
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Senha
                  </label>
                  <input
                    type="password"
                    value={formData.confirmarSenha}
                    onChange={(e) => setFormData({...formData, confirmarSenha: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Digite novamente a senha"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Permissões */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-purple-600" />
              Permissões e Acessos
            </h2>
            
            <div className="space-y-6">
              {/* Seletor de Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Função do Usuário
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(roleTemplates).map(([role, template]) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleRoleChange(role as UserRole)}
                      className={`p-4 rounded-xl border-2 flex flex-col items-center transition-all ${
                        formData.role === role
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl mb-2">
                        {role === 'admin' ? '👑' : 
                         role === 'gerente' ? '👔' : 
                         role === 'garcom' ? '🍽️' : '💰'}
                      </span>
                      <span className="font-medium capitalize text-gray-900">{role}</span>
                      <span className="text-xs text-gray-500 mt-1">
                        {role === 'admin' ? 'Acesso total' :
                         role === 'gerente' ? 'Gerenciamento' :
                         role === 'garcom' ? 'Atendimento' : 'Caixa'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900">Usuário Ativo</span>
                  <p className="text-sm text-gray-500">Usuário pode fazer login no sistema</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, ativo: !formData.ativo})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    formData.ativo ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    formData.ativo ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              
              {/* Permissões Específicas */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Permissões Específicas
                  </label>
                  <span className="text-sm text-gray-500">
                    {Object.values(formData.permissoes).filter(Boolean).length} de {Object.keys(formData.permissoes).length} ativas
                  </span>
                </div>
                
                <div className="space-y-3">
                  {categoriasPermissoes.map((categoria) => (
                    <div key={categoria} className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b">
                        <h3 className="font-medium text-gray-900">{categoria}</h3>
                      </div>
                      <div className="p-4">
                        <div className="space-y-3">
                          {todasPermissoes
                            .filter(p => p.categoria === categoria)
                            .map((permissao) => (
                              <div key={permissao.id} className="flex items-center justify-between">
                                <div>
                                  <span className="font-medium text-gray-900">{permissao.nome}</span>
                                  <p className="text-sm text-gray-500">{permissao.descricao}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => togglePermissao(permissao.id)}
                                  className={`p-2 rounded-lg ${
                                    formData.permissoes[permissao.id as keyof Permissoes]
                                      ? 'bg-green-100 text-green-600'
                                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                  }`}
                                >
                                  {formData.permissoes[permissao.id as keyof Permissoes] ? (
                                    <Check className="h-5 w-5" />
                                  ) : (
                                    <X className="h-5 w-5" />
                                  )}
                                </button>
                              </div>
                            ))
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <div className="bg-white rounded-xl border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">
                Prévia do Usuário
              </h2>
              
              <div className="text-center mb-6">
                <div className="h-20 w-20 flex items-center justify-center rounded-full bg-purple-100 text-purple-600 text-3xl mx-auto mb-4">
                  {formData.nome.charAt(0).toUpperCase() || 'U'}
                </div>
                <h3 className="font-bold text-xl text-gray-900">{formData.nome}</h3>
                <p className="text-gray-600">{formData.email}</p>
                <div className="mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    formData.role === 'admin' ? 'bg-red-100 text-red-800' :
                    formData.role === 'gerente' ? 'bg-blue-100 text-blue-800' :
                    formData.role === 'garcom' ? 'bg-green-100 text-green-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {formData.role.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Status</p>
                  <p className={`font-medium ${formData.ativo ? 'text-green-600' : 'text-red-600'}`}>
                    {formData.ativo ? '✅ Ativo' : '❌ Inativo'}
                  </p>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Permissões Principais</p>
                  <div className="mt-2 space-y-1">
                    {formData.permissoes.canManageUsers && (
                      <p className="text-sm text-green-600">✓ Gerencia Usuários</p>
                    )}
                    {formData.permissoes.canManageProducts && (
                      <p className="text-sm text-green-600">✓ Gerencia Produtos</p>
                    )}
                    {formData.permissoes.canCloseComanda && (
                      <p className="text-sm text-green-600">✓ Fecha Comandas</p>
                    )}
                    {formData.permissoes.canProcessPayment && (
                      <p className="text-sm text-green-600">✓ Processa Pagamentos</p>
                    )}
                  </div>
                </div>
                
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800">⚠️ Atenção</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Alterações serão aplicadas no próximo login do usuário.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}