// app/mesas/[id]/page.tsx - VERSÃO COMPLETA COM TODAS FUNÇÕES
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ComandaEsquerda from '@/components/comanda/ComandaEsquerda';
import CatalogoDireita from '@/components/comanda/CatalogoDireita';
import ComandaLayout from '@/components/comanda/ComandaLayout';
import PagamentoModal from '@/components/pagamento/PagamentoModal';

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

// Funções auxiliares para API
async function fetchComanda(mesaId: string): Promise<ComandaDB | null> {
  try {
    const response = await fetch(`/api/comandas?mesaId=${mesaId}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.success ? data.data : null;
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
    
    const response = await fetch('/api/comandas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mesaId,
        numeroMesa,
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

export default function ComandaPage() {
  const params = useParams();
  const router = useRouter();
  const mesaId = params.id as string;
  
  // Estados
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

  // Carregar dados iniciais
  useEffect(() => {
    async function carregarComanda() {
      setCarregando(true);
      
      try {
        // 1. Carregar produtos
        const produtosDB = await fetchProdutosReais();
        setProdutosReais(produtosDB);
        
        // 2. Extrair categorias dos produtos
        const categoriasUnicas = Array.from(new Set(produtosDB.map(p => p.categoria).filter(Boolean)));
        const icones = ['🥤', '🍔', '🍟', '🍰', '☕', '🍕', '🌭', '🥗', '🍣', '🥪'];
        
        const categoriasFormatadas = categoriasUnicas.map((cat, index) => ({
          id: cat.toLowerCase().replace(/\s+/g, '-'),
          nome: cat,
          icone: icones[index] || '📦'
        }));
        
        setCategoriasReais([
          { id: 'todos', nome: 'Todos', icone: '📦' },
          ...categoriasFormatadas
        ]);
        
        // 3. Mesa mockada
        const mesaMock = {
          id: mesaId,
          numero: mesaId.padStart(2, '0'),
          nome: `Mesa ${mesaId.padStart(2, '0')}`,
          status: 'ocupada',
          capacidade: 4,
        };
        setMesa(mesaMock);
        
        // 4. Buscar comanda existente
        const comandaDB = await fetchComanda(mesaId);
        if (comandaDB) {
          setComandaId(comandaDB._id);
          
          // Converter itens da comanda para o formato local
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

  // Calcular totais
  const todosItens = [...itensSalvos, ...itensNaoSalvos];
  const totalComanda = todosItens.reduce((sum, item) => 
    sum + (item.precoUnitario * item.quantidade), 0
  );
  const restantePagar = totalComanda - totalPago;

  // ========== FUNÇÕES DA COMANDA ==========

  // Adiciona SEMPRE como novo item separado (até salvar)
  const adicionarItem = (produtoId: string) => {
    const produto = produtosReais.find(p => p.id === produtoId);
    if (!produto) return;
    
    // Criar NOVO item (sempre separado)
    const novoItem: ItemComanda = {
      id: Date.now() + Math.random(), // ID único sempre
      produtoId,
      quantidade: 1,
      precoUnitario: produto.preco,
      produto,
      observacao: '',
      isNew: true // Sempre marca como novo
    };
    
    // SEMPRE adiciona como novo item separado
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

  // Função para atualizar quantidade (usada pelo modal de remoção)
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
    
    // Salvar no banco
    const resultado = await salvarComandaNoDB(
      mesaId,
      mesa?.numero || mesaId,
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
      
      // ✅ NOVO: Forçar atualização do dashboard
      // Enviar evento para atualizar o dashboard
      if (typeof window !== 'undefined') {
        // Disparar evento customizado
        window.dispatchEvent(new CustomEvent('comanda-atualizada', {
          detail: { mesaId, total: totalAgrupado }
        }));
        
        // Também salvar no localStorage para o dashboard pegar
        localStorage.setItem(`comanda_atualizada_${mesaId}`, 
          JSON.stringify({
            total: totalAgrupado,
            quantidadeItens: itensParaSalvar.length,
            timestamp: new Date().toISOString()
          })
        );
      }
      
      alert(`Comanda salva com sucesso!\n${itensNaoSalvos.length} item(s) foram agrupados.`);
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
      const resultado = await salvarComandaNoDB(mesaId, mesa?.numero || mesaId, [], 0);
      
      if (resultado.success) {
        setItensSalvos([]);
        setItensNaoSalvos([]);
        setTotalPago(0);
        setModificado(false);
        alert('Comanda limpa com sucesso!');
      }
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
    setTotalPago(totalComanda); // Marca como totalmente pago
    setMostrarModalPagamento(false);
    
    // Voltar para dashboard após 1.5 segundos
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

  // Filtrar produtos
  const produtosFiltrados = produtosReais.filter(produto => {
    const categoriaProdutoId = produto.categoria.toLowerCase().replace(/\s+/g, '-');
    const passaCategoria = categoriaAtiva === 'todos' || categoriaProdutoId === categoriaAtiva;
    const passaBusca = produto.nome.toLowerCase().includes(busca.toLowerCase());
    return passaCategoria && passaBusca;
  });

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
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">PDV - {mesa?.nome}</h1>
            <p className="text-gray-600">Sistema de atendimento</p>
          </div>
          <button
            onClick={voltarDashboard}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
          >
            ← Voltar para Dashboard
          </button>
        </div>
      </div>

      {/* Layout de duas colunas */}
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)] min-h-0">
        {/* Coluna esquerda - Comanda PDV */}
        <div className="lg:w-1/4 flex flex-col min-h-0">
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
            onLimparComanda={limparComanda}
            onImprimirPrevia={imprimirPrevia}
            onFecharConta={handleFecharConta}
            onVoltarDashboard={voltarDashboard}
            comandaId={comandaId}
            onMostrarModalPagamento={() => setMostrarModalPagamento(true)}
          />
        </div>

        {/* Coluna direita - Catálogo PDV */}
        <div className="lg:w-3/4 flex flex-col min-h-0">
          <div className="flex-1 min-h-0">
            <CatalogoDireita
              produtos={produtosFiltrados}
              categorias={categoriasReais}
              categoriaAtiva={categoriaAtiva}
              busca={busca}
              onSelecionarCategoria={setCategoriaAtiva}
              onBuscar={setBusca}
              onAdicionarProduto={adicionarItem}
            />
          </div>
          
          {/* BOTÃO DE SALVAR FIXO NA BASE DO CATÁLOGO */}
          {modificado && (
            <div className="mt-4 p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-white/20 p-3 rounded-xl mr-4">
                    <span className="text-white text-2xl">💾</span>
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg">
                      {itensNaoSalvos.length > 0 
                        ? `${itensNaoSalvos.length} item(s) não salvos`
                        : 'Alterações na comanda não salvas'
                      }
                    </p>
                    <p className="text-green-100 text-sm">
                      Salve as alterações para persistir no banco de dados
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={descartarAlteracoes}
                    className="px-5 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 border border-white/30 font-medium"
                  >
                    Descartar
                  </button>
                  <button
                    onClick={salvarItens}
                    className="px-6 py-3 bg-white text-green-600 font-bold rounded-lg hover:bg-gray-100 shadow flex items-center gap-3"
                  >
                    <span className="text-xl">💾</span>
                    SALVAR NO BANCO
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE PAGAMENTO COMPLETO */}
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
    </ComandaLayout>
  );
}
