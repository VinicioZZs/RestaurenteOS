// components/comanda/ComandaLayout.tsx - VERSÃO BÁSICA SEM HEADER
'use client';

import { ReactNode } from 'react';

interface ComandaLayoutProps {
  children: ReactNode;
}

export default function ComandaLayout({ children }: ComandaLayoutProps) {
  return (
    <div className="h-screen bg-white">
      {children}
    </div>
  );
}