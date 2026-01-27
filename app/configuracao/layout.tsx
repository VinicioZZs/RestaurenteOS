// app/configuracao/layout.tsx - COM PERMISSÕES
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { BarChart3, Users, Settings, Package, Tag, PlusCircle, Menu, X, ChevronRight, Home } from 'lucide-react';

interface UsuarioLogado {
  _id: string;
  email: string;
  nome: string;
  role: string;
  permissoes: {
    canManageUsers?: boolean;
    canManageProducts?: boolean;
    canManageCategories?: boolean;
    canManageAdicionais?: boolean;
    canAccessSettings?: boolean;
    canViewReports?: boolean;
    [key: string]: boolean | undefined;
  };
}

export default function ConfiguracaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // ✅ NOVO: Estados para usuário logado
  const [usuarioLogado, setUsuarioLogado] = useState<UsuarioLogado | null>(null);
  const [carregandoPermissoes, setCarregandoPermissoes] = useState(true);

  // ✅ NOVO: Carregar usuário logado
  useEffect(() => {
    const carregarUsuario = () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          setUsuarioLogado(user);
        }
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
      } finally {
        setCarregandoPermissoes(false);
      }
    };

    carregarUsuario();
  }, []);

  // ✅ NOVO: Função de verificação de permissões
  const temPermissao = (permissao: string): boolean => {
    if (!usuarioLogado) return false;
    
    // Admin tem todas as permissões
    if (usuarioLogado.role === 'admin') return true;
    
    // Verifica permissão específica
    return usuarioLogado.permissoes[permissao] === true;
  };

  // ✅ NOVO: Itens de menu com verificação de permissão
  const menuItemsComPermissao = [
    {
      title: 'Usuários',
      href: '/configuracao/usuarios',
      icon: Users,
      description: 'Gerencie usuários e permissões',
      permissao: 'canManageUsers',
      mostraSeNaoTiverPermissao: false // Não mostra se não tiver permissão
    },
    {
      title: 'Produtos',
      href: '/configuracao/produtos',
      icon: Package,
      description: 'Gerencie o cardápio',
      permissao: 'canManageProducts',
      mostraSeNaoTiverPermissao: false
    },
    {
      title: 'Categorias',
      href: '/configuracao/categorias',
      icon: Tag,
      description: 'Organize por categorias',
      permissao: 'canManageCategories',
      mostraSeNaoTiverPermissao: false
    },
    {
      title: 'Adicionais',
      href: '/configuracao/adicionais',
      icon: PlusCircle,
      description: 'Itens extras e personalizações',
      permissao: 'canManageAdicionais',
      mostraSeNaoTiverPermissao: false
    },
    {
      title: 'Configurações Gerais',
      href: '/configuracao/geral',
      icon: Settings,
      description: 'Ajustes do sistema e aparência',
      permissao: 'canAccessSettings',
      mostraSeNaoTiverPermissao: false
    }
  ];

  // ✅ NOVO: Filtrar itens de menu baseado nas permissões
  const menuItemsFiltrados = menuItemsComPermissao.filter(item => {
    if (item.mostraSeNaoTiverPermissao) return true;
    return temPermissao(item.permissao);
  });

  // ✅ NOVO: Verificar se tem alguma permissão para ver esta página
  const temAlgumaPermissaoParaConfiguracao = () => {
    if (!usuarioLogado) return false;
    if (usuarioLogado.role === 'admin') return true;
    
    return menuItemsComPermissao.some(item => temPermissao(item.permissao));
  };

  // ✅ NOVO: Indicador de permissões
  const renderizarIndicadorPermissoes = () => {
    if (!usuarioLogado) return null;
    
    const permissoesAtivas = menuItemsComPermissao
      .filter(item => temPermissao(item.permissao))
      .map(item => item.title);
    
    if (permissoesAtivas.length === 0) return null;
    
    return (
      <div className="mt-2 px-4">
        <div className="text-xs text-gray-600">
          <span className="font-medium">Permissões ativas:</span>{' '}
          {permissoesAtivas.join(', ')}
        </div>
      </div>
    );
  };

  // ✅ NOVO: Tela de carregamento
  if (carregandoPermissoes) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando permissões...</p>
        </div>
      </div>
    );
  }

  // ✅ NOVO: Verificar se tem permissão para acessar configurações
  if (!temAlgumaPermissaoParaConfiguracao()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="bg-red-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Settings className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Acesso Negado</h2>
          <p className="text-gray-600 mb-6">
            Você não tem permissão para acessar a área de configurações do sistema.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            <Home className="h-5 w-5 mr-2" />
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar para desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
          {/* Logo/Header */}
          <div className="flex items-center px-6 mb-8">
            <div className={`p-2 rounded-lg ${temAlgumaPermissaoParaConfiguracao() ? 'bg-blue-600' : 'bg-gray-400'}`}>
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-gray-900">Configurações</h1>
              <p className="text-sm text-gray-500">Sistema Restaurante</p>
              {/* ✅ NOVO: Mostrar função do usuário */}
              {usuarioLogado && (
                <div className="mt-1">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    usuarioLogado.role === 'admin' ? 'bg-red-100 text-red-800' :
                    usuarioLogado.role === 'gerente' ? 'bg-blue-100 text-blue-800' :
                    usuarioLogado.role === 'garcom' ? 'bg-green-100 text-green-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {usuarioLogado.role.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ✅ NOVO: Indicador de permissões */}
          {renderizarIndicadorPermissoes()}

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1 mt-4">
            {/* PRIMEIRO: Voltar ao Dashboard */}
            <Link
              href="/dashboard"
              className="group flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900"
            >
              <Home className="mr-3 h-5 w-5 text-gray-400" />
              Voltar ao Dashboard
            </Link>
            
            {/* SEGUNDO: Relatórios - Verifica permissão canViewReports */}
            {temPermissao('canViewReports') && (
              <Link
                href="/relatorios"
                className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                  pathname === '/relatorios' || pathname.startsWith('/relatorios/')
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <BarChart3 size={20} className={`mr-3 h-5 w-5 ${
                  pathname === '/relatorios' || pathname.startsWith('/relatorios/') 
                    ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <div className="flex-1">
                  <div className="font-medium">Gestão</div>
                </div>
                {(pathname === '/relatorios' || pathname.startsWith('/relatorios/')) && 
                  <ChevronRight className="h-4 w-4 text-blue-600" />}
              </Link>
            )}
            
            {/* Separador só se houver itens abaixo */}
            {menuItemsFiltrados.length > 0 && (
              <div className="px-3 pt-4 pb-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Gerenciamento
                </p>
              </div>
            )}
            
            {/* ✅ NOVO: Mostrar apenas itens com permissão */}
            {menuItemsFiltrados.map((item) => {
              const isActive = pathname === item.href;
              const temPermissaoParaEsteItem = temPermissao(item.permissao);
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                      : temPermissaoParaEsteItem
                      ? 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      : 'text-gray-400 cursor-not-allowed opacity-60'
                  }`}
                  onClick={(e) => {
                    if (!temPermissaoParaEsteItem) {
                      e.preventDefault();
                      alert(`Você não tem permissão para acessar ${item.title}`);
                    }
                  }}
                  title={!temPermissaoParaEsteItem ? `Permissão necessária: ${item.permissao}` : ''}
                >
                  <item.icon className={`mr-3 h-5 w-5 ${
                    isActive ? 'text-blue-600' : 
                    temPermissaoParaEsteItem ? 'text-gray-400' : 'text-gray-300'
                  }`} />
                  <div className="flex-1">
                    <div className="font-medium">{item.title}</div>
                    <div className={`text-xs ${temPermissaoParaEsteItem ? 'text-gray-500' : 'text-gray-400'}`}>
                      {item.description}
                    </div>
                  </div>
                  {isActive && <ChevronRight className="h-4 w-4 text-blue-600" />}
                  {!temPermissaoParaEsteItem && (
                    <span className="text-xs text-gray-400 ml-2">🔒</span>
                  )}
                </Link>
              );
            })}
            
            {/* ✅ NOVO: Mensagem se não tem nenhuma permissão */}
            {menuItemsFiltrados.length === 0 && (
              <div className="px-3 py-4 text-center">
                <div className="text-gray-400">
                  <Settings className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Nenhuma permissão de gerenciamento</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Você só pode visualizar esta área
                  </p>
                </div>
              </div>
            )}
          </nav>
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {sidebarOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
            <div className="ml-4 flex items-center">
              <Settings className={`h-6 w-6 ${temAlgumaPermissaoParaConfiguracao() ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className="ml-2 text-lg font-semibold">Configurações</span>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Voltar
          </Link>
        </div>
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-30">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 flex flex-col w-64 bg-white">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center">
                <Settings className={`h-6 w-6 ${temAlgumaPermissaoParaConfiguracao() ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className="ml-2 text-lg font-semibold">Configurações</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-2">
              <Link
                href="/dashboard"
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100"
                onClick={() => setSidebarOpen(false)}
              >
                <Home className="mr-3 h-5 w-5" />
                Voltar ao Dashboard
              </Link>
              
              {/* ✅ NOVO: Mostrar apenas itens com permissão no mobile */}
              {menuItemsFiltrados.map((item) => {
                const temPermissaoParaEsteItem = temPermissao(item.permissao);
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg ${
                      temPermissaoParaEsteItem 
                        ? 'text-gray-700 hover:bg-gray-100' 
                        : 'text-gray-400 cursor-not-allowed opacity-60'
                    }`}
                    onClick={(e) => {
                      if (!temPermissaoParaEsteItem) {
                        e.preventDefault();
                        alert(`Você não tem permissão para acessar ${item.title}`);
                      } else {
                        setSidebarOpen(false);
                      }
                    }}
                    title={!temPermissaoParaEsteItem ? `Permissão necessária: ${item.permissao}` : ''}
                  >
                    <item.icon className={`mr-3 h-5 w-5 ${
                      temPermissaoParaEsteItem ? 'text-gray-400' : 'text-gray-300'
                    }`} />
                    <div className="flex-1">
                      <div>{item.title}</div>
                      <div className={`text-xs ${temPermissaoParaEsteItem ? 'text-gray-500' : 'text-gray-400'}`}>
                        {item.description}
                      </div>
                    </div>
                    {!temPermissaoParaEsteItem && (
                      <span className="text-xs text-gray-400 ml-2">🔒</span>
                    )}
                  </Link>
                );
              })}
              
              {/* ✅ NOVO: Mensagem se não tem permissões */}
              {menuItemsFiltrados.length === 0 && (
                <div className="px-3 py-4 text-center">
                  <p className="text-sm text-gray-400">
                    Nenhuma permissão de gerenciamento
                  </p>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="py-6 lg:py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* ✅ NOVO: Banner de permissões limitadas */}
            {usuarioLogado && usuarioLogado.role !== 'admin' && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="text-yellow-600 text-lg">⚠️</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Permissões Limitadas
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        Você está acessando a área de configurações com permissões restritas.
                        {usuarioLogado.role === 'admin' ? ' (Admin - Acesso Total)' : 
                         ` (${usuarioLogado.role.toUpperCase()} - Apenas itens permitidos)`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}