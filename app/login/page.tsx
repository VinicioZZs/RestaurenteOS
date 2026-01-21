// app/login/page.tsx - COM DEBUG
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const expired = searchParams.get('expired');
  
  const [email, setEmail] = useState('admin@restaurante.com');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(expired ? 'Sessão expirada. Faça login novamente.' : '');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log('🔄 Tentando login com:', { email, password });

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('📨 Resposta recebida:', response.status, response.statusText);

      const data = await response.json();
      console.log('📊 Dados da resposta:', data);

      if (data.success) {
  console.log('✅ Login bem-sucedido! Redirecionando para:', callbackUrl);
  
  window.location.href = callbackUrl; // 🔥 Isso recarrega a página inteira
  
}else {
        console.log('❌ Erro do servidor:', data.error);
        setError(data.error || 'Credenciais inválidas');
      }
    } catch (err: any) {
      console.error('💥 Erro na requisição:', err);
      setError('Erro ao conectar com o servidor: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const testDebug = async () => {
    console.log('🔍 Testando endpoint de debug...');
    try {
      const response = await fetch('/api/auth/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' }),
      });
      const data = await response.json();
      console.log('🐛 Debug response:', data);
    } catch (error) {
      console.error('Erro no debug:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            🍽️ Restaurante
          </h2>
          <p className="mt-2 text-gray-600">Sistema de Gestão</p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            <p className="font-medium">Erro:</p>
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="admin@restaurante.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="123456"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Entrando...
              </span>
            ) : 'Entrar no Sistema'}
          </button>
        </form>
        
        <div className="text-center space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-700 mb-2">Credenciais para teste:</p>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Admin:</strong> admin@restaurante.com / 123456</p>
              <p><strong>Garçom:</strong> garcom@restaurante.com / 123456</p>
              <p><strong>Caixa:</strong> caixa@restaurante.com / 123456</p>
            </div>
          </div>
          
          <button
            onClick={testDebug}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            🔍 Testar Conexão API
          </button>
        </div>
      </div>
    </div>
  );
}