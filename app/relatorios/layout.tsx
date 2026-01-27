'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, 
  Home,
  Menu,
  X,
  ChevronRight,
  Settings,
  Lock
} from 'lucide-react';
import { getCurrentUser, User } from '@/lib/auth'; // Importar User original

export default function RelatoriosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [temAcessoRelatorios, setTemAcessoRelatorios] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [usuario, setUsuario] = useState<User | null>(null);

  useEffect(() => {
  const verificarPermissoes = () => {
    try {
      const user = getCurrentUser();
      setUsuario(user);
      
      if (!user) {
        setTemAcessoRelatorios(false);
        setCarregando(false);
        return;
      }
      
      // Verificar se tem acesso a relatórios
      const temPermissaoRelatorios = 
        // Permissões específicas
        (user.permissions?.includes('viewReports') || 
         user.permissions?.includes('admin') ||
         user.permissions?.includes('canViewReports') ||
         user.permissions?.includes('manageReports') ||
         // Por role (apenas admin tem acesso por padrão)
         user.role === 'admin');
         // Se quiser adicionar outras roles futuramente, faça aqui
         // Exemplo: user.role === 'supervisor'
      
      setTemAcessoRelatorios(!!temPermissaoRelatorios);
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      setTemAcessoRelatorios(false);
    } finally {
      setCarregando(false);
    }
  };

  verificarPermissoes();
}, []);

  // Função para verificar se é uma rota de configuração
  const isConfiguracaoRoute = () => {
    return pathname === '/configuracao' || pathname.startsWith('/configuracao/');
  };

  // Função para verificar se é uma rota de relatórios
  const isRelatoriosRoute = () => {
    return pathname === '/relatorios' || pathname.startsWith('/relatorios/');
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando permissões...</p>
        </div>
      </div>
    );
  }

  // Se não tem usuário logado, redireciona
  if (!usuario) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Lock className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-4">Você precisa estar logado para acessar esta página.</p>
          <Link
            href="/login"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Ir para Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
          {/* Logo/Header */}
          <div className="flex items-center px-6 mb-8">
            <div className="bg-blue-600 p-2 rounded-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-gray-900">Relatórios</h1>
              <p className="text-sm text-gray-500">Sistema Restaurante</p>
            </div>
            
            {/* Badge de permissão */}
            {temAcessoRelatorios && (
              <div className="ml-auto">
                <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Acesso total
                </div>
              </div>
            )}
          </div>

          {/* Navigation - ORDEM CORRIGIDA */}
          <nav className="flex-1 px-4 space-y-1">
            {/* PRIMEIRO: Voltar ao Dashboard */}
            <Link
              href="/dashboard"
              className="group flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 hover:text-gray-900"
            >
              <Home className="mr-3 h-5 w-5 text-gray-400" />
              Voltar ao Dashboard
            </Link>
            
            {/* SEGUNDO: Configurações - SOMENTE SE TIVER ACESSO A RELATÓRIOS */}
            {temAcessoRelatorios && (
              <Link
                href="/configuracao"
                className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isConfiguracaoRoute()
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Settings className={`mr-3 h-5 w-5 ${
                  isConfiguracaoRoute() 
                    ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <div className="flex-1">
                  <div className="font-medium">Configurações</div>
                </div>
                {isConfiguracaoRoute() && 
                  <ChevronRight className="h-4 w-4 text-blue-600" />}
              </Link>
            )}
            
            {/* SEPARADOR - Mostrar apenas se houver itens depois */}
            {(temAcessoRelatorios || isRelatoriosRoute()) && (
              <div className="px-3 pt-4 pb-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Opções
                </p>
              </div>
            )}
            
            {/* TERCEIRO: Relatórios (página atual) */}
            <Link
              href="/relatorios"
              className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                isRelatoriosRoute()
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <BarChart3 className={`mr-3 h-5 w-5 ${
                isRelatoriosRoute() ? 'text-blue-600' : 'text-gray-400'
              }`} />
              <div className="flex-1">
                <div className="font-medium">Relatórios</div>
                {!temAcessoRelatorios && (
                  <div className="text-xs text-amber-600 mt-1 flex items-center">
                    <Lock className="h-3 w-3 mr-1" />
                    Acesso limitado
                  </div>
                )}
              </div>
              {isRelatoriosRoute() && <ChevronRight className="h-4 w-4 text-blue-600" />}
            </Link>

            {/* MENSAGEM DE PERMISSÃO INSUFICIENTE */}
            {!temAcessoRelatorios && !isRelatoriosRoute() && (
              <div className="px-3 py-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center">
                  <Lock className="h-4 w-4 text-amber-600 mr-2" />
                  <span className="text-sm text-amber-700">
                    Permissão insuficiente para outras opções
                  </span>
                </div>
              </div>
            )}
          </nav>

          {/* Footer da Sidebar com info do usuário */}
          <div className="px-4 pt-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {usuario.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {usuario.role === 'admin' ? 'Administrador' : 
                   usuario.role === 'garcom' ? 'Garçom' : 
                   usuario.role === 'caixa' ? 'Caixa' : 
                   usuario.role}
                </p>
              </div>
              <div className={`ml-3 px-2 py-1 text-xs rounded-full ${
                temAcessoRelatorios 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {temAcessoRelatorios ? 'Acesso total' : 'Acesso limitado'}
              </div>
            </div>
            {usuario.permissions && usuario.permissions.length > 0 && (
              <div className="mt-2">
                <div className="flex flex-wrap gap-1">
                  {usuario.permissions.map((perm, index) => (
                    <span 
                      key={index}
                      className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
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
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <span className="ml-2 text-lg font-semibold">Relatórios</span>
              {!temAcessoRelatorios && (
                <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                  Limitado
                </span>
              )}
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
                <BarChart3 className="h-6 w-6 text-blue-600" />
                <span className="ml-2 text-lg font-semibold">Relatórios</span>
                {!temAcessoRelatorios && (
                  <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-1 py-0.5 rounded">
                    Limitado
                  </span>
                )}
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Info do usuário no mobile */}
            <div className="p-4 bg-gray-50 border-b">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{usuario.name}</p>
                  <p className="text-xs text-gray-500">
                    {usuario.role === 'admin' ? 'Administrador' : 
                     usuario.role === 'garcom' ? 'Garçom' : 
                     usuario.role === 'caixa' ? 'Caixa' : 
                     usuario.role}
                  </p>
                </div>
                <div className={`px-2 py-1 text-xs rounded-full ${
                  temAcessoRelatorios 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {temAcessoRelatorios ? 'Acesso total' : 'Acesso limitado'}
                </div>
              </div>
              {usuario.permissions && usuario.permissions.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Permissões:</p>
                  <div className="flex flex-wrap gap-1">
                    {usuario.permissions.slice(0, 3).map((perm, index) => (
                      <span 
                        key={index}
                        className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded"
                      >
                        {perm}
                      </span>
                    ))}
                    {usuario.permissions.length > 3 && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        +{usuario.permissions.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <nav className="flex-1 p-4 space-y-2">
              {/* Primeiro: Voltar ao Dashboard */}
              <Link
                href="/dashboard"
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100"
                onClick={() => setSidebarOpen(false)}
              >
                <Home className="mr-3 h-5 w-5" />
                Voltar ao Dashboard
              </Link>
              
              {/* Segundo: Configurações - SOMENTE SE TIVER ACESSO */}
              {temAcessoRelatorios && (
                <Link
                  href="/configuracao"
                  className="flex items-center px-3 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100"
                  onClick={() => setSidebarOpen(false)}
                >
                  <Settings className="mr-3 h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <div>Configurações</div>
                  </div>
                </Link>
              )}
              
              {/* Separador visual para mobile - Mostrar apenas se houver itens */}
              {(temAcessoRelatorios || isRelatoriosRoute()) && (
                <div className="pt-2 pb-1">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Opções
                  </div>
                </div>
              )}
              
              {/* Terceiro: Relatórios */}
              <Link
                href="/relatorios"
                className="flex items-center px-3 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100"
                onClick={() => setSidebarOpen(false)}
              >
                <BarChart3 className="mr-3 h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <div>Relatórios</div>
                  {!temAcessoRelatorios && (
                    <div className="text-xs text-amber-600 mt-1 flex items-center">
                      <Lock className="h-3 w-3 mr-1" />
                      Apenas visualização
                    </div>
                  )}
                </div>
              </Link>

              {/* Mensagem de permissão para mobile */}
              {!temAcessoRelatorios && (
                <div className="px-3 py-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start">
                    <Lock className="h-4 w-4 text-amber-600 mr-2 mt-0.5" />
                    <span className="text-sm text-amber-700">
                      Para acessar todas as opções, solicite permissões de relatórios ao administrador.
                    </span>
                  </div>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="py-6 lg:py-8">
          {/* Banner de permissão (apenas se não tiver acesso total) */}
          {!temAcessoRelatorios && !isRelatoriosRoute() && (
            <div className="px-4 lg:px-8 mb-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Lock className="h-5 w-5 text-amber-600 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-amber-800">
                      Acesso Limitado
                    </h3>
                    <p className="text-sm text-amber-700 mt-1">
                      Você possui acesso limitado aos relatórios. Para visualizar configurações e relatórios completos, 
                      entre em contato com o administrador do sistema.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {children}
        </main>
      </div>
    </div>
  );
}