'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { login } from '@/lib/auth'; // Importa sua lógica oficial

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Se o middleware barrou o usuário, ele salva o destino aqui
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

    // Usa a sua função de login do lib/auth.ts
    const result = await login(email, password);

    if (result.user) {
      // Manda o usuário para o destino original ou dashboard
      router.push(callbackUrl);
      router.refresh(); 
    } else {
      setError('E-mail ou senha incorretos.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#3b6db1] px-4">
      <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-2xl">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black text-gray-800 tracking-tight">Servyx</h2>
          <p className="text-gray-500 font-medium">Sistema de Gerenciamento Professional</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <input
              type="email"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-gray-900"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-gray-900"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-lg transition-all"
          >
            {loading ? 'Entrando...' : 'Entrar no Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Suspense fallback={
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Carregando formulário...</span>
        </div>
      }>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}