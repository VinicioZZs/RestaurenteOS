// app/dashboard/page.tsx - VERSÃO CORRIGIDA COM FLUXO COMPLETO
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Plus, Clock, LogOut, Settings, AlertCircle } from 'lucide-react'; 

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
  const [mostrarModalMesaExistente, setMostrarModalMesaExistente] = useState(false);
  const [mesaExistenteInfo, setMesaExistenteInfo] = useState<Mesa | null>(null);

  // Carregar mesas do MongoDB
  const carregarMesas = async (termoBusca?: string) => {
  try {
    const url = termoBusca 
      ? `/api/mesas?busca=${encodeURIComponent(termoBusca)}&t=${Date.now()}`
      : `/api/mesas?t=${Date.now()}`; // ← Adiciona timestamp para evitar cache
    
    console.log('🔄 Carregando mesas...');
    
    const response = await fetch(url, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    
    const data = await response.json();
    
    console.log('📥 Mesas recebidas:', data.data?.length || 0);
    
    if (data.success) {
      setMesas(data.data);
    } else {
      console.error('Erro na API:', data.error);
      setMesas([]);
    }
  } catch (error) {
    console.error('Erro ao carregar mesas:', error);
    setMesas([]);
  }
};


useEffect(() => {
    // Desabilitar cache do Next.js para esta página
    if (typeof window !== 'undefined') {
      // Adicionar headers para evitar cache
      fetch('/api/mesas', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
    }
  }, []);

  // Carregar inicial
  useEffect(() => {
  const carregarInicial = async () => {
    setCarregando(true);
    await carregarMesas();
    setCarregando(false);
  };
  
  carregarInicial();
  
  // Recarregar sempre que a página for exibida
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      // Página ficou visível novamente (voltou do apagar mesa)
      carregarMesas(busca);
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, []);

useEffect(() => {
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      // Página ficou visível (usuário voltou do apagar mesa)
      console.log('👀 Página visível - recarregando mesas...');
      carregarMesas(busca);
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Também escutar eventos de focus (quando volta de outra aba/janela)
  window.addEventListener('focus', handleVisibilityChange);
  
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleVisibilityChange);
  };
}, [busca]);


    // ✅ NOVO: Escutar atualizações de comandas
  useEffect(() => {
    // Função para escutar eventos de atualização
    const handleComandaAtualizada = (event: CustomEvent) => {
      console.log('Comanda atualizada recebida:', event.detail);
      // Forçar recarregar mesas
      carregarMesas(busca);
    };
    
    // Escutar evento customizado
    window.addEventListener('comanda-atualizada' as any, handleComandaAtualizada);
    
    // Verificar localStorage periodicamente
    const checkStorageInterval = setInterval(() => {
      let precisaAtualizar = false;
      
      // Verificar se alguma comanda foi atualizada recentemente
      mesas.forEach(mesa => {
        const chave = `comanda_atualizada_${mesa.numero}`;
        const dados = localStorage.getItem(chave);
        
        if (dados) {
          try {
            const { timestamp } = JSON.parse(dados);
            const dataAtualizacao = new Date(timestamp);
            const agora = new Date();
            const diferenca = agora.getTime() - dataAtualizacao.getTime();
            
            // Se foi atualizado nos últimos 10 segundos
            if (diferenca < 10000) {
              precisaAtualizar = true;
              // Remover do localStorage após usar
              localStorage.removeItem(chave);
            }
          } catch (e) {
            console.error('Erro ao parsear dados da comanda:', e);
          }
        }
      });
      
      if (precisaAtualizar) {
        carregarMesas(busca);
      }
    }, 2000); // Verificar a cada 2 segundos
    
    return () => {
      window.removeEventListener('comanda-atualizada' as any, handleComandaAtualizada);
      clearInterval(checkStorageInterval);
    };
  }, [busca, mesas]);

    useEffect(() => {
  const handleFocus = () => {
    // Quando a página recebe foco (volta do apagar mesa), recarrega
    carregarMesas(busca);
  };
  
  window.addEventListener('focus', handleFocus);
  
  return () => {
    window.removeEventListener('focus', handleFocus);
  };
}, [busca]);

  // Atualizar a cada 5 segundos
  useEffect(() => {
  // Escutar eventos de mesa removida
  const handleMesaRemovida = (event: CustomEvent) => {
    console.log('Evento: mesa removida', event.detail);
    
    // Remover a mesa da lista local IMEDIATAMENTE
    setMesas(prev => prev.filter(mesa => 
      mesa._id !== event.detail.mesaId && 
      mesa.numero !== event.detail.mesaId &&
      mesa.numero !== event.detail.numeroMesa
    ));
    
    // Forçar recarregar do banco também
    setTimeout(() => {
      carregarMesas(busca);
    }, 500);
  };
  
  // Verificar localStorage por mesas removidas
  const verificarMesasRemovidas = () => {
    const chaves = Object.keys(localStorage);
    chaves.forEach(chave => {
      if (chave.startsWith('mesa_removida_')) {
        try {
          const dados = JSON.parse(localStorage.getItem(chave) || '{}');
          const mesaIdRemovida = chave.replace('mesa_removida_', '');
          
          // Remover da lista local
          setMesas(prev => prev.filter(mesa => 
            mesa._id !== mesaIdRemovida && 
            mesa.numero !== mesaIdRemovida
          ));
          
          // Limpar o item do localStorage
          localStorage.removeItem(chave);
        } catch (e) {
          console.error('Erro ao processar mesa removida:', e);
        }
      }
    });
  };
  
  // Configurar o listener de evento
  window.addEventListener('mesa-removida' as any, handleMesaRemovida);
  
  // Verificar ao carregar
  verificarMesasRemovidas();
  
  // Verificar periodicamente
  const interval = setInterval(verificarMesasRemovidas, 2000);
  
  return () => {
    window.removeEventListener('mesa-removida' as any, handleMesaRemovida);
    clearInterval(interval);
  };
}, [busca]);

  // Buscar mesa - FLUXO COMPLETO
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
        if (data.data && data.data.length > 0) {
          setResultadoBusca(data.data);
          
          // Se encontrou exatamente uma mesa, PERGUNTAR se quer entrar
          if (data.data.length === 1) {
            const mesaEncontrada = data.data[0];
            setMesaExistenteInfo(mesaEncontrada);
            setMostrarModalMesaExistente(true);
          } else {
            // Mostrar resultados múltiplos
            setMesas(data.data);
          }
        } else {
          // Nenhuma mesa encontrada - PERGUNTAR se quer criar
          setMesaParaCriar(busca);
          setMostrarModalNaoEncontrada(true);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar mesa:', error);
      // Se a rota não existir, tenta buscar na lista geral
      await carregarMesas(busca);
    }
  };

  // Enter para buscar
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      buscarMesa();
    }
  };

  // Entrar na mesa encontrada
  const entrarNaMesaExistente = () => {
    if (mesaExistenteInfo) {
      router.push(`/mesas/${mesaExistenteInfo.numero}`);
    }
    setMostrarModalMesaExistente(false);
    setMesaExistenteInfo(null);
  };

  // Criar mesa nova (botão "Nova Mesa")
   // Criar mesa nova (botão "Nova Mesa") - CORRIGIDA
  const criarMesa = async () => {
    if (!numeroNovaMesa.trim()) {
      setMensagemErro('Digite o número da mesa');
      return;
    }
    
    try {
      setCriandoMesa(true);
      setMensagemErro('');
      
      // Criar nova mesa diretamente
      const response = await fetch('/api/mesas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: numeroNovaMesa,
          nome: nomeNovaMesa || `Mesa ${numeroNovaMesa.padStart(2, '0')}`
        }),
      });
      
      // Verificar se a resposta é JSON válido
      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Resposta não é JSON válido:', responseText);
        throw new Error('Resposta do servidor inválida');
      }
      
      console.log('Resposta da API:', data);
      
      if (response.status === 409 && data.data) {
        // Mesa já existe - perguntar se quer entrar
        setMesaExistenteInfo(data.data);
        setMostrarModalMesaExistente(true);
        setMostrarModalCriar(false);
        return;
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido ao criar mesa');
      }
      
      // Sucesso - adicionar à lista e redirecionar
      setMesas(prev => [...prev, data.data]);
      setMostrarModalCriar(false);
      setNumeroNovaMesa('');
      setNomeNovaMesa('');
      
      // Redirecionar direto para a nova mesa
      router.push(`/mesas/${data.data.numero}`);
      
    } catch (error) {
      console.error('Erro completo ao criar mesa:', error);
      setMensagemErro(error instanceof Error ? error.message : 'Erro ao criar mesa. Verifique o console.');
    } finally {
      setCriandoMesa(false);
    }
  };

  // Criar mesa da busca (quando não encontrou) - CORRIGIDA
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
      
      // Verificar se a resposta é JSON válido
      const responseText = await response.text();
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Resposta não é JSON válido:', responseText);
        throw new Error('Resposta do servidor inválida');
      }
      
      if (response.status === 409 && data.data) {
        // Mesa já existe - perguntar se quer entrar
        setMesaExistenteInfo(data.data);
        setMostrarModalMesaExistente(true);
        setMostrarModalNaoEncontrada(false);
        return;
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido ao criar mesa');
      }
      
      // Sucesso
      setMostrarModalNaoEncontrada(false);
      setMesaParaCriar('');
      router.push(`/mesas/${data.data.numero}`);
      
    } catch (error) {
      console.error('Erro ao criar mesa da busca:', error);
      alert('Erro ao criar mesa: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
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
          <Link
            href="/configuracao"
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings className="h-5 w-5" />
            <span className="hidden md:inline">Configurações</span>
          </Link>

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

      {/* Modal: Mesa não encontrada (busca) */}
      {mostrarModalNaoEncontrada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-start mb-6">
              <div className="bg-yellow-100 p-3 rounded-full mr-4">
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Mesa não encontrada</h3>
                <p className="text-gray-600 mt-1">Não existe uma mesa com o número/nome: <strong>{mesaParaCriar}</strong></p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-gray-700">Deseja criar uma nova mesa com esse número?</p>
              <div className="mt-2">
                <p className="text-sm text-gray-600">Nome: <span className="font-medium">Mesa {mesaParaCriar.padStart(2, '0')}</span></p>
                <p className="text-sm text-gray-600">Número: <span className="font-medium">{mesaParaCriar}</span></p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setMostrarModalNaoEncontrada(false);
                  setMesaParaCriar('');
                }}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={criarMesaDaBusca}
                disabled={criandoMesa}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {criandoMesa ? 'Criando...' : 'Sim, criar mesa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Mesa já existe */}
      {mostrarModalMesaExistente && mesaExistenteInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-start mb-6">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <AlertCircle className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Mesa já existe!</h3>
                <p className="text-gray-600 mt-1">A mesa <strong>{mesaExistenteInfo.numero}</strong> já está cadastrada.</p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Status:</span>
                <span className="font-medium">
                  {mesaExistenteInfo.totalComanda > 0 ? 'Comanda aberta' : 'Mesa livre'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Valor:</span>
                <span className="font-bold text-green-600">
                  {formatarMoeda(mesaExistenteInfo.totalComanda)}
                </span>
              </div>
              {mesaExistenteInfo.quantidadeItens > 0 && (
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-700">Itens:</span>
                  <span className="font-medium">
                    {mesaExistenteInfo.quantidadeItens} itens
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setMostrarModalMesaExistente(false);
                  setMesaExistenteInfo(null);
                }}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Voltar
              </button>
              <button
                onClick={entrarNaMesaExistente}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Entrar na mesa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Criar nova mesa */}
      {mostrarModalCriar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Criar Nova Mesa</h3>
            <p className="text-gray-600 mb-6">Preencha os dados da nova mesa</p>
            
            {mensagemErro && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
                {mensagemErro}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número da Mesa *
                </label>
                <input
                  type="text"
                  value={numeroNovaMesa}
                  onChange={(e) => setNumeroNovaMesa(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: 1, 2, 3..."
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Mesa (opcional)
                </label>
                <input
                  type="text"
                  value={nomeNovaMesa}
                  onChange={(e) => setNomeNovaMesa(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: VIP, Janela, Varanda..."
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  setMostrarModalCriar(false);
                  setNumeroNovaMesa('');
                  setNomeNovaMesa('');
                  setMensagemErro('');
                }}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={criarMesa}
                disabled={criandoMesa || !numeroNovaMesa.trim()}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {criandoMesa ? 'Criando...' : 'Criar Mesa'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
        <p>MongoDB • {mesas.length} mesas • Atualiza a cada 5 segundos</p>
      </div>
    </div>
  );
}
