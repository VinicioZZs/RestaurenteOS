'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, 
  Home,
  Menu,
  X,
  ChevronRight,
  Settings
} from 'lucide-react';

export default function RelatoriosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
            
            {/* SEGUNDO: Configurações (ANTES do separador) */}
            <Link
              href="/configuracao"
              className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                pathname === '/configuracao' || pathname.startsWith('/configuracao/')
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Settings className={`mr-3 h-5 w-5 ${
                pathname === '/configuracao' || pathname.startsWith('/configuracao/') 
                  ? 'text-blue-600' : 'text-gray-400'
              }`} />
              <div className="flex-1">
                <div className="font-medium">Configurações</div>
              </div>
              {(pathname === '/configuracao' || pathname.startsWith('/configuracao/')) && 
                <ChevronRight className="h-4 w-4 text-blue-600" />}
            </Link>
            
            {/* SEPARADOR */}
            <div className="px-3 pt-4 pb-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Opções
              </p>
            </div>
            
            {/* TERCEIRO: Relatórios (página atual) DEPOIS do separador */}
            <Link
              href="/relatorios"
              className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                pathname === '/relatorios'
                  ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <BarChart3 className={`mr-3 h-5 w-5 ${
                pathname === '/relatorios' ? 'text-blue-600' : 'text-gray-400'
              }`} />
              <div className="flex-1">
                <div className="font-medium">Relatórios</div>
              </div>
              {pathname === '/relatorios' && <ChevronRight className="h-4 w-4 text-blue-600" />}
            </Link>
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
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <span className="ml-2 text-lg font-semibold">Relatórios</span>
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
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
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
              
              {/* Segundo: Configurações */}
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
              
              {/* Separador visual para mobile */}
              <div className="pt-2 pb-1">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Opções
                </div>
              </div>
              
              {/* Terceiro: Relatórios */}
              <Link
                href="/relatorios"
                className="flex items-center px-3 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100"
                onClick={() => setSidebarOpen(false)}
              >
                <BarChart3 className="mr-3 h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <div>Relatórios</div>
                </div>
              </Link>
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="py-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}