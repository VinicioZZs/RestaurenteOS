// app/mesas/[id]/page.tsx - VERSÃO COMPLETA COM MODAL DE ADICIONAIS (CORRIGIDO) E MELHORIAS
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ComandaEsquerda from '@/components/comanda/ComandaEsquerda';
import CatalogoDireita from '@/components/comanda/CatalogoDireita';
import ComandaLayout from '@/components/comanda/ComandaLayout';
import PagamentoModal from '@/components/pagamento/PagamentoModal';
import ModalAdicionais from '@/components/comanda/ModalAdicionais';

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
}

interface ComandaDB {
  _id: string;
  mesaId: string;
  numeroMesa: string;
  itens: any[];
  total: number;
  status: string;
}

// ========== FUNÇÕES AUXILIARES (OK FORA DO COMPONENTE) ==========

async function fetchComanda(mesaIdOuNumero: string): Promise<ComandaDB | null> {
  try {
    // Tenta buscar pelo ID/número
    const response = await fetch(`/api/comandas?mesaId=${mesaIdOuNumero}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    
    // Se não encontrou, tenta buscar pelo número da mesa
    if (!data.success || !data.data) {
      // Primeiro buscar a mesa para pegar o _id
      const mesaResponse = await fetch(`/api/mesas/buscar-mesa?numero=${mesaIdOuNumero}`);
      if (mesaResponse.ok) {
        const mesaData = await mesaResponse.json();
        if (mesaData.success && mesaData.data) {
          // Agora busca a comanda com o _id real
          const comandaResponse = await fetch(`/api/comandas?mesaId=${mesaData.data._id}`);
          if (comandaResponse.ok) {
            const comandaData = await comandaResponse.json();
            return comandaData.success ? comandaData.data : null;
          }
        }
      }
      return null;
    }
    
    return data.data;
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
      observacao: item.observacao
    }));
    
    console.log('📦 Itens para salvar:', itensParaSalvar);
    
    // Usar o número da mesa corretamente
    const numeroMesaParaEnviar = numeroMesa || mesaId;
    
    console.log('🔍 Enviando com:', {
      mesaId: numeroMesaParaEnviar,
      numeroMesa: numeroMesaParaEnviar
    });
    
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
    
    console.log('📥 Resposta da API:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    // Pegar o texto da resposta primeiro
    const responseText = await response.text();
    console.log('📄 Conteúdo da resposta:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Erro ao parsear JSON:', parseError);
      throw new Error(`Resposta não é JSON válido: ${responseText.substring(0, 100)}...`);
    }
    
    console.log('✅ Dados parseados:', data);
    
    if (!response.ok) {
      throw new Error(data.error || `Erro HTTP ${response.status}: ${response.statusText}`);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Erro completo ao salvar comanda:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      details: error 
    };
  }
}

async function fetchProdutosReais(): Promise<Produto[]> {
  try {
    const response = await fetch('/api/produtos?ativos=true');
    if (!response.ok) throw new Error('Erro ao buscar produtos');
    
    const data = await response.json();
    
    if (data.success && data.data) {
      return data.data.map((produto: any) => ({
        id: produto._id.toString(),
        nome: produto.nome,
        preco: produto.precoVenda || produto.preco || 0,
        categoria: produto.categoria || 'Sem Categoria',
        imagem: produto.imagem || '/placeholder-product.jpg'
      }));
    }
    return [];
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    // Fallback para teste
    return [
      { id: '1', nome: 'Coca-Cola 350ml', preco: 5.00, categoria: 'Bebidas', imagem: '/placeholder-product.jpg' },
      { id: '2', nome: 'Hambúrguer Artesanal', preco: 25.00, categoria: 'Lanches', imagem: '/placeholder-product.jpg' },
      { id: '3', nome: 'Batata Frita', preco: 15.00, categoria: 'Acompanhamentos', imagem: '/placeholder-product.jpg' },
    ];
  }
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
    // Fallback com ícones maiores
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
  
  // ========== ESTADOS (HOOKS DENTRO DO COMPONENTE) ==========
  
  // Estados principais
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
  
  // Estados para o modal de adicionais
  const [mostrarModalAdicionais, setMostrarModalAdicionais] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [produtoIdSelecionado, setProdutoIdSelecionado] = useState<string>('');

  // Estado para configurações do sistema
  const [configSistema, setConfigSistema] = useState<any>(null);

  // Estado para edição de adicionais
  const [itemEditando, setItemEditando] = useState<{
    id: number;
    produtoId: string;
    produto: Produto;
    observacao: string;
  } | null>(null);

  // ========== USEFFECTS ==========
  
  // Carregar configurações do sistema
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

  // Carregar dados iniciais da comanda
  useEffect(() => {
    async function carregarComanda() {
      setCarregando(true);
      
      try {
        // 1. Carregar produtos
        const produtosDB = await fetchProdutosReais();
        setProdutosReais(produtosDB);
        
        // 2. Buscar categorias do banco de dados
        const categoriasDB = await fetchCategoriasReais();
        
        // Adicionar "Todos" no início se não existir
        if (!categoriasDB.some(cat => cat.id === 'todos')) {
          categoriasDB.unshift({ id: 'todos', nome: 'Todos', icone: '📦' });
        }
        
        setCategoriasReais(categoriasDB);
          
        // 3. Buscar a mesa REAL do banco de dados
        const response = await fetch(`/api/mesas/buscar-mesa?numero=${mesaId}`);
        let mesaReal = null;
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            mesaReal = data.data;
          }
        }
        
        // Se não encontrou, criar uma mock ou buscar pelo número
        const mesa = mesaReal || {
          id: mesaId,
          _id: mesaId,
          numero: mesaId.padStart(2, '0'),
          nome: `Mesa ${mesaId.padStart(2, '0')}`,
          status: 'ocupada',
          capacidade: 4,
        };
        
        setMesa(mesa);
        
        // 4. Buscar comanda existente
        const mesaIdParaBuscar = mesa._id || mesa.id || mesaId;
        const comandaDB = await fetchComanda(mesaIdParaBuscar);
        
        if (comandaDB) {
          setComandaId(comandaDB._id);
          
          // Converter itens da comanda
          const itensComProdutos = comandaDB.itens.map((item: any) => {
            const produtoEncontrado = produtosDB.find(p => p.id === item.produtoId);
            return {
              id: Date.now() + Math.random(),
              produtoId: item.produtoId,
              quantidade: item.quantidade,
              precoUnitario: item.precoUnitario,
              observacao: item.observacao || '',
              produto: produtoEncontrado || {
                nome: 'Produto não encontrado',
                categoria: 'desconhecida'
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

  // ========== FUNÇÕES AUXILIARES DO COMPONENTE ==========
  
  // Calcular totais
  const todosItens = [...itensSalvos, ...itensNaoSalvos];
  const totalComanda = todosItens.reduce((sum, item) => 
    sum + (item.precoUnitario * item.quantidade), 0
  );
  const restantePagar = totalComanda - totalPago;

  // Extrair adicionais da observação
  const extrairAdicionaisDaObservacao = (observacao: string) => {
    if (!observacao.includes('Adicionais:')) return [];
    
    const partes = observacao.split('Adicionais:')[1].trim();
    const adicionaisArray = partes.split(',').map(item => item.trim());
    
    // Aqui você precisaria mapear os nomes para IDs
    return [];
  };

  // ========== FUNÇÕES DA COMANDA ==========

  // Abrir modal para editar adicionais de um item existente
  const abrirEdicaoAdicionais = (itemId: number, produtoId: string, produto: any, observacao: string) => {
    const produtoObj = produtosReais.find(p => p.id === produtoId);
    if (!produtoObj) return;
    
    setItemEditando({
      id: itemId,
      produtoId,
      produto: produtoObj,
      observacao
    });
    
    // Extrair adicionais existentes da observação
    const adicionaisExistentes = extrairAdicionaisDaObservacao(observacao);
    
    setProdutoSelecionado(produtoObj);
    setProdutoIdSelecionado(produtoId);
    setMostrarModalAdicionais(true);
  };

  // Verificar adicionais do produto
  const verificarAdicionaisDoProduto = async (produtoId: string, produto: Produto) => {
    try {
      // Buscar informações completas do produto
      const response = await fetch(`/api/produtos/${produtoId}`);
      
      if (response.ok) {
        const data = await response.json();
        const produtoCompleto = data.data;
        
        // Verificar se o produto tem adicionais configurados
        if (produtoCompleto?.adicionais && produtoCompleto.adicionais.length > 0) {
          // Abrir modal de adicionais
          setProdutoSelecionado(produto);
          setProdutoIdSelecionado(produtoId);
          setMostrarModalAdicionais(true);
        } else {
          // Adicionar diretamente sem adicionais
          adicionarItemDiretamente(produtoId, produto);
        }
      } else {
        // Se erro na API, adicionar diretamente
        adicionarItemDiretamente(produtoId, produto);
      }
    } catch (error) {
      console.error('Erro ao verificar adicionais:', error);
      adicionarItemDiretamente(produtoId, produto);
    }
  };

  // Adiciona item (com verificação de adicionais)
  const adicionarItem = (produtoId: string) => {
    const produto = produtosReais.find(p => p.id === produtoId);
    if (!produto) return;
    
    // Verificar se o produto tem adicionais disponíveis
    verificarAdicionaisDoProduto(produtoId, produto);
  };

  // Adicionar item sem modal
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

  // Função para remover item
  const removerItem = (itemId: number, tipo: 'salvo' | 'naoSalvo') => {
    if (tipo === 'salvo') {
      setItensSalvos(itensSalvos.filter(item => item.id !== itemId));
    } else {
      setItensNaoSalvos(itensNaoSalvos.filter(item => item.id !== itemId));
    }
    setModificado(true);
  };

  // Função para atualizar quantidade
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

  // Função para atualizar observação
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

  // Função para salvar - Agora agrupa itens iguais
  const salvarItens = async () => {
    if (itensNaoSalvos.length === 0 && !modificado) {
      alert('Não há alterações para salvar!');
      return;
    }
    
    // Antes de salvar, agrupa itens iguais
    const todosItensParaProcessar = [...itensSalvos, ...itensNaoSalvos];
    
    // Agrupar por produtoId e observação
    const itensAgrupados = new Map();
    
    todosItensParaProcessar.forEach(item => {
      const chave = `${item.produtoId}-${item.observacao}`;
      
      if (itensAgrupados.has(chave)) {
        // Soma quantidade
        const existente = itensAgrupados.get(chave);
        existente.quantidade += item.quantidade;
      } else {
        // Novo item agrupado
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
    
    // Enviar o número correto da mesa
    const numeroMesaParaSalvar = mesa?.numero || mesaId;
    
    // Salvar no banco
    const resultado = await salvarComandaNoDB(
      mesaId,
      numeroMesaParaSalvar,
      itensParaSalvar,
      totalAgrupado
    );
    
    if (resultado.success) {
      // Atualiza com os itens AGRUPADOS
      setItensSalvos(itensParaSalvar);
      setItensNaoSalvos([]);
      setModificado(false);
      if (resultado.data?._id) {
        setComandaId(resultado.data._id);
      }
      
      // Forçar atualização do dashboard
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('comanda-atualizada', {
          detail: { mesaId, total: totalAgrupado }
        }));
        
        localStorage.setItem(`comanda_atualizada_${mesaId}`, 
          JSON.stringify({
            total: totalAgrupado,
            quantidadeItens: itensParaSalvar.length,
            timestamp: new Date().toISOString()
          })
        );
      }
      
      // MOSTRAR MENSAGEM DE SUCESSO E REDIRECIONAR
      alert(`Comanda salva com sucesso!\n${itensNaoSalvos.length} item(s) foram agrupados.\n\nRedirecionando para o dashboard...`);
      
      // Redirecionar para o dashboard após 1 segundo
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
      
    } else {
      alert('Erro ao salvar comanda: ' + (resultado.error?.message || 'Erro desconhecido'));
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

  // Apagar mesa (fecha comanda completamente)
  const apagarMesa = async () => {
    if (!confirm('Tem certeza que deseja APAGAR esta mesa completamente? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      // 1. Deletar do banco
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
      
      // 2. Forçar recarregar a página do dashboard
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
    if (modificado) {
      if (confirm('Há alterações não salvas. Salvar antes de fechar a conta?')) {
        salvarItens().then(() => {
          setMostrarModalPagamento(true);
        });
      }
    } else {
      setMostrarModalPagamento(true);
    }
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

  // Função para formatar itens para o PagamentoModal
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

  // Função para confirmar pagamento (chamada pelo modal)
  const handleConfirmarPagamento = (data: any) => {
    console.log('Pagamento confirmado:', data);
    alert(`Pagamento realizado com sucesso!\nTotal: R$ ${data.total.toFixed(2)}`);
    
    // Aqui você faria a lógica para fechar a comanda no banco
    setTotalPago(totalComanda);
    setMostrarModalPagamento(false);
    
    // Redirecionar para dashboard após 1.5 segundos
    setTimeout(() => {
      router.push('/dashboard');
    }, 1500);
  };

  // Função para salvar pagamento parcial
  const handleSalvarParcial = (data: any) => {
    console.log('Pagamento parcial salvo:', data);
    const valorPago = data.pagadores
      .filter((p: any) => p.pago)
      .reduce((sum: number, p: any) => sum + p.total, 0);
    
    setTotalPago(valorPago);
    alert(`Pagamento parcial salvo!\nR$ ${valorPago.toFixed(2)} já pagos\nR$ ${(totalComanda - valorPago).toFixed(2)} restantes`);
  };

  // Função para atualizar comanda no MongoDB (para pagamento parcial)
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

  // Lidar com confirmação do modal de adicionais
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
    
    // Calcular preço total com adicionais
    const precoAdicionais = adicionaisSelecionados.reduce((total, adicional) => 
      total + (adicional.precoUnitario * adicional.quantidade), 0);
    
    const precoTotal = produto.preco + precoAdicionais;
    
    // Criar observação com os adicionais
    const observacao = adicionaisSelecionados.length > 0
      ? `Adicionais: ${adicionaisSelecionados.map(a => 
          `${a.nome}${a.quantidade > 1 ? ` (${a.quantidade}x)` : ''}`
        ).join(', ')}`
      : '';
    
    // Se for edição, atualizar o item existente
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
      
      // Encontrar onde está o item (salvo ou não salvo)
      const itemIndexSalvo = itensSalvos.findIndex(item => item.id === itemId);
      const itemIndexNaoSalvo = itensNaoSalvos.findIndex(item => item.id === itemId);
      
      if (itemIndexSalvo !== -1) {
        // Atualizar em itensSalvos
        const novosItens = [...itensSalvos];
        novosItens[itemIndexSalvo] = novoItem;
        setItensSalvos(novosItens);
      } else if (itemIndexNaoSalvo !== -1) {
        // Atualizar em itensNaoSalvos
        const novosItens = [...itensNaoSalvos];
        novosItens[itemIndexNaoSalvo] = novoItem;
        setItensNaoSalvos(novosItens);
      }
      
    } else {
      // Se for novo item, criar normalmente
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

  // Função auxiliar para encontrar a categoria correspondente no banco
  const encontrarCategoriaPorNome = (nomeCategoria: string) => {
    return categoriasReais.find(cat => 
      cat.nome.toLowerCase() === nomeCategoria.toLowerCase()
    );
  };

  // Filtrar produtos
  const produtosFiltrados = produtosReais.filter(produto => {
    // Encontrar a categoria correspondente no banco
    const categoriaProduto = encontrarCategoriaPorNome(produto.categoria);
    
    const categoriaProdutoId = categoriaProduto?.id || produto.categoria.toLowerCase().replace(/\s+/g, '-');
    
    const passaCategoria = categoriaAtiva === 'todos' || categoriaProdutoId === categoriaAtiva;
    const passaBusca = produto.nome.toLowerCase().includes(busca.toLowerCase());
    
    return passaCategoria && passaBusca;
  });

  // Função para gerar o título baseado no preset
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

  // Função para gerar subtítulo
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
    {/* Layout: MENOS comanda, MAIS catálogo */}
    <div className="flex h-screen bg-white">
      
      {/* ✅ Coluna esquerda - COMANDA (APENAS 30% da tela) */}
      <div className="w-1/3 flex flex-col h-full border-r border-gray-200">
        {/* Comanda compacta */}
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
      
      {/* ✅ Coluna direita - CATÁLOGO (70% da tela - MAIOR) */}
      <div className="w-2/3 flex flex-col h-full">
        
        {/* ✅ CATÁLOGO MAIOR (mais espaço agora) */}
        <div className="flex-1 overflow-hidden">
          <CatalogoDireita
            produtos={produtosFiltrados}
            categorias={categoriasReais}
            categoriaAtiva={categoriaAtiva}
            busca={busca}
            onSelecionarCategoria={setCategoriaAtiva}
            onBuscar={setBusca}
            onAdicionarProduto={adicionarItem}
            // Passar função auxiliar para encontrar categoria
            encontrarCategoriaPorNome={encontrarCategoriaPorNome}
          />
        </div>
        
        {/* BOTÃO DE SALVAR */}
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

    {/* MODAL DE PAGAMENTO */}
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

    {/* MODAL DE ADICIONAIS */}
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