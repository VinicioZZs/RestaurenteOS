// app/dashboard/page.tsx - VERSÃO COM AUTH INTEGRADA
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Plus, Clock, LogOut, Settings, AlertCircle, Lock, Unlock } from 'lucide-react'; 
import { getCurrentUser, hasRole } from '@/lib/auth'; 
import { BarChart3 , ShoppingBag } from 'lucide-react';
import { login } from '@/lib/auth'; // Já está importado



interface Mesa {
  _id: string;
  numero: string;
  nome: string;
  totalComanda: number;
  quantidadeItens: number;
  atualizadoEm: string;
  status?: string; // Adicione esta linha - opcional
  capacidade?: number; // Se precisar
  // Adicione outras propriedades que podem existir
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
  const [configSistema, setConfigSistema] = useState<any>(null);
  
  // NOVOS ESTADOS PARA CAIXA
  const [caixaStatus, setCaixaStatus] = useState<'aberto' | 'fechado'>('fechado');
  const [carregandoCaixa, setCarregandoCaixa] = useState(true);
  const [temPermissaoCaixa, setTemPermissaoCaixa] = useState(false);

  // ========== FUNÇÕES DO CAIXA ==========

  const [usuarioLogado, setUsuarioLogado] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUsuarioLogado(JSON.parse(userStr));
    }
  }, []);


  const carregarStatusCaixa = async () => {
  try {
    setCarregandoCaixa(true);
    const response = await fetch('/api/caixa/status');
    const data = await response.json();
    
    console.log('📊 Status do caixa:', data);
    
    if (data.success && data.data) {
      // Verifica o status do caixa na resposta
      setCaixaStatus(data.data.status || 'fechado');
    } else {
      // Se não conseguir obter status, assume fechado
      setCaixaStatus('fechado');
    }
  } catch (error) {
    console.error('Erro ao carregar caixa:', error);
    setCaixaStatus('fechado'); // Assume fechado em caso de erro
  } finally {
    setCarregandoCaixa(false);
  }
};

  const verificarPermissaoCaixa = () => {
    const user = getCurrentUser();
    setUsuarioLogado(user);
    
    if (!user) {
      setTemPermissaoCaixa(false);
      return;
    }
    
    // Permissões baseadas no role do usuário
    // admin, caixa e um role "gerente" podem abrir/fechar caixa
    const permitido = hasRole('admin') || hasRole('caixa');
    setTemPermissaoCaixa(permitido);
  };

  // ========== FUNÇÕES ORIGINAIS DO DASHBOARD ==========

  const carregarConfigs = async () => {
  try {
    const response = await fetch('/api/configuracao/geral');
    const data = await response.json();
    if (data.success) {
      setConfigSistema(data.data);
    }
  } catch (error) {
    console.error("Erro ao carregar presets:", error);
  }
};

const obterTituloPreset = () => {
  const preset = configSistema?.presetComanda || 'mesa';
  const titulos: any = {
    comanda: 'Comanda',
    ficha: 'Ficha',
    mesa: 'Mesa',
    pedido: 'Pedido'
  };
  return titulos[preset] || 'Mesa';
};

  const carregarMesas = async () => {
  try {
    const response = await fetch('/api/comandas');
    const data = await response.json();
    
    if (data.success && data.data) {
      const comandas: any[] = data.data;
      
      // Mapeia os dados do banco para o que o componente visual espera
      const mesasFormatadas: Mesa[] = data.data.map((comanda: any) => ({
        _id: comanda._id,
        numero: comanda.numero, // O número da mesa
        nome: comanda.nome,
        totalComanda: comanda.totalComanda || 0, // 🔥 Aqui deve bater com o nome da API acima
        quantidadeItens: comanda.quantidadeItens || 0,
        atualizadoEm: comanda.atualizadoEm
      }));
      
      setMesas(mesasFormatadas);
    }
  } catch (error) {
  } finally {
    setCarregando(false);
  }
};

  const buscarMesa = async () => {
  if (!busca.trim()) return;
  
  try {
    const response = await fetch(`/api/mesas/buscar?termo=${encodeURIComponent(busca)}`);
    const data = await response.json();
    
    if (data.success && data.data) {
      const mesaEncontrada = data.data;

      // SE A MESA EXISTE MAS ESTÁ LIVRE (Total 0), ENTRA DIRETO
      if (mesaEncontrada.totalComanda === 0 || mesaEncontrada.status === 'livre') {
        router.push(`/mesas/${mesaEncontrada.numero}`);
      } else {
        // SE ESTIVER OCUPADA, MOSTRA O MODAL DE MESA EXISTENTE
        setMesaExistenteInfo(mesaEncontrada);
        setMostrarModalMesaExistente(true);
      }
    } else {
      // SE REALMENTE NÃO EXISTIR NO BANCO, PERGUNTA SE QUER CRIAR
      setMesaParaCriar(busca);
      setMostrarModalNaoEncontrada(true);
    }
  } catch (error) {
    console.error('Erro ao buscar mesa:', error);
  }
};

  const criarMesa = async () => {
  if (!numeroNovaMesa.trim()) {
    setMensagemErro('Digite o número da mesa');
    return;
  }
  
  try {
    setCriandoMesa(true);
    setMensagemErro('');
    
    // 🔥 Verificar se já existe mesa com este número (normalizado)
    const numeroMesaNormalizado = numeroNovaMesa.padStart(2, '0');
    
    // Primeiro verificar se já existe
    const verificarExistente = async () => {
      const response = await fetch(`/api/mesas/buscar?termo=${encodeURIComponent(numeroNovaMesa)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.length > 0) {
          return data.data[0];
        }
      }
      
      // Verificar também com número normalizado
      const responseNormalizado = await fetch(`/api/mesas/buscar?termo=${encodeURIComponent(numeroMesaNormalizado)}`);
      if (responseNormalizado.ok) {
        const dataNormalizado = await responseNormalizado.json();
        if (dataNormalizado.success && dataNormalizado.data && dataNormalizado.data.length > 0) {
          return dataNormalizado.data[0];
        }
      }
      
      return null;
    };
    
    const mesaExistente = await verificarExistente();
    
    if (mesaExistente) {
      // Mesa já existe, mostra modal
      setMesaExistenteInfo(mesaExistente);
      setMostrarModalMesaExistente(true);
      setMostrarModalCriar(false);
      return;
    }
    
    // Se não existe, criar normalmente
    const response = await fetch('/api/mesas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        numero: numeroMesaNormalizado, // 🔥 Salva já normalizado
        nome: nomeNovaMesa || `Mesa ${numeroMesaNormalizado}`
      }),
    });
    
    const responseText = await response.text();
    let data;
    
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Resposta não é JSON válido:', responseText);
      throw new Error('Resposta do servidor inválida');
    }
    
    if (response.status === 409 && data.data) {
      setMesaExistenteInfo(data.data);
      setMostrarModalMesaExistente(true);
      setMostrarModalCriar(false);
      return;
    }
    
    if (!data.success) {
      throw new Error(data.error || 'Erro desconhecido ao criar mesa');
    }
    
    setMesas(prev => [...prev, data.data]);
    setMostrarModalCriar(false);
    setNumeroNovaMesa('');
    setNomeNovaMesa('');
    router.push(`/mesas/${data.data.numero}`);
    
  } catch (error) {
    console.error('Erro completo ao criar mesa:', error);
    setMensagemErro(error instanceof Error ? error.message : 'Erro ao criar mesa. Verifique o console.');
  } finally {
    setCriandoMesa(false);
  }
};

  const criarMesaDaBusca = async () => {
  if (!mesaParaCriar) return;
  
  try {
    setCriandoMesa(true);
    
    // Normalizar número
    const numeroMesaNormalizado = mesaParaCriar.padStart(2, '0');
    
    // Verificar se já existe mesa (com número original e normalizado)
    const verificarExistente = async () => {
      const responses = await Promise.all([
        fetch(`/api/mesas/buscar?termo=${encodeURIComponent(mesaParaCriar)}`),
        fetch(`/api/mesas/buscar?termo=${encodeURIComponent(numeroMesaNormalizado)}`)
      ]);
      
      for (const response of responses) {
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data && data.data.length > 0) {
            return data.data[0];
          }
        }
      }
      return null;
    };

    const verificarMesaExistente = async (numeroMesa: string): Promise<any> => {
  try {
    const responses = await Promise.all([
      fetch(`/api/mesas/buscar?termo=${encodeURIComponent(numeroMesa)}`),
      fetch(`/api/mesas/buscar?termo=${encodeURIComponent(numeroMesa.padStart(2, '0'))}`)
    ]);
    
    for (const response of responses) {
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.length > 0) {
          return data.data[0]; // Retorna a primeira mesa encontrada
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao verificar mesa existente:', error);
    return null;
  }
};
    
    const mesaExistente = await verificarExistente();
    
    if (mesaExistente) {
      setMesaExistenteInfo(mesaExistente);
      setMostrarModalMesaExistente(true);
      setMostrarModalNaoEncontrada(false);
      return;
    }
    
    const response = await fetch('/api/mesas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        numero: numeroMesaNormalizado,
        nome: `${obterTituloPreset()} ${numeroMesaNormalizado}`
      }),
    });
    
    const responseText = await response.text();
    let data;
    
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Resposta não é JSON válido:', responseText);
      throw new Error('Resposta do servidor inválida');
    }
    
    if (response.status === 409 && data.data) {
      setMesaExistenteInfo(data.data);
      setMostrarModalMesaExistente(true);
      setMostrarModalNaoEncontrada(false);
      return;
    }
    
    if (!data.success) {
      throw new Error(data.error || 'Erro desconhecido ao criar mesa');
    }
    
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

  const entrarNaMesaExistente = () => {
    if (mesaExistenteInfo) {
      router.push(`/mesas/${mesaExistenteInfo.numero}`);
    }
    setMostrarModalMesaExistente(false);
    setMesaExistenteInfo(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      buscarMesa();
    }
  };

  const sair = () => {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    router.push('/');
  };

  // ========== USE EFFECTS ==========
  useEffect(() => {
  console.log('🔍 Permissões do usuário logado:', usuarioLogado?.permissoes);
  console.log('Tem acesso ao balcão?', usuarioLogado?.permissoes?.canAccessBalcao);
}, [usuarioLogado]);

  useEffect(() => {
    // Verificar login primeiro
    const user = getCurrentUser();
    if (!user) {
      router.push('/');
      return;
    }
    
    carregarStatusCaixa();
    verificarPermissaoCaixa();
  }, [router]);


  useEffect(() => {
  carregarConfigs();
}, []);

  useEffect(() => {
  const carregarInicial = async () => {
    setCarregando(true);
    await carregarMesas();
    setCarregando(false);
  };
  
  // MUDANÇA: Se o status for undefined ou aberto, ele tenta carregar
  if (caixaStatus === 'aberto' || caixaStatus === undefined) {
    carregarInicial();
  }
}, [caixaStatus]);

  useEffect(() => {
  const handleComandaFechada = (event: CustomEvent) => {
    const { mesaId, numeroMesa } = event.detail || {};
    
    setMesas(prev => prev.filter(mesa => {
      // Remove se o _id bater OU se o numero bater
      const deveRemover = 
        (mesa._id === mesaId) || 
        (mesa.numero === numeroMesa) ||
        (mesa.numero === mesaId); // Backup caso os campos venham trocados
      
      return !deveRemover;
    }));

    // Recarregar do banco para garantir sincronia total
    setTimeout(() => carregarMesas(), 500);
  };

  window.addEventListener('comanda-fechada' as any, handleComandaFechada);
  return () => window.removeEventListener('comanda-fechada' as any, handleComandaFechada);
}, [busca]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      fetch('/api/mesas', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
    }
  }, []);


  useEffect(() => {
  const handleComandaFechada = (event: CustomEvent) => {
    console.log('🎯 Evento comanda-fechada recebido:', event.detail);
    
    const { mesaId, numeroMesa, mesaNumero } = event.detail || {};
    
    // Usar mesaNumero se disponível, senão numeroMesa
    const numeroMesaParaRemover = mesaNumero || numeroMesa;
    
    if (!numeroMesaParaRemover) {
      console.log('⚠️ Evento sem número da mesa');
      return;
    }
    
    console.log(`🗑️ Removendo mesa ${numeroMesaParaRemover} do dashboard`);
    
    // Remover imediatamente da lista
    setMesas(prevMesas => {
      const novasMesas = prevMesas.filter(mesa => 
        mesa.numero !== numeroMesaParaRemover &&
        mesa.numero !== numeroMesaParaRemover.toString().padStart(2, '0') &&
        mesa.numero !== numeroMesaParaRemover.toString() &&
        mesa._id !== mesaId
      );
      
      console.log(`📊 Mesas removidas: ${prevMesas.length} → ${novasMesas.length}`);
      return novasMesas;
    });
    
    // Forçar recarregar do banco
    setTimeout(() => {
      carregarMesas;
    }, 500);
  };
  
  // Adicionar listener
  window.addEventListener('comanda-fechada' as any, handleComandaFechada);
  
  return () => {
    window.removeEventListener('comanda-fechada' as any, handleComandaFechada);
  };
}, [carregarMesas]);

// ADICIONE ESTE useEffect PARA SINCRONIZAÇÃO ENTRE ABAS
useEffect(() => {
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === 'sync_dashboard') {
      console.log('🔄 Sincronizando dashboard entre abas...');
      carregarMesas;
    }
    
    if (event.key?.startsWith('mesa_fechada_')) {
      try {
        const dados = JSON.parse(event.newValue || '{}');
        if (dados.numeroMesa) {
          console.log(`📦 Mesa fechada em outra aba: ${dados.numeroMesa}`);
          setMesas(prev => prev.filter(m => 
            m.numero !== dados.numeroMesa && 
            m.numero !== dados.numeroMesaFormatado
          ));
        }
      } catch (e) {
        console.error('Erro ao processar storage change:', e);
      }
    }
  };
  
  // Verificar se há mesas fechadas recentemente
  const verificarMesasFechadasRecentes = () => {
    try {
      const ultimaFechada = localStorage.getItem('ultima_comanda_fechada');
      if (ultimaFechada) {
        const { mesaNumero, timestamp } = JSON.parse(ultimaFechada);
        const dataFechamento = new Date(timestamp);
        const agora = new Date();
        const diferencaMinutos = (agora.getTime() - dataFechamento.getTime()) / (1000 * 60);
        
        // Se foi fechada nos últimos 2 minutos, remover
        if (diferencaMinutos < 2 && mesaNumero) {
          console.log(`🔄 Removendo mesa fechada recentemente: ${mesaNumero}`);
          setMesas(prev => prev.filter(m => 
            m.numero !== mesaNumero && 
            m.numero !== mesaNumero.toString().padStart(2, '0')
          ));
        }
      }
    } catch (e) {
      console.error('Erro ao verificar mesas fechadas:', e);
    }
  };
  
  // Verificar imediatamente
  verificarMesasFechadasRecentes();
  
  // Adicionar listeners
  window.addEventListener('storage', handleStorageChange);
  window.addEventListener('dashboard-refresh', () => carregarMesas);
  
  return () => {
    window.removeEventListener('storage', handleStorageChange);
    window.removeEventListener('dashboard-refresh', () => carregarMesas);
  };
}, [carregarMesas]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && caixaStatus === 'aberto') {
        carregarMesas;
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [caixaStatus]);

  useEffect(() => {
  // 🔥 LISTENER FORTE PARA COMANDA FECHADA
  const handleComandaFechadaForte = (event: CustomEvent) => {
    console.log('🔥🔥🔥 EVENTO COMANDA-FECHADA DETECTADO:', event.detail);
    
    const { 
      comandaId, 
      mesaId, 
      numeroMesa, 
      mesaNumero,
      total,
      mesaAtualizada,
      source
    } = event.detail || {};
    
    console.log('📦 Dados do evento:', {
      comandaId,
      mesaId,
      numeroMesa,
      mesaNumero,
      total,
      mesaAtualizada,
      source
    });
    
    // Determinar qual número usar para remover
    const numeroParaRemover = mesaNumero || numeroMesa || mesaId;
    
    if (!numeroParaRemover) {
      console.warn('⚠️ Evento sem número identificável');
      return;
    }
    
    console.log(`🗑️ REMOVENDO MESA: ${numeroParaRemover}`);
    
    // Remover MESMO SE O TOTAL NÃO FOR ZERO
    setMesas(prev => {
      const novasMesas = prev.filter(mesa => {
        // Múltiplas formas de identificar a mesa
        const deveRemover = 
          mesa._id === mesaId ||
          mesa.numero === numeroParaRemover ||
          mesa.numero === numeroParaRemover.toString() ||
          mesa.numero === numeroParaRemover.toString().padStart(2, '0') ||
          mesa.numero === mesaId?.toString() ||
          (mesaNumero && mesa.numero === mesaNumero) ||
          (numeroMesa && mesa.numero === numeroMesa);
        
        if (deveRemover) {
          console.log(`   🚫 Removendo mesa ${mesa.numero} (ID: ${mesa._id})`);
        }
        
        return !deveRemover;
      });
      
      console.log(`📊 Dashboard atualizado: ${prev.length} → ${novasMesas.length} mesas`);
      return novasMesas;
    });
    
    // 🔥 FORÇAR RECARREGAMENTO DO BANCO
    console.log('🔄 Forçando recarregamento do banco...');
    setTimeout(() => {
      carregarMesas;
    }, 300);
    
    // 🔥 SALVAR NO LOCALSTORAGE PARA EVITAR REAPARECIMENTO
    if (typeof window !== 'undefined') {
      const chave = `mesa_removida_${numeroParaRemover}_${Date.now()}`;
      localStorage.setItem(chave, JSON.stringify({
        mesaId,
        numeroMesa,
        mesaNumero,
        removidoEm: new Date().toISOString(),
        source: 'dashboard-listener'
      }));
    }
  };
  
  // 🔥 LISTENER PARA EVENTO ALTERNATIVO
  const handleMesaFechada = (event: CustomEvent) => {
    console.log('🔥 EVENTO MESA-FECHADA:', event.detail);
    
    const { mesaId, numeroMesa, mesaNumero, action } = event.detail || {};
    const numeroParaRemover = mesaNumero || numeroMesa;
    
    if (numeroParaRemover) {
      console.log(`🗑️ Removendo via mesa-fechada: ${numeroParaRemover}`);
      
      setMesas(prev => prev.filter(mesa => 
        mesa._id !== mesaId &&
        mesa.numero !== numeroParaRemover &&
        mesa.numero !== numeroParaRemover.toString().padStart(2, '0')
      ));
      
      setTimeout(() => carregarMesas, 300);
    }
  };
  
  console.log('👂 Adicionando listeners fortes para eventos...');
  
  // Adicionar ambos listeners
  window.addEventListener('comanda-fechada' as any, handleComandaFechadaForte);
  window.addEventListener('mesa-fechada' as any, handleMesaFechada);
  
  return () => {
    window.removeEventListener('comanda-fechada' as any, handleComandaFechadaForte);
    window.removeEventListener('mesa-fechada' as any, handleMesaFechada);
  };
}, [carregando, carregarMesas]);

  useEffect(() => {
  const handleComandaAtualizada = (event: CustomEvent) => {
    console.log('Comanda atualizada recebida:', event.detail);
    
    const { mesaId, numeroMesa, total, action } = event.detail || {};
    
    // 🔥 SE action for 'update', apenas recarregar, NÃO remover
    if (action === 'update') {
      carregarMesas;
      return;
    }
    
    // 🔥 SE O TOTAL FOR 0, REMOVER A MESA IMEDIATAMENTE!
    if (total === 0 || total === '0') {
      console.log(`🗑️ Comanda ZERADA - Removendo mesa ${numeroMesa || mesaId}`);
      
      setMesas(prev => {
        const novasMesas = prev.filter(mesa => 
          mesa._id !== mesaId && 
          mesa.numero !== numeroMesa
        );
        console.log(`📊 Removida: ${prev.length} → ${novasMesas.length} mesas`);
        return novasMesas;
      });
      
      setTimeout(() => {
        carregarMesas;
      }, 300);
      
    } else {
      // Se não for zero, só recarregar normal
      carregarMesas;
    }
  };
  
  window.addEventListener('comanda-atualizada' as any, handleComandaAtualizada);
  
  return () => {
    window.removeEventListener('comanda-atualizada' as any, handleComandaAtualizada);
  };
}, [carregarMesas]);

  
  useEffect(() => {
  // Verificar status do caixa periodicamente
  const interval = setInterval(() => {
    if (caixaStatus === 'aberto') {
      carregarStatusCaixa();
    }
  }, 30000); // A cada 30 segundos

  return () => clearInterval(interval);
}, [caixaStatus]);

  
  useEffect(() => {
    const handleMesaRemovida = (event: CustomEvent) => {
      console.log('Evento: mesa removida', event.detail);
      
      setMesas(prev => prev.filter(mesa => 
        mesa._id !== event.detail.mesaId && 
        mesa.numero !== event.detail.mesaId &&
        mesa.numero !== event.detail.numeroMesa
      ));
      
      setTimeout(() => {
        carregarMesas;
      }, 500);
    };

    const removerMesaFechada = (mesaId: string, numeroMesa: string) => {
  console.log(`🔥 Removendo mesa fechada: ${numeroMesa} (${mesaId})`);
  
  // 1. Remover do estado
  setMesas(prev => prev.filter(mesa => 
    mesa._id !== mesaId && 
    mesa.numero !== numeroMesa &&
    mesa.numero !== mesaId
  ));
  
  // 2. Forçar recarregar do banco
  setTimeout(() => {
    carregarMesas;
    console.log('🔄 Forçando recarregamento do banco');
  }, 100);
  
  // 3. Marcar para não aparecer novamente
  sessionStorage.setItem(`mesa_removida_${mesaId}`, new Date().toISOString());
};

// E modifique o event listener:
window.addEventListener('comanda-fechada' as any, (event: CustomEvent) => {
  const { mesaId, numeroMesa } = event.detail || {};
  if (mesaId || numeroMesa) {
    removerMesaFechada(mesaId, numeroMesa);
  }
});
    
    const verificarMesasRemovidas = () => {
      const chaves = Object.keys(localStorage);
      chaves.forEach(chave => {
        if (chave.startsWith('mesa_removida_')) {
          try {
            const dados = JSON.parse(localStorage.getItem(chave) || '{}');
            const mesaIdRemovida = chave.replace('mesa_removida_', '');
            
            setMesas(prev => prev.filter(mesa => 
              mesa._id !== mesaIdRemovida && 
              mesa.numero !== mesaIdRemovida
            ));
            
            localStorage.removeItem(chave);
          } catch (e) {
            console.error('Erro ao processar mesa removida:', e);
          }
        }
      });
    };
    
    window.addEventListener('mesa-removida' as any, handleMesaRemovida);
    verificarMesasRemovidas();
    
    const interval = setInterval(verificarMesasRemovidas, 2000);
    
    return () => {
      window.removeEventListener('mesa-removida' as any, handleMesaRemovida);
      clearInterval(interval);
    };
  }, [busca]);

  

  useEffect(() => {
    async function carregarConfiguracoes() {
      try {
        const response = await fetch('/api/configuracoes');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setConfigSistema(data.data);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    }
    
    carregarConfiguracoes();
  }, []);

  useEffect(() => {
  console.log('🔍 ====== DEBUG DASHBOARD ======');
  console.log('📊 Estado atual das mesas:', {
    total: mesas.length,
    detalhes: mesas.map(m => ({
      id: m._id,
      numero: m.numero,
      nome: m.nome,
      total: m.totalComanda,
      quantidadeItens: m.quantidadeItens,
      // status: m.status || 'desconhecido', // REMOVA ou comente se não existir
      atualizadoEm: m.atualizadoEm
    }))
  });
  console.log('🔄 Status do caixa:', caixaStatus);
  console.log('🔍 Busca atual:', busca);
  console.log('================================');
}, [mesas, caixaStatus, busca]);

  // ========== FUNÇÕES AUXILIARES ==========

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

const formatarTituloMesa = (mesa: Mesa) => {
  // Pega o preset do banco ou usa 'Mesa' como padrão
  const presetAtivo = configSistema?.presetComanda || 'mesa';
  
  const titulos: Record<string, string> = {
    comanda: 'Comanda',
    ficha: 'Ficha',
    mesa: 'Mesa',
    pedido: 'Pedido'
  };

  const prefixo = titulos[presetAtivo] || 'Mesa';
  
  // Usa o número da mesa que já normalizamos (01, 13, etc)
  return `${prefixo} ${mesa.numero}`;
};

  // ========== RENDERIZAÇÃO ==========

  if (carregandoCaixa) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando sistema...</p>
        </div>
      </div>
    );
  }

  // ========== CAIXA FECHADO ==========
  if (caixaStatus === 'fechado') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                restaurante
              </h1>
            </div>
            <p className="text-gray-600">Sistema de gerenciamento • Caixa Fechado</p>
            {usuarioLogado && (
              <p className="text-sm text-gray-500 mt-1">
                Usuário: {usuarioLogado.name} ({usuarioLogado.role})
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Link
              href="/configuracao/geral"
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

            <div className="fixed bottom-4 left-4 z-50">
</div>

        <div className="max-w-2xl mx-auto mt-16">
          <div className="text-center mb-12">
            <div className="inline-block p-6 bg-gray-100 rounded-2xl mb-6">
              <Lock className="h-20 w-20 text-gray-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Caixa Fechado</h2>
            <p className="text-gray-600 text-lg">
              Para acessar as comandas, é necessário abrir o caixa primeiro.
            </p>
          </div>

          {temPermissaoCaixa ? (
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Abrir Caixa</h3>
                <p className="text-gray-600 mb-6">
                  Clique no botão abaixo para iniciar o caixa e começar as vendas do dia.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => router.push('/caixa')}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                  >
                    Ver Status do Caixa
                  </button>
                  
                  <button
                    onClick={() => router.push('/caixa/abertura')}
                    className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 font-bold shadow-lg flex items-center justify-center gap-3"
                  >
                    <Unlock className="h-5 w-5" />
                    ABRIR CAIXA
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
                <p className="text-lg font-medium text-yellow-800">
                  Você não tem permissão para abrir o caixa
                </p>
              </div>
              <p className="text-yellow-700">
                Somente administradores e operadores de caixa podem abrir/fechar o caixa.
              </p>
              {usuarioLogado && (
                <p className="text-sm text-yellow-800 mt-3">
                  Seu perfil: <strong>{usuarioLogado.role}</strong> - {usuarioLogado.name}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ========== CAIXA ABERTO - CARREGANDO ==========
  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando {obterTituloPreset()}...</p>
        </div>
      </div>
    );
  }

  // ========== CAIXA ABERTO - DASHBOARD NORMAL ==========
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="flex justify-between items-center mb-6 md:mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Dashboard
            </h1>
            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full flex items-center gap-1">
              <Unlock className="h-3 w-3" />
              CAIXA ABERTO
            </span>
            {configSistema && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {configSistema.presetComanda === 'comanda' ? '📋 Comanda' :
                 configSistema.presetComanda === 'ficha' ? '📄 Ficha' :
                 configSistema?.presetComanda === 'mesa' ? '🪑 Mesa' :
                 '📝 Pedido'}
              </span>
            )}
          </div>
          <p className="text-gray-600 mt-1">
            {mesas.length} {configSistema?.presetComanda === 'ficha' ? 'fichas' :
            configSistema?.presetComanda === 'pedido' ? 'pedidos' :
            configSistema?.presetComanda === 'mesa' ? 'mesas' : 'comandas'}
            {usuarioLogado && (
              <span className="ml-3 text-sm text-gray-500">
                • Usuário: {usuarioLogado.name} ({usuarioLogado.role})
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {usuarioLogado?.permissoes?.canProcessPayment && (
            <button
              onClick={() => router.push('/caixa/fechamento')}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              title="Fechar Caixa"
            >
              <Lock className="h-5 w-5" />
              <span className="hidden md:inline">Fechar Caixa</span>
            </button>
          )}

          {usuarioLogado?.permissoes?.canViewReports && (
            <Link 
              href="/relatorios"
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center gap-2"
            >
              <BarChart3 size={20} />
              Gestão
            </Link>
          )}
          
          {usuarioLogado?.permissoes?.canAccessSettings && (
            <Link
              href="/configuracao/geral"
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="h-5 w-5" />
              <span className="hidden md:inline">Configurações</span>
            </Link>
          )}

          <button
            onClick={sair}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="hidden md:inline">Sair</span>
          </button>
        </div>
      </div>

      {/* SEÇÃO DE BUSCA - ADICIONE ISSO */}
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
                placeholder="Digite o número da mesa e clique na lupa ou aperte enter..."
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
            
            
          </div>
          
          {usuarioLogado?.permissoes?.canOpenComanda && (
      <button
        onClick={() => setMostrarModalCriar(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition w-full md:w-auto justify-center shadow-md hover:shadow-lg h-[48px]" // ← ADICIONE h-[48px] para altura fixa
      >
        <Plus size={20} />
        <span>Criar {obterTituloPreset()}</span>
      </button>
    )}
  </div>
</div>

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
                
                <p className="text-gray-600 mb-1 text-sm">
                  {formatarTituloMesa(mesa)}
                </p>
                
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
              <h3 className="text-xl font-bold text-gray-700 mb-2">Nenhuma {obterTituloPreset()} ativa</h3>
              <p className="text-gray-600 mb-6">Crie sua primeira mesa!</p>
            </div>
          </div>
        )}
      </div>

      {mostrarModalNaoEncontrada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-start mb-6">
              <div className="bg-yellow-100 p-3 rounded-full mr-4">
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">{obterTituloPreset()} não encontrada</h3>
                <p className="text-gray-600 mt-1">Não existe uma {obterTituloPreset()} com o número/nome: <strong>{mesaParaCriar}</strong></p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-gray-700">Deseja criar uma nova {obterTituloPreset()} com esse número?</p>
              <div className="mt-2">
                <p className="text-sm text-gray-600">Nome: <span className="font-medium">{obterTituloPreset()} {mesaParaCriar.padStart(2, '0')}</span></p>
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

      {mostrarModalMesaExistente && mesaExistenteInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-start mb-6">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <AlertCircle className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">{obterTituloPreset()} já existe!</h3>
                <p className="text-gray-600 mt-1">A {obterTituloPreset()} <strong>{mesaExistenteInfo.numero}</strong> já está cadastrada.</p>
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
                  Número da {obterTituloPreset()} *
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
                  Nome da {obterTituloPreset()} (opcional)
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

    {usuarioLogado?.permissoes?.canAccessBalcao && caixaStatus === 'aberto' && (
  <button
    onClick={() => router.push('/balcao')}
    className="fixed bottom-6 right-6 h-16 w-16 hover:w-56 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-full shadow-xl hover:shadow-2xl z-50 flex items-center justify-start transition-all duration-300 ease-in-out group overflow-hidden"
    title="Venda de Balcão"
  >
    {/* Container do Ícone - Mantém o ícone centralizado quando fechado */}
    <div className="min-w-[64px] flex items-center justify-center">
      <ShoppingBag className="h-8 w-8 group-hover:scale-110 transition-transform" />
    </div>

    {/* Texto que aparece no hover */}
    <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-bold pr-6">
      Acessar o balcão
    </span>
  </button>
)}

      <div className="mt-8 pt-8 border-t border-gray-200 text-center text-gray-500 text-sm">
        <p>MongoDB • {mesas.length} mesas • Caixa Aberto</p>
      </div>
    </div>
  );
}
