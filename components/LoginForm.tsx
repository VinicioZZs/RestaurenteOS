// components/LoginForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user, token } = await login(email, password);
      
      if (user && token) {
        // Salvar token
        if (rememberMe) {
          localStorage.setItem('auth_token', token);
        } else {
          sessionStorage.setItem('auth_token', token);
        }
        
        // Redirecionar baseado no papel
        if (user.role === 'admin') {
          router.push('/dashboard');
        } else if (user.role === 'garcom') {
          router.push('/pedidos');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError('Email ou senha incorretos');
      }
    } catch (err) {
      setError('Erro ao fazer login');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = (role: 'admin' | 'garcom' | 'caixa') => {
    const emails = {
      admin: 'admin@restaurante.com',
      garcom: 'garcom@restaurante.com',
      caixa: 'caixa@restaurante.com'
    };
    setEmail(emails[role]);
    setPassword('123456');
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800">RestauranteOS</h1>
        <p className="text-gray-600 mt-2">Faça login para acessar o sistema</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            placeholder="seu@email.com"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Senha
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            placeholder="••••••••"
            required
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
              Lembrar-me
            </label>
          </div>
          
          <a href="#" className="text-sm text-blue-600 hover:text-blue-800">
            Esqueceu a senha?
          </a>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <p className="text-center text-gray-600 mb-4">Acesso rápido para teste:</p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => demoLogin('admin')}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded text-sm"
          >
            Admin
          </button>
          <button
            onClick={() => demoLogin('garcom')}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded text-sm"
          >
            Garçom
          </button>
          <button
            onClick={() => demoLogin('caixa')}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded text-sm"
          >
            Caixa
          </button>
        </div>
      </div>
    </div>
  );
}