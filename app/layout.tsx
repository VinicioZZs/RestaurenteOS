// app/layout.tsx - VERSÃO SEM FOOTER
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'restaurante',
  description: 'Sistema de gerenciamento para restaurantes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
        {/* REMOVEU O FOOTER - Ele aparece em todas as páginas! */}
      </body>
    </html>
  )
}
