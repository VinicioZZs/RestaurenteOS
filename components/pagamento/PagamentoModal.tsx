// components/pagamento/PagamentoModal.tsx - VERSÃO COMPLETA CORRIGIDA
'use client';

import { useState, useEffect } from 'react';

// Interfaces
interface ProdutoInfo {
  nome: string;
  categoria: string;
}

interface ItemComanda {
  id: number;
  produtoId: number;
  quantidade: number;
  precoUnitario: number;
  produto: ProdutoInfo;
}

interface ItemPagador {
  itemId: number;
  quantidade: number;
  precoUnitario: number;
  descricao?: string;
}

interface FormaPagamento {
  id: string;
  nome: string;
  taxa: number;
  aceitaTroco?: boolean;
}

interface Pagador {
  id: string;
  nome: string;
  itens: ItemPagador[];
  desconto: number;
  acrescimo: number;
  formaPagamento: string;
  pago: boolean;
  valorPago?: number;
  troco?: number;
  dataPagamento?: string;
}

interface PagamentoModalProps {
  mesa: {
    numero: string;
    nome: string;
  };
  itens: ItemComanda[];
  total: number;
  onClose: () => void;
  onConfirmar: (data: any) => void;
  onSalvarParcial?: (data: any) => void;
  formasPagamentoCustomizadas?: FormaPagamento[];
  comandaId?: string;
  mesaId?: string;
  comandaOriginal?: any;
  onAtualizarComanda?: (comandaId: string, dados: any) => Promise<any>;
}

const formasPagamentoPadrao: FormaPagamento[] = [
  { id: 'dinheiro', nome: 'Dinheiro', taxa: 0, aceitaTroco: true },
  { id: 'cartao_debito', nome: 'Cartão Débito', taxa: 1.5, aceitaTroco: false },
  { id: 'cartao_credito', nome: 'Cartão Crédito', taxa: 3.5, aceitaTroco: false },
  { id: 'pix', nome: 'PIX', taxa: 0, aceitaTroco: false },
  { id: 'vale', nome: 'Vale', taxa: 0, aceitaTroco: false },
];

export default function PagamentoModal({ 
  mesa, 
  itens, 
  total, 
  onClose, 
  onConfirmar,
  onSalvarParcial,
  formasPagamentoCustomizadas = formasPagamentoPadrao,
  comandaId,
  mesaId,
  comandaOriginal,
  onAtualizarComanda
}: PagamentoModalProps) {
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>(formasPagamentoCustomizadas);
  
  // ESTADOS
  const [pagadores, setPagadores] = useState<Pagador[]>([
    { 
      id: '1', 
      nome: 'Cliente 1', 
      itens: [], 
      desconto: 0, 
      acrescimo: 0,
      formaPagamento: '',
      pago: false,
      valorPago: 0,
      troco: 0
    }
  ]);
  
  const [itemDividindo, setItemDividindo] = useState<number | null>(null);
  const [quantidadesDivisao, setQuantidadesDivisao] = useState<Record<string, number>>({});
  const [modalDescontoAcrescimo, setModalDescontoAcrescimo] = useState<{
    aberto: boolean;
    pagadorId: string | null;
    tipo: 'desconto' | 'acrescimo';
  }>({ aberto: false, pagadorId: null, tipo: 'desconto' });
  
  const [valorDescontoAcrescimo, setValorDescontoAcrescimo] = useState('');
  const [editandoNome, setEditandoNome] = useState<string | null>(null);
  const [novoNome, setNovoNome] = useState('');
  const [modoParcial, setModoParcial] = useState(false);
  const [carregando, setCarregando] = useState(false);

  // Quantidades disponíveis por item
  const [quantidadesDisponiveis, setQuantidadesDisponiveis] = useState<Record<number, number>>(() => {
    const inicial: Record<number, number> = {};
    itens.forEach(item => {
      inicial[item.id] = item.quantidade;
    });
    return inicial;
  });

  // Carregar dados salvos anteriormente
  useEffect(() => {
    if (comandaId) {
      carregarPagamentoParcial();
    }
  }, [comandaId]);

  const carregarPagamentoParcial = () => {
    try {
      // Tenta carregar do localStorage
      const dadosSalvos = localStorage.getItem(`pagamento_parcial_${comandaId}`);
      if (dadosSalvos) {
        const { pagadores: pagadoresSalvos, quantidadesDisponiveis: quantidadesSalvas } = JSON.parse(dadosSalvos);
        
        if (pagadoresSalvos && pagadoresSalvos.length > 0) {
          setPagadores(pagadoresSalvos);
        }
        
        if (quantidadesSalvas) {
          setQuantidadesDisponiveis(quantidadesSalvas);
        }
        
        setModoParcial(true);
      }
    } catch (error) {
      console.error('Erro ao carregar pagamento parcial:', error);
    }
  };

  // ========== FUNÇÕES AUXILIARES ==========
  const calcularTotalPagador = (pagador: Pagador): number => {
    const totalItens = pagador.itens.reduce(
      (sum, item) => sum + (item.precoUnitario * item.quantidade), 
      0
    );
    return totalItens - pagador.desconto + pagador.acrescimo;
  };

  const calcularTroco = (pagador: Pagador): number => {
    const total = calcularTotalPagador(pagador);
    if (pagador.valorPago && pagador.valorPago > total) {
      return pagador.valorPago - total;
    }
    return 0;
  };

  const getValorAtribuido = (): number => {
    return pagadores.reduce((total, pagador) => {
      return total + pagador.itens.reduce((sum, item) => {
        return sum + (item.precoUnitario * item.quantidade);
      }, 0);
    }, 0);
  };

  const getValorRestante = (): number => {
    return total - getValorAtribuido();
  };

  const getQuantidadeDisponivel = (itemId: number): number => {
    return quantidadesDisponiveis[itemId] || 0;
  };

  const getValorJaPago = (): number => {
    return pagadores
      .filter(p => p.pago)
      .reduce((total, pagador) => total + calcularTotalPagador(pagador), 0);
  };

  const getValorFaltaPagar = (): number => {
    return pagadores
      .filter(p => !p.pago)
      .reduce((total, pagador) => total + calcularTotalPagador(pagador), 0);
  };

  // ========== FUNÇÕES PRINCIPAIS ==========
  const adicionarPagador = () => {
    const novoId = Date.now().toString();
    const novoPagador: Pagador = {
      id: novoId,
      nome: `Cliente ${pagadores.length + 1}`,
      itens: [],
      desconto: 0,
      acrescimo: 0,
      formaPagamento: '',
      pago: false,
      valorPago: 0,
      troco: 0
    };
    setPagadores([...pagadores, novoPagador]);
  };

  const removerPagador = (id: string) => {
    if (pagadores.length > 1) {
      const pagadorRemovido = pagadores.find(p => p.id === id);
      
      if (pagadorRemovido) {
        const novasQuantidades = { ...quantidadesDisponiveis };
        
        pagadorRemovido.itens.forEach(item => {
          const itemOriginal = itens.find(i => i.id === item.itemId);
          if (itemOriginal) {
            if (novasQuantidades[item.itemId] !== undefined) {
              novasQuantidades[item.itemId] += item.quantidade;
            } else {
              novasQuantidades[item.itemId] = item.quantidade;
            }
          }
        });
        
        setQuantidadesDisponiveis(novasQuantidades);
      }
      
      setPagadores(pagadores.filter(p => p.id !== id));
    }
  };

  const atribuirItem = (itemId: number, pagadorId: string, quantidade: number) => {
    const item = itens.find(i => i.id === itemId);
    if (!item) return;

    setPagadores(prevPagadores => {
      return prevPagadores.map(pagador => {
        if (pagador.id === pagadorId) {
          const itemExistenteIndex = pagador.itens.findIndex(i => i.itemId === itemId);
          
          if (itemExistenteIndex >= 0) {
            const novosItens = [...pagador.itens];
            novosItens[itemExistenteIndex] = {
              ...novosItens[itemExistenteIndex],
              quantidade: novosItens[itemExistenteIndex].quantidade + quantidade
            };
            
            return {
              ...pagador,
              itens: novosItens
            };
          } else {
            const novoItem: ItemPagador = {
              itemId,
              quantidade,
              precoUnitario: item.precoUnitario,
              descricao: item.produto.nome
            };
            
            return {
              ...pagador,
              itens: [...pagador.itens, novoItem]
            };
          }
        }
        return pagador;
      });
    });
  };

  const iniciarDivisaoItem = (itemId: number) => {
    const disponivel = getQuantidadeDisponivel(itemId);
    if (disponivel <= 0) return;
    
    setItemDividindo(itemId);
    
    const pagadoresNaoPagos = pagadores.filter(p => !p.pago);
    const divisao: Record<string, number> = {};
    
    if (pagadoresNaoPagos.length > 0) {
      const qtdBase = Math.floor(disponivel / pagadoresNaoPagos.length);
      const resto = disponivel % pagadoresNaoPagos.length;
      
      pagadoresNaoPagos.forEach((pagador, index) => {
        divisao[pagador.id] = index === 0 ? qtdBase + resto : qtdBase;
      });
    } else {
      const qtdBase = Math.floor(disponivel / pagadores.length);
      const resto = disponivel % pagadores.length;
      
      pagadores.forEach((pagador, index) => {
        divisao[pagador.id] = index === 0 ? qtdBase + resto : qtdBase;
      });
    }
    
    setQuantidadesDivisao(divisao);
  };

  const confirmarDivisaoItem = () => {
    if (!itemDividindo) return;
    
    const totalAtribuir = Object.values(quantidadesDivisao).reduce((a, b) => a + b, 0);
    const disponivel = getQuantidadeDisponivel(itemDividindo);
    
    if (totalAtribuir > disponivel) {
      alert(`Erro: Só há ${disponivel} disponível!`);
      return;
    }
    
    setQuantidadesDisponiveis(prev => ({
      ...prev,
      [itemDividindo]: disponivel - totalAtribuir
    }));
    
    Object.entries(quantidadesDivisao).forEach(([pagadorId, quantidade]) => {
      if (quantidade > 0) {
        atribuirItem(itemDividindo, pagadorId, quantidade);
      }
    });
    
    setItemDividindo(null);
    setQuantidadesDivisao({});
  };

  const dividirValorRestante = () => {
    const valorRestante = getValorRestante();
    if (valorRestante <= 0) {
      alert('Não há valor restante!');
      return;
    }
    
    const pagadoresNaoPagos = pagadores.filter(p => !p.pago);
    
    if (pagadoresNaoPagos.length === 0) {
      alert('Todos os pagadores já estão marcados como pagos!');
      return;
    }
    
    const valorPorPagador = valorRestante / pagadoresNaoPagos.length;
    
    setPagadores(prevPagadores => {
      return prevPagadores.map(pagador => {
        if (pagador.pago) {
          return pagador;
        }
        
        const itemVirtual: ItemPagador = {
          itemId: Date.now() + Math.random(),
          quantidade: 1,
          precoUnitario: valorPorPagador,
          descricao: 'Valor restante'
        };
        
        return {
          ...pagador,
          itens: [...pagador.itens, itemVirtual]
        };
      });
    });
    
    const novasQuantidades = { ...quantidadesDisponiveis };
    Object.keys(novasQuantidades).forEach(key => {
      novasQuantidades[parseInt(key)] = 0;
    });
    setQuantidadesDisponiveis(novasQuantidades);
  };

  const abrirModalDescontoAcrescimo = (pagadorId: string, tipo: 'desconto' | 'acrescimo') => {
    const pagador = pagadores.find(p => p.id === pagadorId);
    if (!pagador) return;
    
    setValorDescontoAcrescimo(
      tipo === 'desconto' ? pagador.desconto.toString() : pagador.acrescimo.toString()
    );
    setModalDescontoAcrescimo({
      aberto: true,
      pagadorId,
      tipo
    });
  };

  const aplicarDescontoAcrescimo = () => {
    const { pagadorId, tipo } = modalDescontoAcrescimo;
    if (!pagadorId) return;
    
    const valor = parseFloat(valorDescontoAcrescimo) || 0;
    
    setPagadores(pagadores.map(p => {
      if (p.id === pagadorId) {
        return {
          ...p,
          [tipo === 'desconto' ? 'desconto' : 'acrescimo']: valor
        };
      }
      return p;
    }));
    
    setModalDescontoAcrescimo({ aberto: false, pagadorId: null, tipo: 'desconto' });
    setValorDescontoAcrescimo('');
  };

  const atualizarNomePagador = (pagadorId: string) => {
    if (!novoNome.trim()) {
      setEditandoNome(null);
      return;
    }
    
    setPagadores(pagadores.map(p => 
      p.id === pagadorId ? { ...p, nome: novoNome.trim() } : p
    ));
    setEditandoNome(null);
    setNovoNome('');
  };

  const alternarStatusPagamento = (pagadorId: string) => {
    setPagadores(prevPagadores => {
      return prevPagadores.map(p => {
        if (p.id === pagadorId) {
          const novoStatus = !p.pago;
          
          if (novoStatus && !p.formaPagamento) {
            alert('É necessário definir uma forma de pagamento antes de marcar como pago!');
            return p;
          }
          
          return { 
            ...p, 
            pago: novoStatus,
            dataPagamento: novoStatus ? new Date().toISOString() : undefined,
            ...(novoStatus ? {} : { valorPago: 0, troco: 0 })
          };
        }
        return p;
      });
    });
  };

  const atualizarValorPago = (pagadorId: string, valor: string) => {
    const valorNumerico = parseFloat(valor) || 0;
    
    setPagadores(pagadores.map(p => {
      if (p.id === pagadorId) {
        const totalPagador = calcularTotalPagador(p);
        const troco = valorNumerico > totalPagador ? valorNumerico - totalPagador : 0;
        
        return {
          ...p,
          valorPago: valorNumerico,
          troco: troco
        };
      }
      return p;
    }));
  };

  const resetarDivisao = () => {
    setPagadores([
      { 
        id: '1', 
        nome: 'Cliente 1', 
        itens: [], 
        desconto: 0, 
        acrescimo: 0,
        formaPagamento: '',
        pago: false,
        valorPago: 0,
        troco: 0
      }
    ]);
    
    const inicial: Record<number, number> = {};
    itens.forEach(item => {
      inicial[item.id] = item.quantidade;
    });
    setQuantidadesDisponiveis(inicial);
    setItemDividindo(null);
    setQuantidadesDivisao({});
    setModoParcial(false);
  };

  const dividirIgualmente = () => {
    // Verifica se há pagadores ativos (não pagos)
    const pagadoresAtivos = pagadores.filter(p => !p.pago);
    
    if (pagadoresAtivos.length === 0) {
      alert('Todos os pagadores estão marcados como pagos! Desmarque algum para dividir igualmente.');
      return;
    }
    
    // Cria uma cópia dos pagadores mantendo TODOS
    const novosPagadores: Pagador[] = pagadores.map(pagador => ({
      ...pagador,
      itens: [] // Limpa os itens de TODOS os pagadores
    }));
    
    // Resetar quantidades disponíveis para as quantidades originais
    const novasQuantidades: Record<number, number> = {};
    itens.forEach(item => {
      novasQuantidades[item.id] = item.quantidade;
    });
    
    // Distribui os itens igualmente apenas entre pagadores não pagos
    itens.forEach(item => {
      const quantidadeTotal = item.quantidade;
      const quantidadePorPagador = Math.floor(quantidadeTotal / pagadoresAtivos.length);
      const resto = quantidadeTotal % pagadoresAtivos.length;
      
      // Atribui aos pagadores ativos
      pagadoresAtivos.forEach((pagador, index) => {
        const quantidade = index === 0 ? quantidadePorPagador + resto : quantidadePorPagador;
        if (quantidade > 0) {
          // Encontra o índice deste pagador na lista
          const pagadorIndex = novosPagadores.findIndex(p => p.id === pagador.id);
          if (pagadorIndex !== -1) {
            const itemPagador: ItemPagador = {
              itemId: item.id,
              quantidade,
              precoUnitario: item.precoUnitario,
              descricao: item.produto.nome
            };
            
            // CORREÇÃO: Especifica o tipo do array itens
            const itensAtuais: ItemPagador[] = novosPagadores[pagadorIndex].itens || [];
            
            // Adiciona o item ao pagador
            novosPagadores[pagadorIndex] = {
              ...novosPagadores[pagadorIndex],
              itens: [...itensAtuais, itemPagador]
            };
          }
        }
      });
      
      // Marca como totalmente atribuído
      novasQuantidades[item.id] = 0;
    });
    
    // Atualiza os estados
    setPagadores(novosPagadores);
    setQuantidadesDisponiveis(novasQuantidades);
    
    alert(`Itens divididos igualmente entre ${pagadoresAtivos.length} pagador(es)!`);
  };

  const getTextoBotaoDividir = () => {
    const valorAtribuido = getValorAtribuido();
    
    if (valorAtribuido === 0) {
      return '💰 Dividir valor total';
    } else if (valorAtribuido < total) {
      return `💰 Dividir restante (R$ ${getValorRestante().toFixed(2)})`;
    } else {
      return '✅ Tudo atribuído';
    }
  };

  const calcularTotalGeral = (): number => {
    return pagadores.reduce((sum, pagador) => sum + calcularTotalPagador(pagador), 0);
  };

  const validarPagamento = (): boolean => {
    const valorAtribuido = getValorAtribuido();
    const diferenca = Math.abs(valorAtribuido - total);
    
    if (diferenca > 0.01) {
      alert(`Atenção: Valor atribuído (R$ ${valorAtribuido.toFixed(2)}) não corresponde ao total (R$ ${total.toFixed(2)})`);
      return false;
    }
    
    const pagadoresNaoPagos = pagadores.filter(p => !p.pago);
    const semFormaPagamento = pagadoresNaoPagos.filter(p => !p.formaPagamento);
    
    if (semFormaPagamento.length > 0) {
      alert(`Atenção: ${semFormaPagamento.length} pagador(es) sem forma de pagamento definida`);
      return false;
    }
    
    const pagadoresDinheiro = pagadoresNaoPagos.filter(p => {
      const forma = formasPagamento.find(f => f.id === p.formaPagamento);
      return forma?.aceitaTroco && p.pago === false;
    });
    
    for (const pagador of pagadoresDinheiro) {
      const totalPagador = calcularTotalPagador(pagador);
      if (pagador.valorPago && pagador.valorPago < totalPagador) {
        alert(`Atenção: ${pagador.nome} está pagando R$ ${pagador.valorPago?.toFixed(2)} mas deve R$ ${totalPagador.toFixed(2)}`);
        return false;
      }
    }
    
    return true;
  };

  const handleSalvarProgresso = () => {
    if (onSalvarParcial) {
      const data = {
        mesa: mesa.numero,
        pagadores: pagadores.map(p => ({
          ...p,
          total: calcularTotalPagador(p),
          troco: calcularTroco(p)
        })),
        total: calcularTotalGeral(),
        itens,
        formasPagamentoUtilizadas: formasPagamento.filter(fp => 
          pagadores.some(p => p.formaPagamento === fp.id)
        ),
        timestamp: new Date().toISOString(),
        status: 'parcial'
      };
      onSalvarParcial(data);
      alert('Progresso salvo com sucesso!');
    }
  };

  const salvarParcialLocal = () => {
    try {
      const dadosParaSalvar = {
        pagadores,
        quantidadesDisponiveis,
        mesa,
        itens,
        total,
        timestamp: new Date().toISOString()
      };
      
      if (comandaId) {
        localStorage.setItem(`pagamento_parcial_${comandaId}`, JSON.stringify(dadosParaSalvar));
      }
      
      return dadosParaSalvar;
    } catch (error) {
      console.error('Erro ao salvar pagamento parcial:', error);
      return null;
    }
  };

  const validarPagamentoParcial = (): boolean => {
    const pagadoresPagos = pagadores.filter(p => p.pago);
    
    if (pagadoresPagos.length === 0) {
      alert('Selecione pelo menos um pagador como pago para salvar parcialmente.');
      return false;
    }
    
    const pagadoresPagosSemForma = pagadoresPagos.filter(p => !p.formaPagamento);
    if (pagadoresPagosSemForma.length > 0) {
      alert(`Atenção: ${pagadoresPagosSemForma.length} pagador(es) pagos sem forma de pagamento definida`);
      return false;
    }
    
    const pagadoresDinheiroPagos = pagadoresPagos.filter(p => {
      const forma = formasPagamento.find(f => f.id === p.formaPagamento);
      return forma?.aceitaTroco;
    });
    
    for (const pagador of pagadoresDinheiroPagos) {
      const totalPagador = calcularTotalPagador(pagador);
      if (pagador.valorPago && pagador.valorPago < totalPagador) {
        alert(`Atenção: ${pagador.nome} está pagando R$ ${pagador.valorPago?.toFixed(2)} mas deve R$ ${totalPagador.toFixed(2)}`);
        return false;
      }
    }
    
    return true;
  };

  const handleSalvarContinuarComanda = async () => {
    if (!validarPagamentoParcial()) return;
    
    setCarregando(true);
    
    try {
      const pagadoresPagos = pagadores.filter(p => p.pago);
      
      // Dados para salvar
      const dadosParaSalvar = {
        pagadores,
        quantidadesDisponiveis,
        mesa,
        itens,
        total,
        pagadoresPagos: pagadoresPagos.map(p => ({
          ...p,
          total: calcularTotalPagador(p),
          troco: calcularTroco(p)
        })),
        pagadoresNaoPagos: pagadores.filter(p => !p.pago).map(p => ({
          ...p,
          total: calcularTotalPagador(p)
        })),
        totalPago: getValorJaPago(),
        totalFaltaPagar: getValorFaltaPagar(),
        formasPagamentoUtilizadas: formasPagamento.filter(fp => 
          pagadoresPagos.some(p => p.formaPagamento === fp.id)
        ),
        timestamp: new Date().toISOString(),
        status: 'parcial'
      };
      
      // SALVAR LOCALMENTE (sempre fazemos isso)
      if (comandaId) {
        localStorage.setItem(`pagamento_parcial_${comandaId}`, JSON.stringify(dadosParaSalvar));
      }
      
      // TENTAR SALVAR NO MONGODB SE A FUNÇÃO EXISTIR
      if (onAtualizarComanda && comandaId) {
        try {
          await onAtualizarComanda(comandaId, {
            status: 'parcial',
            pagamentosParciais: dadosParaSalvar,
            totalPago: getValorJaPago(),
            totalRestante: getValorFaltaPagar(),
            atualizadoEm: new Date().toISOString()
          });
          
          setModoParcial(true);
          alert(`✅ Pagamento parcial salvo com sucesso!\n\n${pagadoresPagos.length} cliente(s) pagaram.\nR$ ${getValorJaPago().toFixed(2)} já pagos.\nR$ ${getValorFaltaPagar().toFixed(2)} faltam pagar.`);
          
          // Fecha o modal após salvar
          onClose();
        } catch (error) {
          console.error('Erro ao salvar no MongoDB:', error);
          // Mesmo se falhar no MongoDB, salvamos localmente
          alert('✅ Pagamento salvo localmente! (Erro ao conectar com o servidor)');
          setModoParcial(true);
          onClose();
        }
      } else {
        // Se não tem função MongoDB, apenas salva localmente
        setModoParcial(true);
        alert('✅ Pagamento salvo localmente! (MongoDB não configurado)');
        onClose();
      }
    } catch (error) {
      console.error('Erro ao salvar pagamento parcial:', error);
      alert('❌ Erro ao salvar pagamento. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const handleFinalizarPagamento = () => {
    if (!validarPagamento()) return;
    
    const data = {
      comandaId: comandaId || `comanda_${Date.now()}`,
      mesa: mesa.numero,
      mesaId: mesaId,
      pagadores: pagadores.map(p => ({
        ...p,
        total: calcularTotalPagador(p),
        troco: calcularTroco(p)
      })),
      total: calcularTotalGeral(),
      itens,
      formasPagamentoUtilizadas: formasPagamento.filter(fp => 
        pagadores.some(p => p.formaPagamento === fp.id)
      ),
      timestamp: new Date().toISOString(),
      status: 'finalizado'
    };
    onConfirmar(data);
  };

  const getQuantidadeAtribuida = (itemId: number, pagadorId: string): number => {
    const pagador = pagadores.find(p => p.id === pagadorId);
    if (!pagador) return 0;
    
    const item = pagador.itens.find(i => i.itemId === itemId);
    return item ? item.quantidade : 0;
  };

  const formaPagamentoAceitaTroco = (formaPagamentoId: string): boolean => {
    const forma = formasPagamento.find(f => f.id === formaPagamentoId);
    return forma?.aceitaTroco || false;
  };

  const limparPagamentoParcial = () => {
    if (comandaId && window.confirm('Deseja limpar o pagamento parcial salvo anteriormente?')) {
      localStorage.removeItem(`pagamento_parcial_${comandaId}`);
      resetarDivisao();
      alert('Pagamento parcial anterior foi limpo!');
    }
  };

  // ========== RENDER ==========
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-7xl h-[85vh] flex flex-col">
        {/* HEADER */}
        <div className="px-6 py-3 border-b">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold">Divisão de Conta - {mesa.nome}</h2>
                {modoParcial && (
                  <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-medium">
                    PAGAMENTO PARCIAL
                  </span>
                )}
                {carregando && (
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                    Salvando...
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-3 mt-2 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-bold">R$ {total.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-600">Atribuído:</span>
                  <span className="font-bold text-green-600">
                    R$ {getValorAtribuido().toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-600">Restante:</span>
                  <span className="font-bold text-blue-600">
                    R$ {getValorRestante().toFixed(2)}
                  </span>
                </div>
                {modoParcial && (
                  <>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600">Já pago:</span>
                      <span className="font-bold text-green-600">
                        R$ {getValorJaPago().toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-600">Falta:</span>
                      <span className="font-bold text-orange-600">
                        R$ {getValorFaltaPagar().toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {modoParcial && (
                <button 
                  onClick={limparPagamentoParcial}
                  className="px-2 py-1 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50"
                  title="Limpar pagamento parcial"
                >
                  Limpar
                </button>
              )}
              <button 
                onClick={resetarDivisao}
                className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                title="Resetar toda a divisão"
              >
                Resetar
              </button>
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-xl"
                title="Fechar"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* CONTEÚDO - 3 COLUNAS */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* COLUNA 1: ITENS */}
          <div className="w-1/3 border-r p-3 overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-base">Itens da Comanda</h3>
              <div className="flex gap-2">
                <button
                  onClick={dividirIgualmente}
                  className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                  title="Dividir todos os itens igualmente"
                >
                  Dividir Igual
                </button>
                <button
                  onClick={dividirValorRestante}
                  className={`px-2 py-1 text-xs rounded font-medium ${
                    getValorRestante() > 0
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                  disabled={getValorRestante() <= 0}
                  title="Dividir valor restante entre todos"
                >
                  {getValorRestante() > 0 ? `Restante: R$ ${getValorRestante().toFixed(2)}` : '✅ Tudo atribuído'}
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              {itens.map((item) => {
                const disponivel = getQuantidadeDisponivel(item.id);
                const usado = item.quantidade - disponivel;
                const porcentagem = (usado / item.quantidade) * 100;
                
                return (
                  <div
                    key={item.id}
                    className={`border rounded-lg p-2 text-sm ${
                      itemDividindo === item.id 
                        ? 'ring-1 ring-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    } ${disponivel === 0 ? 'opacity-60' : 'cursor-pointer'}`}
                    onClick={() => disponivel > 0 && iniciarDivisaoItem(item.id)}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.produto.nome}</div>
                        <div className="text-xs text-gray-600">
                          {item.quantidade}x • R$ {item.precoUnitario.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right ml-2">
                        <div className="font-bold whitespace-nowrap">
                          R$ {(item.precoUnitario * item.quantidade).toFixed(2)}
                        </div>
                        <div className={`text-xs ${disponivel > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                          {disponivel}x disp.
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-1">
                      <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500"
                          style={{ width: `${porcentagem}%` }}
                        />
                      </div>
                      
                      <div className="mt-0.5 text-xs text-gray-500 truncate">
                        {pagadores.map(p => {
                          const qtd = getQuantidadeAtribuida(item.id, p.id);
                          return qtd > 0 ? `${p.nome}: ${qtd}x` : null;
                        }).filter(Boolean).join(', ')}
                      </div>
                    </div>
                    
                    {itemDividindo === item.id && (
                      <div className="mt-2 p-2 bg-gray-50 rounded border text-xs" onClick={e => e.stopPropagation()}>
                        <div className="font-medium mb-1">
                          Dividir {disponivel}x entre:
                        </div>
                        {pagadores.map((pagador) => {
                          const pagadoresNaoPagos = pagadores.filter(p => !p.pago);
                          const mostrarPagador = pagadoresNaoPagos.length > 0 
                            ? !pagador.pago 
                            : true;
                          
                          if (!mostrarPagador) return null;
                          
                          return (
                            <div key={pagador.id} className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1">
                                <span className="truncate max-w-[80px]">{pagador.nome}</span>
                                {pagador.pago && (
                                  <span className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded">
                                    Pago
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-0.5">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const atual = quantidadesDivisao[pagador.id] || 0;
                                    if (atual > 0) {
                                      setQuantidadesDivisao(prev => ({
                                        ...prev,
                                        [pagador.id]: atual - 1
                                      }));
                                    }
                                  }}
                                  className="w-5 h-5 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                                  disabled={pagador.pago}
                                >
                                  -
                                </button>
                                <span className="w-6 text-center text-xs">
                                  {quantidadesDivisao[pagador.id] || 0}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const atual = quantidadesDivisao[pagador.id] || 0;
                                    const totalAtribuindo = Object.values(quantidadesDivisao)
                                      .reduce((a, b) => a + b, 0);
                                    
                                    if (atual < disponivel && totalAtribuindo < disponivel) {
                                      setQuantidadesDivisao(prev => ({
                                        ...prev,
                                        [pagador.id]: atual + 1
                                      }));
                                    }
                                  }}
                                  className="w-5 h-5 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                                  disabled={pagador.pago}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        
                        <div className="flex gap-1 mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setItemDividindo(null);
                            }}
                            className="flex-1 py-1 text-xs border rounded hover:bg-gray-100"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmarDivisaoItem();
                            }}
                            className="flex-1 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            Confirmar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* COLUNA 2: PAGADORES */}
          <div className="w-1/3 border-r p-3 overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-base">Pagadores</h3>
              <button
                onClick={adicionarPagador}
                className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
              >
                + Adicionar
              </button>
            </div>
            
            <div className="space-y-3">
              {pagadores.map((pagador) => {
                const totalPagador = calcularTotalPagador(pagador);
                const troco = calcularTroco(pagador);
                const formaPagamento = formasPagamento.find(f => f.id === pagador.formaPagamento);
                const precisaTroco = formaPagamento?.aceitaTroco || false;
                
                return (
                  <div key={pagador.id} className={`border rounded-lg p-3 text-sm ${pagador.pago ? 'bg-green-50 border-green-200' : ''}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        {editandoNome === pagador.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={novoNome}
                              onChange={(e) => setNovoNome(e.target.value)}
                              className="border-b px-1 py-0.5 text-xs w-28"
                              placeholder="Nome"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') atualizarNomePagador(pagador.id);
                                if (e.key === 'Escape') {
                                  setEditandoNome(null);
                                  setNovoNome('');
                                }
                              }}
                            />
                            <button
                              onClick={() => atualizarNomePagador(pagador.id)}
                              className="text-xs text-green-600 hover:text-green-800"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => {
                                setEditandoNome(null);
                                setNovoNome('');
                              }}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <h4 className="font-bold truncate">{pagador.nome}</h4>
                            <button
                              onClick={() => {
                                setEditandoNome(pagador.id);
                                setNovoNome(pagador.nome);
                              }}
                              className="text-xs text-gray-500 hover:text-gray-700"
                              title="Editar nome"
                            >
                              ✏️
                            </button>
                            {pagador.pago && pagador.dataPagamento && (
                              <span className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded" title={`Pago às ${new Date(pagador.dataPagamento).toLocaleTimeString()}`}>
                                ✓
                              </span>
                            )}
                          </div>
                        )}
                        <div className="text-xs text-gray-600">
                          {pagador.itens.length} itens • R$ {totalPagador.toFixed(2)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${pagador.pago ? 'text-green-600' : 'text-gray-700'}`}>
                          R$ {totalPagador.toFixed(2)}
                        </div>
                        <div className="text-xs space-x-1">
                          {pagador.desconto > 0 && (
                            <span className="text-red-600" title="Desconto">
                              -{pagador.desconto.toFixed(2)}
                            </span>
                          )}
                          {pagador.acrescimo > 0 && (
                            <span className="text-orange-600" title="Acréscimo">
                              +{pagador.acrescimo.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {!pagador.pago && (
                      <div className="grid grid-cols-2 gap-1 mb-2">
                        <button
                          onClick={() => abrirModalDescontoAcrescimo(pagador.id, 'desconto')}
                          className="py-1 text-xs border border-red-200 bg-red-50 text-red-600 rounded hover:bg-red-100"
                        >
                          Desconto
                        </button>
                        <button
                          onClick={() => abrirModalDescontoAcrescimo(pagador.id, 'acrescimo')}
                          className="py-1 text-xs border border-orange-200 bg-orange-50 text-orange-600 rounded hover:bg-orange-100"
                        >
                          Acréscimo
                        </button>
                      </div>
                    )}
                    
                    {pagador.itens.length > 0 && (
                      <div className="space-y-1 mb-2 max-h-20 overflow-y-auto text-xs">
                        {pagador.itens.map((item, idx) => {
                          const itemOriginal = itens.find(i => i.id === item.itemId);
                          const nome = item.descricao || itemOriginal?.produto.nome || 'Item';
                          
                          return (
                            <div key={idx} className="flex justify-between">
                              <span className="truncate flex-1">
                                {item.quantidade}x {nome}
                              </span>
                              <span className="whitespace-nowrap ml-2">
                                R$ {(item.precoUnitario * item.quantidade).toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    <select
                      className={`w-full border rounded p-1.5 text-xs mb-1 hover:border-gray-400 ${
                        pagador.pago ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                      value={pagador.formaPagamento}
                      onChange={(e) => {
                        const novaForma = e.target.value;
                        setPagadores(
                          pagadores.map(p => 
                            p.id === pagador.id 
                              ? { 
                                  ...p, 
                                  formaPagamento: novaForma,
                                  valorPago: 0,
                                  troco: 0
                                }
                              : p
                          )
                        );
                      }}
                      disabled={pagador.pago}
                    >
                      <option value="">Forma de pagamento...</option>
                      {formasPagamento.map((forma) => (
                        <option key={forma.id} value={forma.id}>
                          {forma.nome} {forma.taxa > 0 ? `(${forma.taxa}%)` : ''}
                        </option>
                      ))}
                    </select>
                    
                    {precisaTroco && !pagador.pago && (
                      <div className="mb-2">
                        <div className="flex items-center gap-1 mb-0.5">
                          <label className="text-xs text-gray-700">
                            Valor pago:
                          </label>
                          <div className="flex-1 flex items-center">
                            <span className="text-xs text-gray-500 mr-1">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              className="flex-1 border rounded p-1 text-xs w-full"
                              value={pagador.valorPago || ''}
                              onChange={(e) => atualizarValorPago(pagador.id, e.target.value)}
                              placeholder="0,00"
                            />
                          </div>
                        </div>
                        
                        {troco > 0 && (
                          <div className="p-1 bg-yellow-50 border border-yellow-200 rounded text-xs">
                            <div className="flex justify-between">
                              <span className="text-yellow-800">Troco:</span>
                              <span className="font-bold text-yellow-900">R$ {troco.toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex gap-1">
                      <button
                        onClick={() => alternarStatusPagamento(pagador.id)}
                        className={`flex-1 py-1 text-xs rounded ${
                          pagador.pago
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {pagador.pago ? 'Não Pago' : 'Marcar Pago'}
                      </button>
                      
                      {pagadores.length > 1 && !pagador.pago && (
                        <button
                          onClick={() => removerPagador(pagador.id)}
                          className="px-2 py-1 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* COLUNA 3: CONTROLES */}
          <div className="w-1/3 p-3">
            <h3 className="font-bold text-base mb-3">Controles</h3>
            
            {/* Resumo compacto */}
            <div className="border rounded-lg p-3 mb-4">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <div className="text-xs text-gray-600 mb-0.5">Total original</div>
                  <div className="font-bold">R$ {total.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-0.5">Total a pagar</div>
                  <div className="font-bold text-green-600">R$ {calcularTotalGeral().toFixed(2)}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <div className="text-xs text-gray-600 mb-0.5">Descontos</div>
                  <div className="text-red-600 font-medium">
                    -R$ {pagadores.reduce((sum, p) => sum + p.desconto, 0).toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-0.5">Acréscimos</div>
                  <div className="text-orange-600 font-medium">
                    +R$ {pagadores.reduce((sum, p) => sum + p.acrescimo, 0).toFixed(2)}
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-600">Pagamentos:</span>
                  <span className="text-xs font-medium">
                    {pagadores.filter(p => p.pago).length}/{pagadores.length}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-green-500"
                    style={{ 
                      width: `${(pagadores.filter(p => p.pago).length / pagadores.length) * 100}%` 
                    }}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-green-50 p-2 rounded">
                    <div className="text-xs text-green-800 mb-0.5">Já pago</div>
                    <div className="font-bold text-green-700 text-sm">R$ {getValorJaPago().toFixed(2)}</div>
                  </div>
                  <div className="bg-orange-50 p-2 rounded">
                    <div className="text-xs text-orange-800 mb-0.5">Falta pagar</div>
                    <div className="font-bold text-orange-700 text-sm">R$ {getValorFaltaPagar().toFixed(2)}</div>
                  </div>
                </div>
                
                {pagadores.some(p => p.formaPagamento) && (
                  <div>
                    <div className="text-xs font-medium mb-1">Formas utilizadas:</div>
                    <div className="flex flex-wrap gap-1">
                      {formasPagamento
                        .filter(forma => pagadores.some(p => p.formaPagamento === forma.id))
                        .map(forma => {
                          const pagadoresComEstaForma = pagadores.filter(p => p.formaPagamento === forma.id);
                          const totalEstaForma = pagadoresComEstaForma.reduce((sum, p) => sum + calcularTotalPagador(p), 0);
                          
                          return (
                            <div key={forma.id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                              <span className="font-medium">{forma.nome}:</span>
                              <span className="ml-1">R$ {totalEstaForma.toFixed(2)}</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Botões de ação */}
            <div className="space-y-2">
              <button
                onClick={handleSalvarContinuarComanda}
                disabled={carregando}
                className={`w-full py-2.5 rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                  onAtualizarComanda 
                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                    : 'bg-yellow-500 text-white hover:bg-yellow-600'
                }`}
              >
                {carregando ? (
                  <>⏳ Salvando...</>
                ) : onAtualizarComanda ? (
                  <>💳 Salvar Parcial & Continuar</>
                ) : (
                  <>💾 Salvar Localmente & Continuar</>
                )}
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                {onSalvarParcial && (
                  <button
                    onClick={handleSalvarProgresso}
                    className="py-2 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 text-sm"
                  >
                    Salvar Progresso
                  </button>
                )}
                
                <button
                  onClick={() => alert('Comanda enviada para impressão!')}
                  className="py-2 border border-purple-500 text-purple-600 rounded-lg hover:bg-purple-50 text-sm"
                >
                  📄 Imprimir
                </button>
              </div>
              
              <button
                onClick={handleFinalizarPagamento}
                className="w-full py-2.5 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                disabled={pagadores.filter(p => !p.pago).some(p => !p.formaPagamento) || carregando}
              >
                ✅ Finalizar Pagamento Total
              </button>
              
              <button
                onClick={onClose}
                disabled={carregando}
                className="w-full py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-50"
              >
                Voltar
              </button>
            </div>
            
            {/* Aviso informativo */}
            {!onAtualizarComanda && (
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-xs text-yellow-800">
                  <div className="font-medium">⚠️ Modo Local</div>
                  <p className="mt-0.5">Os pagamentos serão salvos apenas neste dispositivo.</p>
                  <p className="mt-0.5 text-xs">Para salvar no servidor, configure a conexão com o MongoDB.</p>
                </div>
              </div>
            )}
            
            {modoParcial && (
              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-xs text-green-800">
                  <div className="font-medium">📝 Pagamento Parcial Ativo</div>
                  <p className="mt-0.5">Alguns clientes já pagaram. Comanda continua aberta.</p>
                  {comandaId && (
                    <p className="mt-0.5 text-xs">Comanda ID: {comandaId}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE DESCONTO/ACRÉSCIMO */}
      {modalDescontoAcrescimo.aberto && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-xl p-5 w-80">
            <h3 className="font-bold text-base mb-3">
              Aplicar {modalDescontoAcrescimo.tipo === 'desconto' ? 'Desconto' : 'Acréscimo'}
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs mb-1">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full border rounded-lg p-2 text-sm"
                  value={valorDescontoAcrescimo}
                  onChange={(e) => setValorDescontoAcrescimo(e.target.value)}
                  placeholder="0,00"
                  autoFocus
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setModalDescontoAcrescimo({ aberto: false, pagadorId: null, tipo: 'desconto' });
                    setValorDescontoAcrescimo('');
                  }}
                  className="flex-1 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={aplicarDescontoAcrescimo}
                  className={`flex-1 py-2 text-white rounded-lg text-sm ${
                    modalDescontoAcrescimo.tipo === 'desconto' 
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-orange-500 hover:bg-orange-600'
                  }`}
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}