// components/DashboardHeader.tsx
'use client';
import { useRouter } from 'next/navigation';

export default function DashboardHeader() {
  const router = useRouter();

  const handleSair = () => {
    localStorage.removeItem('auth_token');
    router.push('/');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 mb-8">
      <div className="px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          Restaurante<span className="text-blue-600">OS</span>
        </h1>

        <nav className="flex gap-4">
          <button className="px-4 py-2 text-gray-700 hover:text-blue-600">
            Entrar
          </button>
          <button className="px-4 py-2 text-gray-700 hover:text-blue-600">
            Ajustes
          </button>
          <button className="px-4 py-2 text-gray-700 hover:text-blue-600">
            Relatórios
          </button>
          <button
            onClick={handleSair}
            className="px-4 py-2 text-red-600 hover:text-red-800"
          >
            Sair
          </button>
        </nav>
      </div>
    </header>
  );
}