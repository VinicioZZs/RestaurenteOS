import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RestauranteOS',
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
        <footer className="bg-gray-800 text-white text-center p-4 text-sm">
          Ativar o Windows<br />
          Acesse Configurações para ativar o Windows.
        </footer>
      </body>
    </html>
  )
}