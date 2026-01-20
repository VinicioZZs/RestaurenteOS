'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';

export default function LoginPage() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    
    if (!usuario || !senha) {
      setErro('Preencha todos os campos');
      setCarregando(false);
      return;
    }
    
    try {
      // Usar seu sistema de auth real
      const result = await login(usuario, senha);
      
      if (result.user && result.token) {
        // Salvar o token
        localStorage.setItem('auth_token', result.token);
        sessionStorage.setItem('auth_token', result.token);
        
        // Salvar dados do usuário separadamente (backup)
        localStorage.setItem('usuario_nome', result.user.name);
        localStorage.setItem('usuario_perfil', result.user.role);
        localStorage.setItem('usuario_email', result.user.email);
        
        console.log('✅ Login bem-sucedido:', result.user.name);
        
        // Redirecionar para dashboard
        router.push('/dashboard');
        router.refresh(); // Forçar atualização
      } else {
        setErro('Usuário ou senha incorretos');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setErro('Erro ao fazer login');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20 shadow-2xl">
        <h1 className="text-3xl font-bold text-center text-white mb-2">
          restaurante
        </h1>
        <p className="text-center text-gray-300 mb-6">Sistema de Gestão</p>
        
        {/* Mensagem de erro */}
        {erro && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 text-red-200 rounded-lg text-sm">
            ⚠️ {erro}
          </div>
        )}
        
        {/* Informações de teste */}
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
            />
          </div>
          
          <div>
            <input
              type="password"
              placeholder="Senha"
              className="w-full p-3 rounded-lg bg-white/15 border border-white/30 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
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
        
        {/* Botão de debug */}
        <button
          onClick={() => {
            // Login rápido para debug
            setUsuario('admin@restaurante.com');
            setSenha('123456');
          }}
          className="mt-4 w-full py-2 text-sm bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition"
        >
          🧪 Preencher dados de teste
        </button>
        
        {/* Debug info */}
        <div className="mt-4 text-xs text-gray-400 text-center">
          <p>Token salvo: {localStorage.getItem('auth_token') ? '✅' : '❌'}</p>
        </div>
      </div>
    </div>
  );
}
