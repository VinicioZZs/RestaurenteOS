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


interface Produto {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  imagem: string;
}

interface ProdutoCompleto {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  imagem: string;
  descricao?: string;
  ativo?: boolean;
}

interface ItemComanda {
  id: number;
  produtoId: string;
  quantidade: number;
  precoUnitario: number;
  produto: any;
  observacao: string;
  isNew?: boolean;
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
    // Primeiro, tentar buscar mesa pelo número para obter o _id correto
    const mesaResponse = await fetch(`/api/mesas/buscar?termo=${encodeURIComponent(mesaIdOuNumero)}`);
    
    if (mesaResponse.ok) {
      const mesaData = await mesaResponse.json();
      
      if (mesaData.success && mesaData.data) {
        const mesa = mesaData.data;
        const mesaIdReal = mesa._id;
        
        // Buscar comanda usando o _id real da mesa
        const comandaResponse = await fetch(`/api/comandas?mesaId=${mesaIdReal}`);
        
        if (comandaResponse.ok) {
          const comandaData = await comandaResponse.json();
          
          if (comandaData.success && comandaData.data) {
            return comandaData.data;
          }
        }
      }
    }
    
    // Se não encontrou pela mesa, tentar buscar direto pela comanda
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
        mesaId: numeroMesaParaEnviar, // Enviar número da mesa
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
      // Se for erro 409 (Conflito - comanda já existe)
      if (response.status === 409) {
        return {
          success: false,
          error: new Error('Já existe uma comanda aberta para esta mesa'),
          data: data.data
        };
      }
      
      return {
        success: false,
        error: new Error(data.error || `Erro HTTP ${response.status}: ${response.statusText}`)
      };
    }
    
    return data;
  } catch (error) {
    console.error('❌ Erro completo ao salvar comanda:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Erro desconhecido')
    };
  }
}

async function fetchProdutosReais(): Promise<Produto[]> {
  try {
    const response = await fetch('/api/produtos?ativos=true');
    if (!response.ok) {
      console.warn('⚠️ Erro ao buscar produtos da API, usando dados mockados');
      return getProdutosMockados();
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
    
    return getProdutosMockados();
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return getProdutosMockados();
  }
}

// Função auxiliar com produtos mockados
function getProdutosMockados(): Produto[] {
  return [
    { id: '1', nome: 'Coca-Cola 350ml', preco: 5.00, categoria: 'Bebidas', imagem: '/placeholder-product.jpg' },
    { id: '2', nome: 'Hambúrguer Artesanal', preco: 25.00, categoria: 'Lanches', imagem: '/placeholder-product.jpg' },
    { id: '3', nome: 'Batata Frita', preco: 15.00, categoria: 'Acompanhamentos', imagem: '/placeholder-product.jpg' },
    { id: '4', nome: 'Água Mineral 500ml', preco: 3.00, categoria: 'Bebidas', imagem: '/placeholder-product.jpg' },
    { id: '5', nome: 'Sorvete Casquinha', preco: 8.00, categoria: 'Sobremesas', imagem: '/placeholder-product.jpg' },
  ];
}


async function fetchCategoriasReais(): Promise<Array<{
  id: string;
  nome: string;
  icone: string;
  imagem?: string;
  usaImagem?: boolean;
  descricao?: string;
  ordem?: number;
}>> {
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
  const [categoriasReais, setCategoriasReais] = useState([
    { id: 'todos', nome: 'Todos', icone: '📦' }
  ]);
  const [mostrarModalPagamento, setMostrarModalPagamento] = useState(false);
  
  const [mostrarModalAdicionais, setMostrarModalAdicionais] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [produtoIdSelecionado, setProdutoIdSelecionado] = useState<string>('');

  const [configSistema, setConfigSistema] = useState<any>(null);

  const [itemEditando, setItemEditando] = useState<{
    id: number;
    produtoId: string;
    produto: Produto;
    observacao: string;
  } | null>(null);

  const [mostrarModalConfirmacaoFechar, setMostrarModalConfirmacaoFechar] = useState(false);

  // ========== USEFFECTS ==========
  
  useEffect(() => {
  const verificarComandaExistente = async () => {
    if (!mesaId || carregando) return;
    
    try {
      // Verificar se já existe comanda para esta mesa
      const response = await fetch(`/api/comandas?mesaId=${mesaId}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        // Já tem comanda - usar ela
        setComandaId(data.data._id);
        setItensSalvos(data.data.itens || []);
        
        console.log('✅ Usando comanda existente:', data.data._id);
      } else {
        // Não tem comanda - verificar se pode criar
        const verificaResponse = await fetch(`/api/comandas/verificar-mesa?mesaId=${mesaId}`);
        const verificaData = await verificaResponse.json();
        
        if (verificaData.success && verificaData.comandaExistente) {
          // Redirecionar para a comanda existente
          alert('Esta mesa já tem uma comanda aberta! Redirecionando...');
          router.push(`/mesas/${verificaData.comandaExistente.numeroMesa}`);
        }
      }
    } catch (error) {
      console.error('Erro ao verificar comanda:', error);
    }
  };
  
  verificarComandaExistente();
}, [mesaId, carregando, router]);

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
        
        if (!categoriasDB.some(cat => cat.id === 'todos')) {
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
  // Buscar produto nos produtos já carregados
  const produtoEncontrado = produtosDB.find(p => p.id === item.produtoId);
  
  return {
    id: Date.now() + Math.random(),
    produtoId: item.produtoId,
    quantidade: item.quantidade,
    precoUnitario: item.precoUnitario,
    observacao: item.observacao || '',
    produto: produtoEncontrado || {
      id: item.produtoId,
      nome: item.nome || 'Produto não encontrado',
      preco: item.precoUnitario || 0,
      categoria: item.categoria || 'Sem categoria',
      imagem: '/placeholder-product.jpg'
    }
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
  // Verificar periodicamente se a mesa foi fechada
  const verificarStatusMesa = async () => {
    if (!mesaId || !mesa?._id) return;
    
    try {
      // Verificar se ainda existe comanda aberta para esta mesa
      const response = await fetch(`/api/comandas?mesaId=${mesa._id}`);
      
      if (response.ok) {
        const data = await response.json();
        
        console.log('🔍 Verificação periódica da mesa:', {
          mesaId: mesa._id,
          temComanda: data.success && data.data,
          status: data.data?.status
        });
        
        // SÓ redirecionar se a comanda estiver com status "fechada"
        if (data.success && data.data && data.data.status === 'fechada') {
          console.log('🔄 Comanda foi fechada, redirecionando...');
          
          // Pequeno delay antes de mostrar o alerta
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
  
  // Verificar a cada 15 segundos (não 8)
  const interval = setInterval(verificarStatusMesa, 15000);
  
  return () => clearInterval(interval);
}, [mesaId, mesa?._id, router]);

  // ========== FUNÇÕES AUXILIARES ==========
  
  const todosItens = [...itensSalvos, ...itensNaoSalvos];
  const totalComanda = todosItens.reduce((sum, item) => 
    sum + (item.precoUnitario * item.quantidade), 0
  );
  const restantePagar = totalComanda - totalPago;

  const extrairAdicionaisDaObservacao = (observacao: string) => {
    if (!observacao.includes('Adicionais:')) return [];
    
    const partes = observacao.split('Adicionais:')[1].trim();
    const adicionaisArray = partes.split(',').map(item => item.trim());
    
    return [];
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
    
    const adicionaisExistentes = extrairAdicionaisDaObservacao(observacao);
    
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
    const novoItem: ItemComanda = {
      id: Date.now() + Math.random(),
      produtoId,
      quantidade: 1,
      precoUnitario: produto.preco,
      produto,
      observacao: '',
      isNew: true
    };
    
    setItensNaoSalvos(prev => [...prev, novoItem]);
    setModificado(true);
  };

  const calcularItensNaoSalvos = () => {
  const quantidade = itensNaoSalvos.length;
  const valor = itensNaoSalvos.reduce((sum, item) => 
    sum + (item.precoUnitario * item.quantidade), 0);
  
  return { quantidade, valor };
};


  const removerItem = (itemId: number, tipo: 'salvo' | 'naoSalvo') => {
    if (tipo === 'salvo') {
      setItensSalvos(itensSalvos.filter(item => item.id !== itemId));
    } else {
      setItensNaoSalvos(itensNaoSalvos.filter(item => item.id !== itemId));
    }
    setModificado(true);
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
  };

  const salvarItens = async (): Promise<boolean> => {
  if (itensNaoSalvos.length === 0 && !modificado) {
    alert('Não há alterações para salvar!');
    return false;
  }
  
  try {
    const todosItensParaProcessar = [...itensSalvos, ...itensNaoSalvos];
    
    const itensAgrupados = new Map();
    
    todosItensParaProcessar.forEach(item => {
      const chave = `${item.produtoId}-${item.observacao}`;
      
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
    
    console.log('💾 Salvando comanda...', {
      mesaId,
      numeroMesa: numeroMesaParaSalvar,
      totalItens: itensParaSalvar.length,
      totalValor: totalAgrupado
    });
    
    const resultado = await salvarComandaNoDB(
      mesaId,
      numeroMesaParaSalvar,
      itensParaSalvar,
      totalAgrupado
    );
    
    if (resultado.success) {
      setItensSalvos(itensParaSalvar);
      setItensNaoSalvos([]);
      setModificado(false);
      
      if (resultado.data?._id) {
        setComandaId(resultado.data._id);
      }
      
      // 🔥🔥🔥 IMPORTANTE: NÃO disparar evento de comanda-fechada
      // Disparar APENAS evento de atualização
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('comanda-atualizada', {
          detail: { 
            mesaId, 
            numeroMesa: numeroMesaParaSalvar,
            total: totalAgrupado,
            quantidadeItens: itensParaSalvar.length,
            action: 'update' // Indica que é apenas atualização, não fechamento
          }
        }));
        
        // Salvar no localStorage para sincronização entre abas
        localStorage.setItem(`comanda_atualizada_${mesaId}`, 
          JSON.stringify({
            total: totalAgrupado,
            quantidadeItens: itensParaSalvar.length,
            timestamp: new Date().toISOString(),
            action: 'update' // Indica atualização
          })
        );
      }
      
      // 🔥🔥🔥 ADICIONEI APENAS ESTAS LINHAS:
      // Redireciona para o dashboard após salvar
      setTimeout(() => {
        alert('✅ Comanda salva com sucesso! Voltando ao dashboard...');
        router.push('/dashboard');
      }, 500);
      
      return true;
      
    } else {
      // Se for erro de comanda já existente, usar a existente
      if (resultado.error?.includes('Já existe uma comanda')) {
        console.log('⚠️ Usando comanda existente...');
        
        // Buscar a comanda existente
        const buscarResponse = await fetch(`/api/comandas?mesaId=${mesaId}`);
        if (buscarResponse.ok) {
          const buscarData = await buscarResponse.json();
          if (buscarData.success && buscarData.data) {
            setComandaId(buscarData.data._id);
            setItensSalvos(buscarData.data.itens || []);
            setItensNaoSalvos([]);
            setModificado(false);
            
            // 🔥🔥🔥 ADICIONEI TAMBÉM AQUI:
            setTimeout(() => {
              alert('⚠️ Usando comanda existente para esta mesa. Voltando ao dashboard...');
              router.push('/dashboard');
            }, 500);
            
            return true;
          }
        }
      }
      
      alert('Erro ao salvar comanda: ' + (resultado.error?.message || 'Erro desconhecido'));
      return false;
    }
    
  } catch (error) {
    console.error('Erro ao salvar itens:', error);
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

 const handleFecharConta = () => {
  const { quantidade, valor } = calcularItensNaoSalvos();
  
  console.log('🔍 DEBUG handleFecharConta:');
  console.log('  - itensNaoSalvos.length:', itensNaoSalvos.length);
  console.log('  - quantidade (calculada):', quantidade);
  console.log('  - modificado:', modificado);
  console.log('  - deve mostrar modal?', quantidade > 0 || modificado);
  
  // Se tem itens não salvos OU a comanda foi modificada
  if (quantidade > 0 || modificado) {
    console.log('🟡 MOSTRANDO MODAL DE CONFIRMAÇÃO');
    setMostrarModalConfirmacaoFechar(true);
  } else {
    // Se não tem itens não salvos, vai direto para o pagamento
    console.log('🟢 Indo direto para pagamento (nada não salvo)');
    setMostrarModalPagamento(true);
  }
};

const handleSalvarEFechar = async () => {
  try {
    // Salva os itens e aguarda o resultado
    const salvouComSucesso = await salvarItens();
    
    // Fecha o modal de confirmação
    setMostrarModalConfirmacaoFechar(false);
    
    // Se salvou com sucesso, abre o modal de pagamento
    if (salvouComSucesso) {
      // Pequeno delay para dar tempo da UI atualizar
      setTimeout(() => {
        setMostrarModalPagamento(true);
      }, 500);
    } else {
      // Se não salvou, mantém na mesma tela
      alert('Não foi possível salvar os itens. Tente novamente.');
    }
    
  } catch (error) {
    console.error('Erro ao salvar e fechar:', error);
    alert('Erro ao processar. Tente novamente.');
    setMostrarModalConfirmacaoFechar(false);
  }
};

const handleFecharSemSalvar = () => {
  // Confirma se o usuário realmente quer perder os itens
  if (itensNaoSalvos.length > 0) {
    const confirmacao = confirm(
      `Tem certeza que deseja descartar ${itensNaoSalvos.length} item${itensNaoSalvos.length !== 1 ? 's' : ''} não salvo${itensNaoSalvos.length !== 1 ? 's' : ''}?\n\nValor: R$ ${calcularItensNaoSalvos().valor.toFixed(2)}\n\nEsta ação não pode ser desfeita!`
    );
    
    if (!confirmacao) {
      return; // Usuário cancelou
    }
  }
  
  // Descarta os itens não salvos
  setItensNaoSalvos([]);
  setModificado(false);
  
  // Fecha o modal de confirmação
  setMostrarModalConfirmacaoFechar(false);
  
  // Abre o modal de pagamento
  setTimeout(() => {
    setMostrarModalPagamento(true);
  }, 300);
};

const handleCancelarFechar = () => {
  setMostrarModalConfirmacaoFechar(false);
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
    return todosItens.map(item => ({
      id: item.id,
      produtoId: parseInt(item.produtoId),
      quantidade: item.quantidade,
      precoUnitario: item.precoUnitario,
      produto: {
        nome: item.produto.nome,
        categoria: item.produto.categoria
      }
    }));
  };

  // 🔥🔥🔥 FUNÇÃO CORRIGIDA - handleConfirmarPagamento 🔥🔥🔥
  const handleConfirmarPagamento = async (pagamentoData: any) => {
    console.log('Pagamento confirmado:', pagamentoData);
    
    try {
      const todosPagadoresPagos = pagamentoData.pagadores.every((p: any) => p.pago);
      
      if (!todosPagadoresPagos) {
        const response = await fetch('/api/comandas/pagamento-parcial', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            comandaId: pagamentoData.comandaId || comandaId,
            dados: pagamentoData,
            action: 'fechar' // <-- Este campo é essencial!
          })
        });
        
        const resultado = await response.json();
        
        if (resultado.success) {
          alert('✅ Pagamento parcial salvo!');
          setMostrarModalPagamento(false);
        }
        
        return;
      }
      
      console.log('🔒 Fechando comanda totalmente...');
      
      const response = await fetch('/api/comandas/pagamento-parcial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comandaId: pagamentoData.comandaId || comandaId,
          dados: pagamentoData,
          action: 'fechar'
        })
      });
      
      const resultado = await response.json();
      
      if (resultado.success) {
        alert(`✅ Comanda fechada com sucesso!\nTotal: R$ ${pagamentoData.total.toFixed(2)}`);
        
        // 🔥 DISPARAR EVENTOS PARA O DASHBOARD
        if (typeof window !== 'undefined') {
          const numeroMesaFechada = pagamentoData.mesa?.numero || mesa?.numero || mesaId;
          
          console.log('🚀 Disparando eventos para dashboard...', {
            mesaId: mesaId,
            numeroMesa: numeroMesaFechada,
            comandaId: pagamentoData.comandaId || comandaId
          });
          
          // 1. Evento principal que o dashboard já escuta
          // Dentro de handleConfirmarPagamento
          window.dispatchEvent(new CustomEvent('comanda-fechada', {
            detail: { 
              mesaId: mesa._id, // O ID do MongoDB
              numeroMesa: mesa.numero // O número visível
            }
          }));
          
          // 2. Evento específico para fechamento
          window.dispatchEvent(new CustomEvent('comanda-fechada', {
            detail: { 
              mesaId: mesaId,
              numeroMesa: numeroMesaFechada,
              comandaId: pagamentoData.comandaId || comandaId
            }
          }));
          
          // 3. Salvar no localStorage como backup
          localStorage.setItem(`mesa_fechada_${mesaId}`, 
            JSON.stringify({
              mesaId: mesaId,
              numeroMesa: numeroMesaFechada,
              comandaId: pagamentoData.comandaId || comandaId,
              timestamp: new Date().toISOString(),
              action: 'fechar'
            })
          );
          
          console.log('✅ Eventos disparados e localStorage salvo');
        }
        
        setTotalPago(totalComanda);
        setMostrarModalPagamento(false);
        
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
        
      } else {
        throw new Error(resultado.error || 'Erro ao fechar comanda');
      }
      
    } catch (error: any) {
      console.error('❌ Erro:', error);
      alert(`❌ Erro: ${error.message}`);
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

  const gerarSubtitulo = () => {
    if (!configSistema) return 'Sistema de atendimento';
    
    const subtitulos: Record<string, string> = {
      comanda: 'Sistema de Comandas',
      ficha: 'Sistema de Fichas', 
      mesa: 'Atendimento por Mesa',
      pedido: 'Sistema de Pedidos'
    };
    
    const preset = configSistema.presetComanda as string;
    return subtitulos[preset] || 'Sistema de atendimento';
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
          onClick={salvarItens}
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
  </ComandaLayout>
);
}