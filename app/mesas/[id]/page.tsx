// app/mesas/[id]/page.tsx - VERSÃO FINAL CORRIGIDA
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ComandaEsquerda from '@/components/comanda/ComandaEsquerda';
import CatalogoDireita from '@/components/comanda/CatalogoDireita';
import ComandaLayout from '@/components/comanda/ComandaLayout';

// Use as mesmas interfaces dos componentes (ou crie um arquivo de tipos)
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
  produto: any; // Use any aqui para compatibilidade
  observacao: string;
}

interface ComandaDB {
  _id: string;
  mesaId: string;
  numeroMesa: string;
  itens: ItemComanda[];
  total: number;
  status: string;
  criadoEm: string;
  atualizadoEm: string;
}

interface Categoria {
  id: string;
  nome: string;
  icone: string;
}

// Funções auxiliares
async function fetchComanda(mesaId: string): Promise<ComandaDB | null> {
  try {
    const response = await fetch(`/api/comandas?mesaId=${mesaId}`);
    const data = await response.json();
    
    if (data.success && data.data) {
      return data.data;
    }
    return null;
  } catch (error) {
    console.error('Erro ao buscar comanda:', error);
    return null;
  }
}

async function salvarComandaNoDB(mesaId: string, numeroMesa: string, itens: ItemComanda[], total: number) {
  try {
    // Converter itens para formato de salvamento (sem o objeto produto completo)
    const itensParaSalvar = itens.map(item => ({
      produtoId: item.produtoId,
      quantidade: item.quantidade,
      precoUnitario: item.precoUnitario,
      observacao: item.observacao
    }));
    
    const response = await fetch('/api/comandas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mesaId,
        numeroMesa,
        itens: itensParaSalvar,
        total,
      }),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao salvar comanda:', error);
    return { success: false, error };
  }
}

async function fetchProdutosReais(): Promise<Produto[]> {
  try {
    const response = await fetch('/api/produtos?ativos=true', {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error('Erro ao buscar produtos');
    }
    
    const data = await response.json();
    
    if (data.success && data.data) {
      // DEBUG: Ver produtos
      console.log('📦 PRODUTOS DA API:', data.data.map((p: any) => ({
        nome: p.nome,
        categoria: p.categoria,
        temImagem: !!p.imagem
      })));
      
      return data.data.map((produto: any) => ({
        id: produto._id.toString(),
        nome: produto.nome,
        preco: produto.precoVenda || produto.preco || 0,
        categoria: produto.categoria || 'Sem Categoria', // GARANTIR que tenha categoria
        imagem: produto.imagem || '/placeholder-product.jpg'
      }));
    }
    return [];
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return [];
  }
}

export default function ComandaPage() {
  const params = useParams();
  const router = useRouter();
  const mesaId = params.id as string;
  
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
  const [categoriasReais, setCategoriasReais] = useState<Categoria[]>([
    { id: 'todos', nome: 'Todos', icone: '📦' }
  ]);

  useEffect(() => {
    async function carregarComanda() {
      setCarregando(true);
      
      // 1. Carregar produtos REAIS
      const produtosDB = await fetchProdutosReais();
      setProdutosReais(produtosDB);
      
      console.log('🛒 PRODUTOS CARREGADOS:', produtosDB.length);
const categoriasProdutos = produtosDB.map(p => p.categoria).filter(Boolean);
const categoriasUnicasProdutos = Array.from(new Set(categoriasProdutos));
console.log('🏷️ CATEGORIAS DOS PRODUTOS:', categoriasUnicasProdutos);
      
      // 2. Extrair categorias únicas
      const categoriasUnicas: string[] = [];
      produtosDB.forEach(produto => {
        if (produto.categoria && !categoriasUnicas.includes(produto.categoria)) {
          categoriasUnicas.push(produto.categoria);
        }
      });
      
      console.log('📊 CATEGORIAS ÚNICAS:', categoriasUnicas);
      
      const icones = ['🥤', '🍔', '🍟', '🍰', '☕', '🍕', '🌭', '🥗', '🍣', '🥪'];
      const categoriasFormatadas: Categoria[] = categoriasUnicas.map((cat, index) => ({
        id: cat.toLowerCase().replace(/\s+/g, '-'), // "Bebidas" vira "bebidas"
        nome: cat,
        icone: icones[index] || '📦'
      }));
      
      console.log('🎯 CATEGORIAS FORMATADAS:', categoriasFormatadas);
      
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
      
      // 4. Buscar comanda
      const comandaDB = await fetchComanda(mesaId);
      
      if (comandaDB) {
        setComandaId(comandaDB._id);
        
        // Linkar itens da comanda com produtos reais
        const itensComProdutos: ItemComanda[] = comandaDB.itens.map(item => {
          const produtoEncontrado = produtosDB.find(p => p.id === item.produtoId);
          
          if (produtoEncontrado) {
            return {
              ...item,
              produto: produtoEncontrado
            };
          } else {
            // Fallback para produto não encontrado
            return {
              ...item,
              produto: {
                id: item.produtoId,
                nome: 'Produto não encontrado',
                preco: item.precoUnitario,
                categoria: 'desconhecida',
                imagem: '/placeholder-product.jpg'
              }
            };
          }
        });
        
        setItensSalvos(itensComProdutos);
      } else {
        setItensSalvos([]);
        setComandaId('');
      }
      
      setCarregando(false);
    }
    
    carregarComanda();
  }, [mesaId]);

  // Calcular totais
  const todosItens = [...itensSalvos, ...itensNaoSalvos];
  const totalComanda = todosItens.reduce((sum, item) => 
    sum + (item.precoUnitario * item.quantidade), 0
  );
  const restantePagar = totalComanda - totalPago;

  // Funções da comanda
  const adicionarItem = (produtoId: string) => {
    const produto = produtosReais.find(p => p.id === produtoId);
    if (!produto) {
      console.error('Produto não encontrado:', produtoId);
      return;
    }
    
    const itemExistente = itensNaoSalvos.find(item => item.produtoId === produtoId);
    
    if (itemExistente) {
      setItensNaoSalvos(itensNaoSalvos.map(item => 
        item.id === itemExistente.id 
          ? { ...item, quantidade: item.quantidade + 1 }
          : item
      ));
    } else {
      const novoItem: ItemComanda = {
        id: Date.now(),
        produtoId,
        quantidade: 1,
        precoUnitario: produto.preco,
        produto,
        observacao: ''
      };
      setItensNaoSalvos([...itensNaoSalvos, novoItem]);
    }
    
    setModificado(true);
  };

  const removerItem = (itemId: number, tipo: 'salvo' | 'naoSalvo') => {
    if (tipo === 'salvo') {
      setItensSalvos(itensSalvos.filter(item => item.id !== itemId));
      setModificado(true);
    } else {
      setItensNaoSalvos(itensNaoSalvos.filter(item => item.id !== itemId));
      if (itensNaoSalvos.length <= 1) setModificado(true);
    }
  };

  const atualizarQuantidade = (itemId: number, novaQuantidade: number, tipo: 'salvo' | 'naoSalvo') => {
    const lista = tipo === 'salvo' ? itensSalvos : itensNaoSalvos;
    const setLista = tipo === 'salvo' ? setItensSalvos : setItensNaoSalvos;
    
    if (novaQuantidade < 1) {
      removerItem(itemId, tipo);
      return;
    }
    
    setLista(lista.map(item => 
      item.id === itemId 
        ? { ...item, quantidade: novaQuantidade }
        : item
    ));
    
    setModificado(true);
  };

  const atualizarObservacao = (itemId: number, observacao: string, tipo: 'salvo' | 'naoSalvo') => {
    const lista = tipo === 'salvo' ? itensSalvos : itensNaoSalvos;
    const setLista = tipo === 'salvo' ? setItensSalvos : setItensNaoSalvos;
    
    setLista(lista.map(item => 
      item.id === itemId 
        ? { ...item, observacao }
        : item
    ));
    
    setModificado(true);
  };

  const salvarItens = async () => {
    if (itensNaoSalvos.length === 0 && !modificado) {
      alert('Não há alterações para salvar!');
      return;
    }
    
    let todosItensParaSalvar: ItemComanda[] = [];
    
    if (itensNaoSalvos.length > 0) {
      const itensAgrupados = [...itensSalvos, ...itensNaoSalvos].reduce((acc: ItemComanda[], item) => {
        const itemExistente = acc.find(i => 
          i.produtoId === item.produtoId && i.observacao === item.observacao
        );
        
        if (itemExistente) {
          itemExistente.quantidade += item.quantidade;
        } else {
          acc.push({ ...item });
        }
        
        return acc;
      }, []);
      
      todosItensParaSalvar = itensAgrupados;
    } else {
      todosItensParaSalvar = itensSalvos;
    }
    
    const resultado = await salvarComandaNoDB(
      mesaId,
      mesa?.numero || mesaId,
      todosItensParaSalvar,
      totalComanda
    );
    
    if (resultado.success) {
      setItensSalvos(todosItensParaSalvar);
      setItensNaoSalvos([]);
      setModificado(false);
      if (resultado.data?._id) {
        setComandaId(resultado.data._id);
      }
      
      alert('Comanda salva com sucesso!');
    } else {
      alert('Erro ao salvar comanda: ' + resultado.error);
    }
  };

  const descartarAlteracoes = () => {
    if (!modificado && itensNaoSalvos.length === 0) return;
    
    if (confirm(`Descartar alterações não salvas?`)) {
      fetchComanda(mesaId).then(async (comandaDB) => {
        if (comandaDB) {
          const produtosDB = await fetchProdutosReais();
          
          const itensComProdutos: ItemComanda[] = comandaDB.itens.map(item => {
            const produtoEncontrado = produtosDB.find(p => p.id === item.produtoId);
            
            if (produtoEncontrado) {
              return {
                ...item,
                produto: produtoEncontrado
              };
            } else {
              return {
                ...item,
                produto: {
                  id: item.produtoId,
                  nome: 'Produto não encontrado',
                  preco: item.precoUnitario,
                  categoria: 'desconhecida',
                  imagem: '/placeholder-product.jpg'
                }
              };
            }
          });
          setItensSalvos(itensComProdutos);
        } else {
          setItensSalvos([]);
        }
        setItensNaoSalvos([]);
        setModificado(false);
      });
    }
  };

  const limparComanda = async () => {
    if (itensSalvos.length === 0 && itensNaoSalvos.length === 0) return;
    
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

  const fecharConta = () => {
    if (modificado) {
      alert('Salve as alterações antes de fechar a conta!');
      return;
    }
    alert('Abrindo modal de pagamento...');
  };

  const voltarDashboard = () => {
    if (modificado) {
      if (!confirm('Tem alterações não salvas. Deseja sair mesmo assim?')) {
        return;
      }
    }
    router.push('/dashboard');
  };

  // Filtrar produtos - CORRIGIDO! ⚠️
  const produtosFiltrados = produtosReais.filter(produto => {
    // Converter categoria do produto para o mesmo formato do ID
    const categoriaProdutoId = produto.categoria.toLowerCase().replace(/\s+/g, '-');
    const passaCategoria = categoriaAtiva === 'todos' || categoriaProdutoId === categoriaAtiva;
    
    const passaBusca = produto.nome.toLowerCase().includes(busca.toLowerCase());
    
    // DEBUG
    if (categoriaAtiva !== 'todos') {
      console.log(`🔍 ${produto.nome} | Categoria: ${produto.categoria} (${categoriaProdutoId}) | Ativa: ${categoriaAtiva} | Passa: ${passaCategoria}`);
    }
    
    return passaCategoria && passaBusca;
  });

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando comanda da mesa {mesaId}...</p>
        </div>
      </div>
    );
  }

  return (
    <ComandaLayout>
      {/* Breadcrumb */}
      <div className="mb-4">
        <nav className="flex items-center text-sm text-gray-600">
          <button 
            onClick={voltarDashboard}
            className="hover:text-gray-900"
          >
            Dashboard
          </button>
          <span className="mx-2">/</span>
          <span className="font-medium text-gray-900">{mesa?.nome}</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-800 mt-1">
          Comanda: {mesa?.nome} {comandaId && `(ID: ${comandaId.substring(0, 8)}...)`}
        </h1>
      </div>

      {/* Layout de duas colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-180px)]">
        {/* Coluna esquerda - Comanda */}
        <div className="lg:col-span-1 flex flex-col h-[70vh] min-h-[500px]">
          <div className="flex-1 overflow-hidden flex flex-col">
            <ComandaEsquerda
              mesa={mesa}
              itensSalvos={itensSalvos as any}
              itensNaoSalvos={itensNaoSalvos as any}
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
              onFecharConta={fecharConta}
              onVoltarDashboard={voltarDashboard}
              comandaId={comandaId || `mesa-${mesaId}-${Date.now()}`}
            />
          </div>
        </div>

        {/* Coluna direita - Catálogo */}
        <div className="lg:col-span-2 flex flex-col relative">
          <div className="flex-1 overflow-hidden">
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
          
          {/* Botão Salvar Fixo */}
          {modificado && (
            <div className="sticky bottom-0 left-0 right-0 z-50 mt-4">
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 shadow-xl border border-green-400">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-white/20 p-3 rounded-xl mr-4">
                      <span className="text-white text-2xl">💾</span>
                    </div>
                    <div>
                      <p className="font-bold text-white text-lg">
                        {itensNaoSalvos.length > 0 
                          ? `${itensNaoSalvos.length} item(s) aguardando para salvar`
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
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="mt-4 pt-4 border-t border-gray-200 text-center text-gray-500 text-sm">
        <p>Comanda: {mesa?.nome} • {todosItens.length} itens • Total: R$ {totalComanda.toFixed(2)} • Status: {comandaId ? 'Salva no banco' : 'Não salva'}</p>
      </div>
    </ComandaLayout>
  );
}