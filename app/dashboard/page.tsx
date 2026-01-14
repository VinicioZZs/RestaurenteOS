// app/dashboard/page.tsx - VERSÃO FINAL MONGODB
'use client';


import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Plus, Clock, LogOut, Settings } from 'lucide-react'; 

interface Mesa {
  _id: string;
  numero: string;
  nome: string;
  totalComanda: number;
  quantidadeItens: number;
  atualizadoEm: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [mostrarModalCriar, setMostrarModalCriar] = useState(false);
  const [numeroNovaMesa, setNumeroNovaMesa] = useState('');
  const [nomeNovaMesa, setNomeNovaMesa] = useState('');
  const [criandoMesa, setCriandoMesa] = useState(false);
  const [mensagemErro, setMensagemErro] = useState('');
  const [resultadoBusca, setResultadoBusca] = useState<Mesa[]>([]);
  const [mostrarModalNaoEncontrada, setMostrarModalNaoEncontrada] = useState(false);
  const [mesaParaCriar, setMesaParaCriar] = useState('');

  // Carregar mesas do MongoDB
  const carregarMesas = async (termoBusca?: string) => {
    try {
      const url = termoBusca 
        ? `/api/mesas?busca=${encodeURIComponent(termoBusca)}`
        : '/api/mesas';
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setMesas(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar mesas:', error);
      setMesas([]);
    }
  };

  // Carregar inicial
  useEffect(() => {
    const carregarInicial = async () => {
      setCarregando(true);
      await carregarMesas();
      setCarregando(false);
    };
    
    carregarInicial();
  }, []);

  // Atualizar a cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      carregarMesas(busca);
    }, 5000);

    return () => clearInterval(interval);
  }, [busca]);

  // Buscar mesa
  const buscarMesa = async () => {
    if (!busca.trim()) {
      await carregarMesas();
      setResultadoBusca([]);
      return;
    }
    
    try {
      const response = await fetch(`/api/mesas/buscar?termo=${encodeURIComponent(busca)}`);
      const data = await response.json();
      
      if (data.success) {
        if (data.data.length > 0) {
          setResultadoBusca(data.data);
          
          // Se encontrou exatamente uma mesa, redirecionar para ela
          if (data.data.length === 1) {
            router.push(`/mesas/${data.data[0].numero}`);
          } else {
            // Mostrar resultados
            setMesas(data.data);
          }
        } else {
          // Nenhuma mesa encontrada
          setMesaParaCriar(busca);
          setMostrarModalNaoEncontrada(true);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar mesa:', error);
    }
  };

  // Enter para buscar
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      buscarMesa();
    }
  };

  // Criar mesa
  const criarMesa = async () => {
    if (!numeroNovaMesa.trim()) {
      setMensagemErro('Digite o número da mesa');
      return;
    }
    
    try {
      setCriandoMesa(true);
      setMensagemErro('');
      
      const response = await fetch('/api/mesas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: numeroNovaMesa,
          nome: nomeNovaMesa || `Mesa ${numeroNovaMesa.padStart(2, '0')}`
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMesas([...mesas, data.data]);
        setMostrarModalCriar(false);
        setNumeroNovaMesa('');
        setNomeNovaMesa('');
        router.push(`/mesas/${data.data.numero}`);
      } else {
        if (response.status === 409 && data.data) {
          const confirmar = window.confirm(
            `A mesa ${data.data.numero} já existe. Deseja abrir a comanda desta mesa?`
          );
          
          if (confirmar) {
            router.push(`/mesas/${data.data.numero}`);
          } else {
            setMostrarModalCriar(false);
          }
        } else {
          setMensagemErro(data.error || 'Erro ao criar mesa');
        }
      }
    } catch (error) {
      console.error('Erro ao criar mesa:', error);
      setMensagemErro('Erro ao criar mesa');
    } finally {
      setCriandoMesa(false);
    }
  };

  // Criar mesa da busca
  const criarMesaDaBusca = async () => {
    if (!mesaParaCriar) return;
    
    try {
      setCriandoMesa(true);
      
      const response = await fetch('/api/mesas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: mesaParaCriar,
          nome: `Mesa ${mesaParaCriar.padStart(2, '0')}`
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMostrarModalNaoEncontrada(false);
        setMesaParaCriar('');
        router.push(`/mesas/${data.data.numero}`);
      } else {
        if (response.status === 409 && data.data) {
          const confirmar = window.confirm(
            `A mesa ${data.data.numero} já existe. Deseja abrir a comanda desta mesa?`
          );
          
          if (confirmar) {
            router.push(`/mesas/${data.data.numero}`);
          } else {
            setMostrarModalNaoEncontrada(false);
          }
        }
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao criar mesa');
    } finally {
      setCriandoMesa(false);
    }
  };

  // Formatar valores
  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (data: string) => {
    if (!data) return '--:--';
    try {
      const date = new Date(data);
      if (isNaN(date.getTime())) return '--:--';
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '--:--';
    }
  };

  const sair = () => {
    localStorage.removeItem('auth_token');
    router.push('/');
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Conectando ao banco de dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
   
     {/* Header */}
<div className="flex justify-between items-center mb-6 md:mb-8">
  <div>
    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
      Comandas do Restaurante
    </h1>
    <p className="text-gray-600 mt-1">Banco de dados: MongoDB</p>
  </div>
  
  <div className="flex items-center gap-2">
    {/* Botão de Configurações */}
    <Link
      href="/configuracao"
      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <Settings className="h-5 w-5" />
      <span className="hidden md:inline">Configurações</span>
    </Link>

    {/* Botão de Sair */}
    <button
      onClick={sair}
      className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
    >
      <LogOut size={20} />
      <span className="hidden md:inline">Sair</span>
    </button>
  </div>
</div>

      {/* Barra de busca */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  if (!e.target.value.trim()) {
                    carregarMesas();
                    setResultadoBusca([]);
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="Digite o número da mesa..."
                className="w-full pl-12 pr-12 py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              />
              <button
                onClick={buscarMesa}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors p-1"
                title="Buscar mesa"
              >
                <Search size={20} />
              </button>
            </div>
            
            <p className="text-sm text-gray-500 mt-2 ml-1">
              Pressione <kbd className="px-2 py-1 bg-gray-100 rounded border">Enter</kbd> ou clique na lupa
            </p>
          </div>
          
          <button
            onClick={() => setMostrarModalCriar(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition w-full md:w-auto justify-center shadow-md hover:shadow-lg"
          >
            <Plus size={20} />
            <span>Criar Nova Mesa</span>
          </button>
        </div>
      </div>

      {/* Grid de Comandas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
        {mesas.length > 0 ? (
          mesas.map((mesa) => (
            <div 
              key={mesa._id} 
              className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-blue-300"
              onClick={() => router.push(`/mesas/${mesa.numero}`)}
            >
              <div className="text-center">
                <div className="text-5xl font-bold text-gray-800 mb-4">
                  {mesa.numero}
                </div>
                
                <p className="text-gray-600 mb-1 text-sm">{mesa.nome}</p>
                
                <div className="mt-4">
                  <div className="text-xs text-gray-500 mb-1">Valor da Comanda</div>
                  <div className={`text-2xl font-bold ${
                    mesa.totalComanda > 0 ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {formatarMoeda(mesa.totalComanda)}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {mesa.quantidadeItens} {mesa.quantidadeItens === 1 ? 'item' : 'itens'}
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
                    <Clock size={12} />
                    {formatarData(mesa.atualizadoEm)}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-16">
            <div className="bg-gray-100 p-8 rounded-2xl inline-block">
              <div className="bg-gray-200 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <span className="text-3xl">🍽️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">Nenhuma mesa no banco</h3>
              <p className="text-gray-600 mb-6">Crie sua primeira mesa!</p>
            </div>
          </div>
        )}
      </div>

      {/* Modais (mantenha iguais) */}
      {mostrarModalNaoEncontrada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl">
            {/* ... conteúdo do modal ... */}
          </div>
        </div>
      )}

      {mostrarModalCriar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl">
            {/* ... conteúdo do modal ... */}
          </div>
        </div>
      )}

      <div className="mt-8 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
        <p>MongoDB • {mesas.length} mesas • Atualiza a cada 5 segundos</p>
      </div>
    </div>
  );
}