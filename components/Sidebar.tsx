// components/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { 
  Home, 
  Table, 
  ShoppingCart, 
  Utensils, 
  BarChart3, 
  Settings,
  Menu,
  X,
  LogOut,
  User
} from 'lucide-react';
import { getCurrentUser, logout } from '@/lib/auth';

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: <Home size={20} />, roles: ['admin', 'garcom', 'caixa'] },
  { name: 'Mesas', href: '/dashboard', icon: <Table size={20} />, roles: ['admin', 'garcom'] },
  { name: 'Pedidos', href: '/pedidos', icon: <ShoppingCart size={20} />, roles: ['admin', 'garcom', 'caixa'] },
  { name: 'Cardápio', href: '/cardapio', icon: <Utensils size={20} />, roles: ['admin'] },
  { name: 'Relatórios', href: '/relatorios', icon: <BarChart3 size={20} />, roles: ['admin', 'caixa'] },
  { name: 'Configurações', href: '/configuracoes', icon: <Settings size={20} />, roles: ['admin'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const user = getCurrentUser();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const filteredMenuItems = menuItems.filter(item => 
    user ? item.roles.includes(user.role) : false
  );

  if (!user) return null;

  return (
    <>
      {/* Botão mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-900 text-white h-screen p-4 fixed left-0 top-0">
        <div className="mb-8 p-4">
          <h1 className="text-2xl font-bold">
            Restaurante<span className="text-blue-400">OS</span>
          </h1>
          <p className="text-gray-400 text-sm">Sistema de Gestão</p>
        </div>

        {/* Perfil do usuário */}
        <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg mb-6">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <User size={20} />
          </div>
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-xs text-gray-400 capitalize">{user.role}</p>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 space-y-2">
          {filteredMenuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 p-3 rounded-lg transition ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-800 text-gray-300'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 p-3 text-gray-300 hover:bg-gray-800 rounded-lg transition mt-6"
        >
          <LogOut size={20} />
          <span>Sair</span>
        </button>

        {/* Rodapé */}
        <div className="mt-6 pt-6 border-t border-gray-800 text-center">
          <p className="text-xs text-gray-400">restaurante v1.0</p>
            </div>
      </aside>

      {/* Sidebar Mobile */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setIsOpen(false)}>
          <div className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-white p-4" onClick={e => e.stopPropagation()}>
            {/* Mesmo conteúdo do desktop, adaptado */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-2xl font-bold">
                  Restaurante<span className="text-blue-400">OS</span>
                </h1>
                <p className="text-gray-400 text-sm">Sistema de Gestão</p>
              </div>
              <button onClick={() => setIsOpen(false)}>
                <X size={24} />
              </button>
            </div>

            {/* Resto do conteúdo igual ao desktop */}
            <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg mb-6">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <User size={20} />
              </div>
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-xs text-gray-400 capitalize">{user.role}</p>
              </div>
            </div>

            <nav className="space-y-2">
              {filteredMenuItems.map((item) => (
                <Link
                  key={item.name}
                     href={item.href}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 text-gray-300"
                  onClick={() => setIsOpen(false)}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 p-3 text-gray-300 hover:bg-gray-800 rounded-lg transition mt-6 w-full"
            >
              <LogOut size={20} />
              <span>Sair</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
