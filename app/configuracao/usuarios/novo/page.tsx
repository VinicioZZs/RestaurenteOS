// app/configuracao/usuarios/novo/page.tsx
// app/configuracao/usuarios/editar/[id]/page.tsx (serão similares)

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UserPlus, 
  Save, 
  ArrowLeft, 
  Lock, 
  Shield,
  Check,
  X
} from 'lucide-react';
import { roleTemplates } from '@/lib/models/user';

interface Permissao {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
}

const todasPermissoes: Permissao[] = [
  // Gestão do Sistema
  { id: 'canManageUsers', nome: 'Gerenciar Usuários', descricao: 'Pode adicionar/editar/excluir usuários', categoria: 'Sistema' },
  { id: 'canAccessSettings', nome: 'Acessar Configurações', descricao: 'Pode acessar todas as configurações', categoria: 'Sistema' },
  { id: 'canViewReports', nome: 'Visualizar Relatórios', descricao: 'Pode acessar a aba de relatórios', categoria: 'Sistema' },
  
  //Caixa
  { id: 'canOpenCashier', nome: 'Abrir Caixa', descricao: 'Pode abrir o caixa do sistema', categoria: 'Caixa' },
  { id: 'canCloseCashier', nome: 'Fechar Caixa', descricao: 'Pode fechar o caixa do sistema', categoria: 'Caixa' },
  { id: 'canViewCashier', nome: 'Visualizar Caixa', descricao: 'Pode visualizar o status do caixa', categoria: 'Caixa' },
  { id: 'canManageCashWithdrawals', nome: 'Gerenciar Retiradas', descricao: 'Pode fazer retiradas do caixa', categoria: 'Caixa' },

  // Produtos
  { id: 'canManageProducts', nome: 'Gerenciar Produtos', descricao: 'Pode adicionar/editar/excluir produtos', categoria: 'Cardápio' },
  { id: 'canManageCategories', nome: 'Gerenciar Categorias', descricao: 'Pode gerenciar categorias de produtos', categoria: 'Cardápio' },
  { id: 'canManageAdicionais', nome: 'Gerenciar Adicionais', descricao: 'Pode gerenciar itens adicionais', categoria: 'Cardápio' },
  
  // Comandas
  { id: 'canOpenComanda', nome: 'Abrir Comanda', descricao: 'Pode abrir novas comandas', categoria: 'Comandas' },
  { id: 'canCloseComanda', nome: 'Fechar Comanda', descricao: 'Pode fechar e processar pagamentos', categoria: 'Comandas' },
  { id: 'canRemoveItem', nome: 'Remover Item', descricao: 'Pode remover itens da comanda', categoria: 'Comandas' },
  { id: 'canClearComanda', nome: 'Limpar Comanda', descricao: 'Pode limpar toda a comanda', categoria: 'Comandas' },
  { id: 'canDeleteComanda', nome: 'Excluir Comanda', descricao: 'Pode excluir comandas permanentemente', categoria: 'Comandas' },
  
  // Financeiro
  { id: 'canProcessPayment', nome: 'Processar Pagamento', descricao: 'Pode realizar pagamentos', categoria: 'Financeiro' },
  { id: 'canGiveDiscount', nome: 'Dar Desconto', descricao: 'Pode aplicar descontos', categoria: 'Financeiro' },
  { id: 'canCancelPayment', nome: 'Cancelar Pagamento', descricao: 'Pode cancelar pagamentos', categoria: 'Financeiro' },
];

const categoriasPermissoes = Array.from(new Set(todasPermissoes.map(p => p.categoria)));

export default function NovoUsuarioPage({ params }: { params?: { id: string } }) {
  const router = useRouter();
  const isEditando = !!params?.id;
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    role: 'garcom' as 'admin' | 'gerente' | 'garcom' | 'caixa',
    ativo: true,
    permissoes: roleTemplates.garcom
  });
  
  const [carregando, setCarregando] = useState(isEditando);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (isEditando && params.id) {
      carregarUsuario(params.id);
    }
  }, [isEditando, params?.id]);

  const carregarUsuario = async (id: string) => {
    try {
      setCarregando(true);
      const response = await fetch(`/api/usuarios/${id}`);
      const data = await response.json();
      
      if (data.success) {
        const usuario = data.data;
        setFormData({
          nome: usuario.nome,
          email: usuario.email,
          senha: '', // Não carregar senha
          confirmarSenha: '',
          role: usuario.role,
          ativo: usuario.ativo,
          permissoes: usuario.permissoes
        });
      }
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
    } finally {
      setCarregando(false);
    }
  };

  const handleRoleChange = (role: 'admin' | 'gerente' | 'garcom' | 'caixa') => {
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
        [permissaoId]: !formData.permissoes[permissaoId as keyof typeof formData.permissoes]
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
    
    if (!isEditando && !formData.senha) {
      setErro('Senha é obrigatória para novo usuário');
      return;
    }
    
    if (!isEditando && formData.senha !== formData.confirmarSenha) {
      setErro('As senhas não conferem');
      return;
    }
    
    if (isEditando && formData.senha && formData.senha !== formData.confirmarSenha) {
      setErro('As senhas não conferem');
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
      
      const url = isEditando 
        ? `/api/usuarios/${params.id}`
        : '/api/usuarios';
      
      const method = isEditando ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(isEditando ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!');
        router.push('/configuracao/usuarios');
      } else {
        setErro(data.error || 'Erro ao salvar usuário');
      }
    } catch (error: any) {
      setErro(error.message || 'Erro ao salvar usuário');
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
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
              {isEditando ? 'Editar Usuário' : 'Novo Usuário'}
            </h1>
            <p className="text-gray-600">
              {isEditando 
                ? 'Atualize os dados do usuário' 
                : 'Cadastre um novo usuário no sistema'}
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
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              Salvar Usuário
            </>
          )}
        </button>
      </div>

      {erro && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {erro}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário Básico */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <UserPlus className="h-5 w-5 mr-2 text-purple-600" />
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
                    {isEditando ? 'Nova Senha' : 'Senha *'}
                  </label>
                  <input
                    type="password"
                    value={formData.senha}
                    onChange={(e) => setFormData({...formData, senha: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder={isEditando ? 'Deixe em branco para manter atual' : 'Mínimo 6 caracteres'}
                  />
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
                      onClick={() => handleRoleChange(role as any)}
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
                                    formData.permissoes[permissao.id as keyof typeof formData.permissoes]
                                      ? 'bg-green-100 text-green-600'
                                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                  }`}
                                >
                                  {formData.permissoes[permissao.id as keyof typeof formData.permissoes] ? (
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
                <h3 className="font-bold text-xl text-gray-900">{formData.nome || 'Novo Usuário'}</h3>
                <p className="text-gray-600">{formData.email || 'email@exemplo.com'}</p>
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
                  </div>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Aviso</p>
                  <p className="text-xs text-gray-500">
                    {isEditando 
                      ? 'Alterações serão aplicadas no próximo login'
                      : 'Uma senha temporária será enviada por email'
                    }
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700">
                <strong>⚠️ Atenção:</strong> Usuários com permissão para gerenciar outros usuários podem alterar qualquer configuração do sistema.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}