'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { login } from '@/lib/auth';

// 1. Componente interno que contém a lógica que depende de parâmetros da URL
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const expired = searchParams.get('expired');
  
  const [email, setEmail] = useState('admin@restaurante.com');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(expired ? 'Sessão expirada. Faça login novamente.' : '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { user } = await login(email, password);

      if (user) {
        router.push(callbackUrl);
        router.refresh(); 
      } else {
        setError('E-mail ou senha incorretos.');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <div className="mb-6 max-w-md w-full bg-white/90 backdrop-blur-sm border-l-4 border-red-500 p-4 rounded-lg shadow-2xl">
          <p className="text-sm text-red-700 font-bold text-center">{error}</p>
        </div>
      )}

      <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <div className="relative w-40 h-40">
              <Image 
                src="/logo-servyx.png" 
                alt="Servyx Logo"
                fill
                className="object-contain"
                priority 
              />
            </div>
          </div>

          <h2 className="text-4xl font-black text-gray-800 tracking-tighter">Servyx</h2>
          <p className="text-gray-400 font-semibold text-sm mt-1 uppercase tracking-widest">
            Gestão Professional
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <input
              type="email"
              required
              className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all text-gray-900 shadow-sm"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              required
              className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all text-gray-900 shadow-sm"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-2xl shadow-xl transition-all transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? 'Autenticando...' : 'Acessar Sistema'}
          </button>
        </form>
      </div>
    </>
  );
}

// 2. Componente principal exportado que fornece o limite de Suspense
export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#3b6db1] px-4 font-sans">
      <Suspense fallback={
        <div className="flex items-center justify-center p-10 bg-white rounded-3xl shadow-xl">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      }>
        <LoginContent />
      </Suspense>
      
      <p className="mt-8 text-white/50 text-xs font-medium">
        &copy; {new Date().getFullYear()} Servyx OS.
      </p>
    </div>
  );
}