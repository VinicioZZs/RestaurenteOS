'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function HomeContent() {
  const [usuario, setUsuario] = useState('admin@restaurante.com');
  const [senha, setSenha] = useState('123456');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: usuario, 
          password: senha 
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Login bem-sucedido:', data.user.name);
        
        localStorage.setItem('usuario_nome', data.user.name);
        localStorage.setItem('usuario_perfil', data.user.role);
        localStorage.setItem('usuario_email', data.user.email);
        
        window.location.href = callbackUrl;
        
      } else {
        setErro(data.error || 'Usuário ou senha incorretos');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setErro('Erro ao conectar com o servidor');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20 shadow-2xl">
      <h1 className="text-3xl font-bold text-center text-white mb-2">
        restaurante
      </h1>
      <p className="text-center text-gray-300 mb-6">Sistema de Gestão</p>
      
      {erro && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 text-red-200 rounded-lg text-sm">
          ⚠️ {erro}
        </div>
      )}
      
      <div className="mb-4 p-3 bg-blue-500/20 border border-blue-500/40 text-blue-200 rounded-lg text-sm">
        <p className="font-medium mb-1">👨‍💻 Usuários para teste:</p>
        <div className="text-xs">
          <p>• admin@restaurante.com (Admin)</p>
          <p>• caixa@restaurante.com (Caixa)</p>
          <p>• garcom@restaurante.com (Garçom)</p>
          <p className="mt-1">🔑 Senha: <strong>123456</strong></p>
        </div>
      </div>
      
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="Email (ex: admin@restaurante.com)"
            className="w-full p-3 rounded-lg bg-white/15 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            required
          />
        </div>
        
        <div>
          <input
            type="password"
            placeholder="Senha"
            className="w-full p-3 rounded-lg bg-white/15 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={carregando}
          className={`w-full ${carregando ? 'bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'} text-white font-semibold py-3 rounded-lg transition duration-200 disabled:opacity-70`}
        >
          {carregando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      
      <button
        onClick={() => {
          setUsuario('admin@restaurante.com');
          setSenha('123456');
        }}
        className="mt-4 w-full py-2 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition"
      >
        🧪 Preencher dados de teste
      </button>
      
      <button
        onClick={async () => {
          const res = await fetch('/api/test-auth');
          const data = await res.json();
          console.log('Teste Auth:', data);
          alert(data.success ? '✅ Cookie OK!' : '❌ Sem cookie');
        }}
        className="mt-2 w-full py-2 text-sm bg-green-700 hover:bg-green-600 text-white rounded-lg transition"
      >
        🔒 Testar Autenticação
      </button>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <Suspense fallback={
        <div className="text-white flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mb-4"></div>
          <p>Carregando sistema...</p>
        </div>
      }>
        <HomeContent />
      </Suspense>
    </div>
  );
}