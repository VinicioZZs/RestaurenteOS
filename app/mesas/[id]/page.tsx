// app/mesas/[id]/page.tsx - VERSÃO COMPLETA CORRIGIDA
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ComandaEsquerda from '@/components/comanda/ComandaEsquerda';
import CatalogoDireita from '@/components/comanda/CatalogoDireita';
import ComandaLayout from '@/components/comanda/ComandaLayout';
import PagamentoModal from '@/components/pagamento/PagamentoModal';
import ModalAdicionais from '@/components/comanda/ModalAdicionais';
import ModalConfirmacaoFechar from '@/components/comanda/ModalConfirmacaoFechar';
import ModalItensNaoSalvos from '@/components/comanda/ModalItensNaoSalvos';

interface Produto {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  imagem: string;
}

interface ItemComanda {
  id: number;
  produtoId: string;
  quantidade: number;
  precoUnitario: number;
  produto: any;
  observacao: string;
  isNew?: boolean;
  produtoNome?: string;
  produtoCategoria?: string;
}

interface ComandaDB {
  _id: string;
  mesaId: string;
  numeroMesa: string;
  itens: any[];
  total: number;
  status: string;
}

// ========== FUNÇÕES AUXILIARES ==========

async function fetchComanda(mesaIdOuNumero: string): Promise<ComandaDB | null> {
  try {
    const mesaResponse = await fetch(`/api/mesas/buscar?termo=${encodeURIComponent(mesaIdOuNumero)}`);
    
    if (mesaResponse.ok) {
      const mesaData = await mesaResponse.json();
      
      if (mesaData.success && mesaData.data) {
        const mesa = mesaData.data;
        const mesaIdReal = mesa._id;
        
        const comandaResponse = await fetch(`/api/comandas?mesaId=${mesaIdReal}`);
        
        if (comandaResponse.ok) {
          const comandaData = await comandaResponse.json();
          
          if (comandaData.success && comandaData.data) {
            return comandaData.data;
          }
        }
      }
    }
    
    const response = await fetch(`/api/comandas?mesaId=${mesaIdOuNumero}`);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.success && data.data) {
        return data.data;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar comanda:', error);
    return null;
  }
}

async function salvarComandaNoDB(mesaId: string, numeroMesa: string, itens: ItemComanda[], total: number) {
  console.log('📤 Enviando para API /api/comandas:', {
    mesaId,
    numeroMesa,
    totalItens: itens.length,
    totalValor: total
  });
  
  try {
    const itensParaSalvar = itens.map(item => ({
      produtoId: item.produtoId,
      quantidade: item.quantidade,
      precoUnitario: item.precoUnitario,
      observacao: item.observacao,
      nome: item.produto?.nome || 'Produto',
      categoria: item.produto?.categoria || 'Geral'
    }));
    
    const numeroMesaParaEnviar = numeroMesa || mesaId;
    
    const response = await fetch('/api/comandas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mesaId: numeroMesaParaEnviar,
        numeroMesa: numeroMesaParaEnviar,
        itens: itensParaSalvar,
        total,
      }),
    });
    
    const responseText = await response.text();
    console.log('📄 Resposta da API:', responseText.substring(0, 500));
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Erro ao parsear JSON:', parseError);
      return { 
        success: false, 
        error: new Error(`Resposta não é JSON válido: ${responseText.substring(0, 100)}...`) 
      };
    }
    
    if (!response.ok) {
      if (response.status === 409) {
        return {
          success: false,
          error: new Error('Já existe uma comanda aberta para esta mesa'),
          data: data.data
        };
      }
      
      return {
        success: false,
        error: new Error(data.error || `Erro HTTP ${response.status}: ${response.statusText}`),
        data: null
      };
    }
    
    return {
      success: true,
      data: data.data || data,
      message: data.message || 'Comanda salva com sucesso'
    };
    
  } catch (error) {
    console.error('❌ Erro completo ao salvar comanda:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Erro desconhecido'),
      data: null
    };
  }
}

async function fetchProdutosReais(): Promise<Produto[]> {
  try {
    const response = await fetch('/api/produtos?ativos=true');
    if (!response.ok) {
      console.warn('⚠️ Erro ao buscar produtos da API, usando fallback');
      return [];
    }
    
    const data = await response.json();
    
    if (data.success && data.data && Array.isArray(data.data)) {
      return data.data.map((produto: any) => ({
        id: produto._id?.toString() || Math.random().toString(),
        nome: produto.nome || 'Produto sem nome',
        preco: produto.precoVenda || produto.preco || 0,
        categoria: produto.categoria?.nome || produto.categoria || 'Sem Categoria',
        imagem: produto.imagem || '/placeholder-product.jpg'
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return [];
  }
}

async function fetchCategoriasReais() {
  try {
    const response = await fetch('/api/categorias?ativas=true');
    if (!response.ok) throw new Error('Erro ao buscar categorias');
    
    const data = await response.json();
    
    if (data.success && data.data) {
      return data.data.map((categoria: any) => ({
        id: categoria._id.toString(),
        nome: categoria.nome,
        descricao: categoria.descricao || '',
        icone: categoria.icone || '📦',
        imagem: categoria.imagem,
        usaImagem: categoria.usaImagem || false,
        ordem: categoria.ordem || 999
      }));
    }
    return [];
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return [
      { id: 'todos', nome: 'Todos', icone: '📦', usaImagem: false },
      { id: 'bebidas', nome: 'Bebidas', icone: '🥤', usaImagem: false },
      { id: 'lanches', nome: 'Lanches', icone: '🍔', usaImagem: false },
      { id: 'acompanhamentos', nome: 'Acompanhamentos', icone: '🍟', usaImagem: false },
    ];
  }
}

// ========== COMPONENTE PRINCIPAL ==========

export default function ComandaPage() {
  const params = useParams();
  const router = useRouter();
  const mesaId = params.id as string;
  
  // ========== ESTADOS ==========
  
  const [mesa, setMesa] = useState<any>(null);
  const [itensSalvos, setItensSalvos] = useState<ItemComanda[]>([]);
  const [itensNaoSalvos, setItensNaoSalvos] = useState<ItemComanda[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [totalPago, setTotalPago] = useState(0);
  const [categoriaAtiva, setCategoriaAtiva] = useState('todos');
  const [busca, setBusca] = useState('');
  const [modificado, setModificado] = useState(false);
  const [comandaId, setComandaId] = useState<string>('');
  const [produtosReais, setProdutosReais] = useState<Produto[]>([]);
  const [categoriasReais, setCategoriasReais] = useState([{ id: 'todos', nome: 'Todos', icone: '📦' }]);
  const [mostrarModalPagamento, setMostrarModalPagamento] = useState(false);
  const [mostrarModalAdicionais, setMostrarModalAdicionais] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [produtoIdSelecionado, setProdutoIdSelecionado] = useState<string>('');
  const [configSistema, setConfigSistema] = useState<any>(null);
  const [itemEditando, setItemEditando] = useState<any>(null);
  const [mostrarModalConfirmacaoFechar, setMostrarModalConfirmacaoFechar] = useState(false);
  const [mostrarModalItensNaoSalvos, setMostrarModalItensNaoSalvos] = useState(false);
  const [salvandoParaFechar, setSalvandoParaFechar] = useState(false);

  const carregarDadosDaComanda = async () => {
  try {
    // Usando mesaId (que é o params.id no seu código)
    const response = await fetch(`/api/comandas?mesaId=${mesaId}`);
    const resJson = await response.json();

    if (resJson.success && resJson.data) {
      console.log("✅ Itens carregados do banco:", resJson.data.itens);
      
      // Aqui está o segredo: colocar os itens do banco nos seus estados da tela
      // No seu código os estados chamam itensSalvos e itensNaoSalvos
      setItensSalvos(resJson.data.itens || []);
      setItensNaoSalvos([]); // Novos itens começam vazios
      
      if (resJson.data._id) {
        setComandaId(resJson.data._id);
      }
    }
  } catch (error) {
    console.error("❌ Erro ao buscar dados da mesa:", error);
  }
};

  // ========== USEFFECTS ==========

  useEffect(() => {
  if (mesaId) {
    carregarDadosDaComanda();
  }
}, [mesaId]);
  
  useEffect(() => {
    const verificarComandaExistente = async () => {
      if (!mesaId || carregando) return;
      
      try {
        const response = await fetch(`/api/comandas?mesaId=${mesaId}`);
        const data = await response.json();
        
        if (data.success && data.data) {
          setComandaId(data.data._id);
          setItensSalvos(data.data.itens || []);
          console.log('✅ Usando comanda existente:', data.data._id);
        }
      } catch (error) {
        console.error('Erro ao verificar comanda:', error);
      }
    };
    
    verificarComandaExistente();
  }, [mesaId, carregando]);

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
    async function carregarComanda() {
      setCarregando(true);
      
      try {
        const produtosDB = await fetchProdutosReais();
        setProdutosReais(produtosDB);
        
        const categoriasDB = await fetchCategoriasReais();
        if (!categoriasDB.some((cat: any) => cat.id === 'todos')) {
          categoriasDB.unshift({ id: 'todos', nome: 'Todos', icone: '📦' });
        }
        setCategoriasReais(categoriasDB);
        
        const response = await fetch(`/api/mesas/buscar-mesa?numero=${mesaId}`);
        let mesaReal = null;
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            mesaReal = data.data;
          }
        }
        
        const mesa = mesaReal || {
          id: mesaId,
          _id: mesaId,
          numero: mesaId.padStart(2, '0'),
          nome: `Mesa ${mesaId.padStart(2, '0')}`,
          status: 'ocupada',
          capacidade: 4,
        };
        
        setMesa(mesa);
        
        const mesaIdParaBuscar = mesa._id || mesa.id || mesaId;
        const comandaDB = await fetchComanda(mesaIdParaBuscar);
        
        if (comandaDB) {
          setComandaId(comandaDB._id);
          
          const itensComProdutos = comandaDB.itens.map((item: any) => {
            let produtoEncontrado = produtosDB.find(p => p.id === item.produtoId);
            
            if (!produtoEncontrado) {
              produtoEncontrado = {
                id: item.produtoId,
                nome: item.nome || item.produtoNome || `Produto ${item.produtoId}`,
                preco: item.precoUnitario || 0,
                categoria: item.categoria || item.produtoCategoria || 'Sem categoria',
                imagem: '/placeholder-product.jpg'
              };
            }
            
            return {
              id: Date.now() + Math.random(),
              produtoId: item.produtoId,
              quantidade: item.quantidade,
              precoUnitario: item.precoUnitario,
              observacao: item.observacao || '',
              produto: produtoEncontrado
            };
          });
          
          setItensSalvos(itensComProdutos);
        }
        
      } catch (error) {
        console.error('Erro ao carregar:', error);
      } finally {
        setCarregando(false);
      }
    }
    
    carregarComanda();
  }, [mesaId]);

  useEffect(() => {
    const verificarStatusMesa = async () => {
      if (!mesaId || !mesa?._id) return;
      
      try {
        const response = await fetch(`/api/comandas?mesaId=${mesa._id}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success && data.data && data.data.status === 'fechada') {
            setTimeout(() => {
              if (confirm('Esta comanda foi fechada. Deseja voltar ao dashboard?')) {
                router.push('/dashboard');
              }
            }, 500);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar status da mesa:', error);
      }
    };
    
    const interval = setInterval(verificarStatusMesa, 15000);
    return () => clearInterval(interval);
  }, [mesaId, mesa?._id, router]);

  // Debug dos estados
  useEffect(() => {
    console.log('📊 DEBUG - Estados atuais:', {
      mostrarModalItensNaoSalvos,
      mostrarModalPagamento,
      itensNaoSalvos: itensNaoSalvos.length,
      modificado,
      salvandoParaFechar
    });
  }, [mostrarModalItensNaoSalvos, mostrarModalPagamento, itensNaoSalvos, modificado, salvandoParaFechar]);

  // ========== FUNÇÕES AUXILIARES ==========
  
  const todosItens = [...itensSalvos, ...itensNaoSalvos];
  const totalComanda = todosItens.reduce((sum, item) => 
    sum + (item.precoUnitario * item.quantidade), 0
  );
  const restantePagar = totalComanda - totalPago;

  const calcularItensNaoSalvos = () => {
    const quantidade = itensNaoSalvos.length;
    const valor = itensNaoSalvos.reduce((sum, item) => 
      sum + (item.precoUnitario * item.quantidade), 0);
    
    console.log('📊 calcularItensNaoSalvos:', {
      quantidade,
      valor,
      itens: itensNaoSalvos.map(i => ({ 
        nome: i.produto?.nome, 
        quantidade: i.quantidade,
        preco: i.precoUnitario 
      }))
    });
    
    return { quantidade, valor };
  };

  // ========== FUNÇÕES DA COMANDA ==========

  const abrirEdicaoAdicionais = (itemId: number, produtoId: string, produto: any, observacao: string) => {
    const produtoObj = produtosReais.find(p => p.id === produtoId);
    if (!produtoObj) return;
    
    setItemEditando({
      id: itemId,
      produtoId,
      produto: produtoObj,
      observacao
    });
    
    setProdutoSelecionado(produtoObj);
    setProdutoIdSelecionado(produtoId);
    setMostrarModalAdicionais(true);
  };

  const verificarAdicionaisDoProduto = async (produtoId: string, produto: Produto) => {
    try {
      const response = await fetch(`/api/produtos/${produtoId}`);
      
      if (response.ok) {
        const data = await response.json();
        const produtoCompleto = data.data;
        
        if (produtoCompleto?.adicionais && produtoCompleto.adicionais.length > 0) {
          setProdutoSelecionado(produto);
          setProdutoIdSelecionado(produtoId);
          setMostrarModalAdicionais(true);
        } else {
          adicionarItemDiretamente(produtoId, produto);
        }
      } else {
        adicionarItemDiretamente(produtoId, produto);
      }
    } catch (error) {
      console.error('Erro ao verificar adicionais:', error);
      adicionarItemDiretamente(produtoId, produto);
    }
  };

  const adicionarItem = (produtoId: string) => {
    const produto = produtosReais.find(p => p.id === produtoId);
    if (!produto) return;
    
    verificarAdicionaisDoProduto(produtoId, produto);
  };

  const adicionarItemDiretamente = (produtoId: string, produto: Produto) => {
    const produtoSeguro = produto || {
      id: produtoId,
      nome: 'Produto não encontrado',
      preco: 0,
      categoria: 'Sem categoria',
      imagem: '/placeholder-product.jpg'
    };
    
    const novoItem: ItemComanda = {
      id: Date.now() + Math.random(),
      produtoId,
      quantidade: 1,
      precoUnitario: produtoSeguro.preco,
      produto: produtoSeguro,
      observacao: '',
      isNew: true
    };
    
    setItensNaoSalvos(prev => [...prev, novoItem]);
    setModificado(true);
    console.log('➕ Item adicionado, modificado = true');
  };

  const removerItem = (itemId: number, tipo: 'salvo' | 'naoSalvo') => {
    if (tipo === 'salvo') {
      setItensSalvos(itensSalvos.filter(item => item.id !== itemId));
    } else {
      setItensNaoSalvos(itensNaoSalvos.filter(item => item.id !== itemId));
    }
    setModificado(true);
    console.log('🗑️ Item removido, modificado = true');
  };

  const atualizarQuantidade = (itemId: number, novaQuantidade: number, tipo: 'salvo' | 'naoSalvo') => {
    if (novaQuantidade < 1) {
      removerItem(itemId, tipo);
      return;
    }
    
    if (tipo === 'salvo') {
      setItensSalvos(itensSalvos.map(item => 
        item.id === itemId ? { ...item, quantidade: novaQuantidade } : item
      ));
    } else {
      setItensNaoSalvos(itensNaoSalvos.map(item => 
        item.id === itemId ? { ...item, quantidade: novaQuantidade } : item
      ));
    }
    setModificado(true);
    console.log('📈 Quantidade atualizada, modificado = true');
  };

  const atualizarObservacao = (itemId: number, observacao: string, tipo: 'salvo' | 'naoSalvo') => {
    if (tipo === 'salvo') {
      setItensSalvos(itensSalvos.map(item => 
        item.id === itemId ? { ...item, observacao } : item
      ));
    } else {
      setItensNaoSalvos(itensNaoSalvos.map(item => 
        item.id === itemId ? { ...item, observacao } : item
      ));
    }
    setModificado(true);
    console.log('📝 Observação atualizada, modificado = true');
  };

  const salvarItens = async (retornarAoDashboard = false): Promise<boolean> => {
  if (itensNaoSalvos.length === 0 && !modificado) {
    console.log('📭 Nenhuma alteração para salvar');
    if (retornarAoDashboard) {
      // Se não tem alterações mas quer voltar, apenas volta
      setTimeout(() => {
        router.push('/dashboard');
      }, 300);
      return true;
    }
    return true;
  }
  
  console.log('💾 Iniciando salvamento da comanda...');
  
  try {
    const todosItensParaProcessar = [...itensSalvos, ...itensNaoSalvos];
    
    const itensAgrupados = new Map();
    
    todosItensParaProcessar.forEach(item => {
      const chave = `${item.produtoId}-${item.observacao || 'sem-obs'}`;
      
      if (itensAgrupados.has(chave)) {
        const existente = itensAgrupados.get(chave);
        existente.quantidade += item.quantidade;
      } else {
        itensAgrupados.set(chave, {
          ...item,
          id: Date.now() + Math.random()
        });
      }
    });
    
    const itensParaSalvar = Array.from(itensAgrupados.values());
    const totalAgrupado = itensParaSalvar.reduce((sum, item) => 
      sum + (item.precoUnitario * item.quantidade), 0
    );
    
    const numeroMesaParaSalvar = mesa?.numero || mesaId;
    
    const resultado = await salvarComandaNoDB(
      mesaId,
      numeroMesaParaSalvar,
      itensParaSalvar,
      totalAgrupado
    );
    
    if (resultado.success) {
      console.log('✅ Comanda salva com sucesso');
      
      setItensSalvos(itensParaSalvar);
      setItensNaoSalvos([]);
      setModificado(false);
      
      if (resultado.data?._id) {
        setComandaId(resultado.data._id);
      }
      
      // Disparar evento para atualizar dashboard
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('comanda-atualizada', {
          detail: { 
            mesaId, 
            numeroMesa: numeroMesaParaSalvar,
            total: totalAgrupado,
            quantidadeItens: itensParaSalvar.length,
            action: 'update'
          }
        }));
        
        localStorage.setItem(`comanda_atualizada_${mesaId}`, 
          JSON.stringify({
            total: totalAgrupado,
            quantidadeItens: itensParaSalvar.length,
            timestamp: new Date().toISOString(),
            action: 'update'
          })
        );
      }
      
      // Se for para retornar ao dashboard, redireciona
      if (retornarAoDashboard) {
        setTimeout(() => {
          alert('✅ Comanda salva com sucesso! Voltando ao dashboard...');
          router.push('/dashboard');
        }, 500);
      } else {
        alert('✅ Comanda salva com sucesso!');
      }
      
      return true;
      
    } else {
      // Tratamento de erro...
      alert('Erro ao salvar comanda: ' + (resultado.error?.message || 'Erro desconhecido'));
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erro completo ao salvar itens:', error);
    alert('Erro ao salvar itens: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    return false;
  }
};

  const descartarAlteracoes = () => {
    if (!modificado && itensNaoSalvos.length === 0) return;
    
    if (confirm('Descartar alterações não salvas?')) {
      setItensNaoSalvos([]);
      setModificado(false);
    }
  };

  const limparComanda = async () => {
    if (todosItens.length === 0) return;
    
    if (confirm('Tem certeza que deseja limpar toda a comanda?')) {
      const resultado = await salvarComandaNoDB(
        mesaId,
        mesa?.numero || mesaId,
        [], 
        0
      );
      
      if (resultado.success) {
        setItensSalvos([]);
        setItensNaoSalvos([]);
        setTotalPago(0);
        setModificado(false);
        alert('Comanda limpa com sucesso!');
      }
    }
  };

  const apagarMesa = async () => {
    if (!confirm('Tem certeza que deseja APAGAR esta mesa completamente? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/mesas/${mesaId}`, {
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao apagar mesa');
      }
      
      window.location.href = '/dashboard';
      
    } catch (error) {
      console.error('Erro ao apagar mesa:', error);
      alert('Erro: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  const imprimirPrevia = () => {
    alert('Prévia da comanda impressa!');
  };

  // ========== FUNÇÕES DE FECHAMENTO ==========

  const handleFecharConta = () => {
    const { quantidade, valor } = calcularItensNaoSalvos();
    
    console.log('🔍 handleFecharConta - Verificando:', {
      itensNaoSalvos: itensNaoSalvos.length,
      quantidade,
      valor,
      modificado,
      deveMostrarModal: quantidade > 0 || modificado
    });
    
    // Se tem itens não salvos OU a comanda foi modificada
    if (quantidade > 0 || modificado) {
      console.log('🟡 MOSTRANDO MODAL DE ITENS NÃO SALVOS');
      setMostrarModalItensNaoSalvos(true);
    } else {
      // Se não tem itens não salvos, vai direto para o pagamento
      console.log('🟢 Indo direto para pagamento (nada não salvo)');
      setMostrarModalPagamento(true);
    }
  };

  const handleSalvarEFechar = async () => {
    try {
      console.log('💾 handleSalvarEFechar - Iniciando...');
      setSalvandoParaFechar(true);
      
      const salvouComSucesso = await salvarItens();
      
      setMostrarModalItensNaoSalvos(false);
      setSalvandoParaFechar(false);
      
      if (salvouComSucesso) {
        console.log('✅ Salvou com sucesso, abrindo pagamento...');
        setTimeout(() => {
          setMostrarModalPagamento(true);
        }, 500);
      } else {
        console.error('❌ Falha ao salvar itens');
        alert('Não foi possível salvar os itens. Tente novamente.');
      }
      
    } catch (error) {
      console.error('❌ Erro ao salvar e fechar:', error);
      alert('Erro ao processar. Tente novamente.');
      setMostrarModalItensNaoSalvos(false);
      setSalvandoParaFechar(false);
    }
  };

  const handleFecharSemSalvar = () => {
    console.log('🗑️ handleFecharSemSalvar - Iniciando...');
    
    if (itensNaoSalvos.length > 0) {
      const confirmacao = confirm(
        `Tem certeza que deseja descartar ${itensNaoSalvos.length} item${itensNaoSalvos.length !== 1 ? 's' : ''} não salvo${itensNaoSalvos.length !== 1 ? 's' : ''}?\n\nValor: R$ ${calcularItensNaoSalvos().valor.toFixed(2)}\n\nEsta ação não pode ser desfeita!`
      );
      
      if (!confirmacao) {
        console.log('❌ Usuário cancelou o descarte');
        return;
      }
    }
    
    setItensNaoSalvos([]);
    setModificado(false);
    setMostrarModalItensNaoSalvos(false);
    
    setTimeout(() => {
      console.log('🟢 Abrindo modal de pagamento após descarte');
      setMostrarModalPagamento(true);
    }, 300);
  };

  const handleCancelarFechar = () => {
    console.log('✖️ handleCancelarFechar - Cancelando...');
    setMostrarModalItensNaoSalvos(false);
  };

  const voltarDashboard = () => {
    if (modificado) {
      if (!confirm('Tem alterações não salvas. Deseja sair mesmo assim?')) {
        return;
      }
    }
    router.push('/dashboard');
  };

  // ========== FUNÇÕES PARA O MODAL DE PAGAMENTO ==========

  const prepararItensParaPagamento = () => {
    try {
      const itensValidos = todosItens.filter(item => item != null);
      
      console.log('💰 Preparando itens para pagamento:', {
        totalOriginal: todosItens.length,
        totalValido: itensValidos.length
      });
      
      return itensValidos.map(item => {
        let produtoNome = 'Produto não encontrado';
        let produtoCategoria = 'Sem categoria';
        
        if (item.produto) {
          produtoNome = item.produto.nome || 'Produto sem nome';
          produtoCategoria = item.produto.categoria || 'Sem categoria';
        } else if (item.produtoNome) {
          produtoNome = item.produtoNome;
          produtoCategoria = item.produtoCategoria || 'Sem categoria';
        }
        
        return {
          id: item.id || Date.now() + Math.random(),
          produtoId: parseInt(item.produtoId) || 0,
          quantidade: item.quantidade || 1,
          precoUnitario: item.precoUnitario || 0,
          produto: {
            nome: produtoNome,
            categoria: produtoCategoria
          }
        };
      });
      
    } catch (error) {
      console.error('❌ Erro ao preparar itens para pagamento:', error);
      return [];
    }
  };

  const handleConfirmarPagamento = async (pagamentoData: any) => {
  console.log('✅ Pagamento confirmado, fechando comanda...', pagamentoData);
  
  try {
    // SALVAR ITENS ANTES DE FECHAR (se houver não salvos)
    if (modificado || itensNaoSalvos.length > 0) {
      console.log('💾 Salvando itens antes de fechar...');
      await salvarItens();
    }
    
    const todosPagadoresPagos = pagamentoData.pagadores.every((p: any) => p.pago);
    
    // Se pagamento parcial, salvar mas não fechar comanda
    if (!todosPagadoresPagos) {
      console.log('🔄 Pagamento parcial, salvando estado...');
      
      // Aqui você pode salvar o estado do pagamento parcial
      // Mas a comanda continua aberta
      setTotalPago(
        pagamentoData.pagadores
          .filter((p: any) => p.pago)
          .reduce((sum: number, p: any) => sum + p.total, 0)
      );
      
      alert('✅ Pagamento parcial registrado! A comanda continua aberta.');
      setMostrarModalPagamento(false);
      return;
    }
    
    // SE TODOS PAGARAM - FECHAR COMANDA COMPLETAMENTE
    console.log('🔒 Fechando comanda totalmente...');
    
    const numeroMesaParaFechar = mesa?.numero || mesaId;
    
    // Usar o novo endpoint simplificado
    const response = await fetch('/api/comandas/fechar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        comandaId: comandaId || pagamentoData.comandaId,
        mesaId: mesa?._id || mesaId,
        numeroMesa: numeroMesaParaFechar,
        dados: pagamentoData
      })
    });
    
    const resultado = await response.json();
    
    if (resultado.success) {
      console.log('✅ Comanda fechada com sucesso:', resultado);
      
      // DISPARAR EVENTOS PARA ATUALIZAR DASHBOARD
      if (typeof window !== 'undefined') {
        // Evento para dashboard atualizar em tempo real
        window.dispatchEvent(new CustomEvent('comanda-fechada', {
          detail: { 
            mesaId: mesa?._id || mesaId,
            numeroMesa: numeroMesaParaFechar,
            comandaId: comandaId,
            timestamp: new Date().toISOString()
          }
        }));
        
        // Também em localStorage como fallback
        localStorage.setItem(`mesa_fechada_${mesaId}`, 
          JSON.stringify({
            mesaId: mesa?._id || mesaId,
            numeroMesa: numeroMesaParaFechar,
            comandaId: comandaId,
            timestamp: new Date().toISOString(),
            action: 'fechar'
          })
        );
      }
      
      // Mensagem de sucesso
      alert(`✅ Comanda fechada com sucesso!\nTotal: R$ ${pagamentoData.total?.toFixed(2) || totalComanda.toFixed(2)}`);
      
      // Resetar estados locais
      setItensSalvos([]);
      setItensNaoSalvos([]);
      setTotalPago(0);
      setModificado(false);
      setComandaId('');
      
      // Fechar modal e redirecionar
      setMostrarModalPagamento(false);
      
      // Redirecionar para dashboard após 1 segundo
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
      
    } else {
      throw new Error(resultado.error || resultado.message || 'Erro ao fechar comanda');
    }
    
  } catch (error: any) {
    console.error('❌ Erro ao fechar comanda:', error);
    alert(`❌ Erro ao fechar comanda: ${error.message}`);
  }
};

  const handleSalvarParcial = (data: any) => {
    console.log('Pagamento parcial salvo:', data);
    const valorPago = data.pagadores
      .filter((p: any) => p.pago)
      .reduce((sum: number, p: any) => sum + p.total, 0);
    
    setTotalPago(valorPago);
    alert(`Pagamento parcial salvo!\nR$ ${valorPago.toFixed(2)} já pagos\nR$ ${(totalComanda - valorPago).toFixed(2)} restantes`);
  };

  const handleAtualizarComanda = async (comandaId: string, dados: any) => {
    try {
      const response = await fetch(`/api/comandas/${comandaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });
      
      if (!response.ok) throw new Error('Erro ao atualizar comanda');
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao atualizar comanda:', error);
      throw error;
    }
  };

  const handleConfirmarAdicionais = async (
    produtoId: string, 
    adicionaisSelecionados: Array<{
      adicionalId: string;
      quantidade: number;
      precoUnitario: number;
      nome: string;
    }>,
    itemId?: number
  ) => {
    const produto = produtosReais.find(p => p.id === produtoId);
    if (!produto) return;
    
    const precoAdicionais = adicionaisSelecionados.reduce((total, adicional) => 
      total + (adicional.precoUnitario * adicional.quantidade), 0);
    
    const precoTotal = produto.preco + precoAdicionais;
    
    const observacao = adicionaisSelecionados.length > 0
      ? `Adicionais: ${adicionaisSelecionados.map(a => 
          `${a.nome}${a.quantidade > 1 ? ` (${a.quantidade}x)` : ''}`
        ).join(', ')}`
      : '';
    
    if (itemId && itemEditando) {
      const novoItem: ItemComanda = {
        id: itemId,
        produtoId,
        quantidade: 1,
        precoUnitario: precoTotal,
        produto,
        observacao,
        isNew: true
      };
      
      const itemIndexSalvo = itensSalvos.findIndex(item => item.id === itemId);
      const itemIndexNaoSalvo = itensNaoSalvos.findIndex(item => item.id === itemId);
      
      if (itemIndexSalvo !== -1) {
        const novosItens = [...itensSalvos];
        novosItens[itemIndexSalvo] = novoItem;
        setItensSalvos(novosItens);
      } else if (itemIndexNaoSalvo !== -1) {
        const novosItens = [...itensNaoSalvos];
        novosItens[itemIndexNaoSalvo] = novoItem;
        setItensNaoSalvos(novosItens);
      }
      
    } else {
      const novoItem: ItemComanda = {
        id: Date.now() + Math.random(),
        produtoId,
        quantidade: 1,
        precoUnitario: precoTotal,
        produto,
        observacao,
        isNew: true
      };
      
      setItensNaoSalvos(prev => [...prev, novoItem]);
    }
    
    setModificado(true);
    setMostrarModalAdicionais(false);
    setProdutoSelecionado(null);
    setProdutoIdSelecionado('');
    setItemEditando(null);
  };

  // ========== FUNÇÕES DE APRESENTAÇÃO ==========

  const encontrarCategoriaPorNome = (nomeCategoria: string) => {
    return categoriasReais.find(cat => 
      cat.nome.toLowerCase() === nomeCategoria.toLowerCase()
    );
  };

  const produtosFiltrados = produtosReais.filter(produto => {
    const categoriaProduto = encontrarCategoriaPorNome(produto.categoria);
    
    const categoriaProdutoId = categoriaProduto?.id || produto.categoria.toLowerCase().replace(/\s+/g, '-');
    
    const passaCategoria = categoriaAtiva === 'todos' || categoriaProdutoId === categoriaAtiva;
    const passaBusca = produto.nome.toLowerCase().includes(busca.toLowerCase());
    
    return passaCategoria && passaBusca;
  });

  const gerarTituloComanda = () => {
    if (!configSistema || !mesa) return `PDV - ${mesa?.nome || ''}`;
    
    const numeroFormatado = mesa.numero?.padStart(2, '0') || mesaId.padStart(2, '0');
    
    switch(configSistema.presetComanda) {
      case 'ficha':
        return `FICHA #${mesaId}`;
      case 'mesa':
        return `MESA ${numeroFormatado}`;
      case 'pedido':
        return `PEDIDO #${mesaId}`;
      case 'comanda':
      default:
        return `COMANDA ${numeroFormatado}`;
    }
  };

  // ========== RENDERIZAÇÃO ==========

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando comanda da mesa {mesaId}...</p>
        </div>
      </div>
    );
  }

  return (
    <ComandaLayout>
      <div className="flex h-screen bg-white">
        
        <div className="w-1/3 flex flex-col h-full border-r border-gray-200">
          <ComandaEsquerda
            mesa={mesa}
            itensSalvos={itensSalvos}
            itensNaoSalvos={itensNaoSalvos}
            totalComanda={totalComanda}
            totalPago={totalPago}
            restantePagar={restantePagar}
            modificado={modificado}
            onRemoverItem={removerItem}
            onAtualizarQuantidade={atualizarQuantidade}
            onAtualizarObservacao={atualizarObservacao}
            onSalvarItens={salvarItens}
            onDescartarAlteracoes={descartarAlteracoes}
            onEditarAdicionais={abrirEdicaoAdicionais}
            onLimparComanda={limparComanda}
            onApagarMesa={apagarMesa} 
            onImprimirPrevia={imprimirPrevia}
            onFecharConta={handleFecharConta}
            onVoltarDashboard={voltarDashboard}
            comandaId={comandaId}
            onMostrarModalPagamento={() => setMostrarModalPagamento(true)}
          />
        </div>
        
        <div className="w-2/3 flex flex-col h-full">
          
          <div className="flex-1 overflow-hidden">
            <CatalogoDireita
              produtos={produtosFiltrados}
              categorias={categoriasReais}
              categoriaAtiva={categoriaAtiva}
              busca={busca}
              onSelecionarCategoria={setCategoriaAtiva}
              onBuscar={setBusca}
              onAdicionarProduto={adicionarItem}
              encontrarCategoriaPorNome={encontrarCategoriaPorNome}
            />
          </div>
          
          {modificado && (
            <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-white/30 p-3 rounded-xl mr-4">
                    <span className="text-white text-2xl">💾</span>
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg">
                      {itensNaoSalvos.length > 0 
                        ? `${itensNaoSalvos.length} item(s) não salvos`
                        : 'Alterações pendentes'
                      }
                    </p>
                    <p className="text-green-100 text-sm">
                      Salve para persistir no banco de dados
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={descartarAlteracoes}
                    className="px-6 py-3 bg-white/20 text-white rounded-xl hover:bg-white/30 border border-white/30 font-medium text-sm"
                  >
                    Descartar
                  </button>
                  <button
                    onClick={() => salvarItens(true)}  // voltando ao dashboard xD I LIKE SEXO HAN HAN
                    className="px-8 py-3 bg-white text-green-700 font-bold rounded-xl hover:bg-gray-100 shadow-lg text-base flex items-center gap-3"
                  >
                    <span className="text-xl">💾</span>
                    SALVAR COMANDA
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {mostrarModalPagamento && (
        <PagamentoModal
          mesa={{
            numero: mesa?.numero || mesaId,
            nome: mesa?.nome || `Mesa ${mesaId}`
          }}
          itens={prepararItensParaPagamento()}
          total={totalComanda}
          onClose={() => setMostrarModalPagamento(false)}
          onConfirmar={handleConfirmarPagamento}
          onSalvarParcial={handleSalvarParcial}
          comandaId={comandaId}
          mesaId={mesaId}
          onAtualizarComanda={handleAtualizarComanda}
        />
      )}
      
      {mostrarModalConfirmacaoFechar && (
        <ModalConfirmacaoFechar
          aberto={mostrarModalConfirmacaoFechar}
          quantidadeItensNaoSalvos={calcularItensNaoSalvos().quantidade}
          valorItensNaoSalvos={calcularItensNaoSalvos().valor}
          onCancelar={handleCancelarFechar}
          onSalvarEFechar={handleSalvarEFechar}
          onFecharSemSalvar={handleFecharSemSalvar}
        />
      )}

      {mostrarModalItensNaoSalvos && (
        <ModalItensNaoSalvos
          aberto={mostrarModalItensNaoSalvos}
          quantidadeItensNaoSalvos={calcularItensNaoSalvos().quantidade}
          valorItensNaoSalvos={calcularItensNaoSalvos().valor}
          onCancelar={handleCancelarFechar}
          onSalvarEFechar={handleSalvarEFechar}
          onFecharSemSalvar={handleFecharSemSalvar}
          carregando={salvandoParaFechar}
        />
      )}
      
      {mostrarModalAdicionais && produtoSelecionado && (
        <ModalAdicionais
          produto={produtoSelecionado}
          onClose={() => {
            setMostrarModalAdicionais(false);
            setProdutoSelecionado(null);
            setProdutoIdSelecionado('');
          }}
          onConfirmar={handleConfirmarAdicionais}
          produtoId={produtoIdSelecionado}
        />
      )}

      {/* Botão de debug temporário */}
      <button
        onClick={() => {
          console.log('🔍 DEBUG - Estados:', {
            mostrarModalItensNaoSalvos,
            itensNaoSalvos: itensNaoSalvos.length,
            modificado,
            todosItens: todosItens.length
          });
        }}
        className="fixed bottom-4 right-4 bg-purple-500 text-white p-2 rounded text-xs opacity-50 hover:opacity-100"
      >
        DEBUG
      </button>
    </ComandaLayout>
  );
}