// components/comanda/ComandaLayout.tsx - VERSÃO COM SCROLL PERFEITO
'use client';

import { ReactNode } from 'react';

interface ComandaLayoutProps {
  children: ReactNode;
}

export default function ComandaLayout({ children }: ComandaLayoutProps) {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">
      {/* Header fixo - altura fixa */}
      <header className="bg-white shadow-sm border-b px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0">
        <div className="flex items-center justify-between max-w-[1920px] mx-auto">
          <div className="flex items-center gap-2 sm:gap-4">
            <h1 className="text-lg sm:text-xl font-bold text-gray-800">
              Restaurante<span className="text-blue-600">OS</span>
            </h1>
            <span className="text-xs sm:text-sm text-gray-500 hidden md:inline">
              • Sistema de Comandas
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">
              Garçom: João
            </span>
            <button className="text-xs sm:text-sm text-red-500 hover:text-red-700 font-medium px-2 sm:px-3 py-1 hover:bg-red-50 rounded-lg transition-colors">
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Área de conteúdo com scroll independente */}
      <div className="flex-1 min-h-0 overflow-hidden p-2 sm:p-4 md:p-6">
        <div className="h-full w-full max-w-[1920px] mx-auto">
          <div className="h-full bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}