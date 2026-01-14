// components/comanda/ComandaLayout.tsx
'use client';

import { ReactNode } from 'react';

interface ComandaLayoutProps {
  children: ReactNode;
}

export default function ComandaLayout({ children }: ComandaLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header fixo */}
      <header className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-800">
              Restaurante<span className="text-blue-600">OS</span>
            </h1>
            <span className="text-sm text-gray-500">• Sistema de Comandas</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Garçom: João</span>
            <button className="text-sm text-gray-500 hover:text-gray-700">
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="p-4 md:p-6 h-[calc(100vh-80px)] overflow-hidden">
  <div className="max-w-7xl mx-auto h-full">
    {children}
  </div>
      </main>
    </div>
  );
}