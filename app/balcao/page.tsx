// app/balcao/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, ArrowLeft, X, Plus, Minus, AlertCircle, Search, ChevronLeft } from 'lucide-react';
import BalcaoPagamentoModal from '@/components/pagamento/BalcaoPagamentoModal';

// Interfaces
interface Produto {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  imagem: string;
}

interface ItemVenda {
  id: number;
  produtoId: string;
  quantidade: number;
  precoUnitario: number;
  produto: Produto;
  observacao: string;
}

interface Categoria {
  id: string;
  nome: string;
  icone: string;
  usaImagem: boolean;
  ordem: number;
  imagem: string;
}

export default function BalcaoPage() {
  const router = useRouter();
  
  // Estados de dados
  const [carregando, setCarregando] = useState(true);
  const [categoriaAtiva, setCategoriaAtiva] = useState('');
  const [busca, setBusca] = useState('');
  const [produtosReais, setProdutosReais] = useState<Produto[]>([]);
  const [categoriasReais, setCategoriasReais] = useState<Categoria[]>([]);
  
  // Estado da venda
  const [itensVenda, setItensVenda] = useState<ItemVenda[]>([]);
  const [caixaStatus, setCaixaStatus] = useState<'aberto' | 'fechado'>('fechado');
  const [usuarioLogado, setUsuarioLogado] = useState<any>(null);
  
  // Estado do modal de pagamento
  const [mostrarModalPagamentoCompleto, setMostrarModalPagamentoCompleto] = useState(false);
  const [processando, setProcessando] = useState(false);

  // Verificar status do caixa
  useEffect(() => {
    const verificarCaixa = async () => {
      try {
        const response = await fetch('/api/caixa/status');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setCaixaStatus(data.data.status || 'fechado');
          }
        }
      } catch (error) {
        console.error('Erro ao verificar caixa:', error);
      }
    };
    
    verificarCaixa();
  }, []);

  // Carregar dados iniciais
  useEffect(() => {
    const carregarDados = async () => {
      try {
        // Carregar produtos
        const produtosResponse = await fetch('/api/produtos?ativos=true');
        if (produtosResponse.ok) {
          const produtosData = await produtosResponse.json();
          if (produtosData.success && produtosData.data) {
            setProdutosReais(produtosData.data.map((produto: any) => ({
              id: produto._id?.toString() || Math.random().toString(),
              nome: produto.nome || 'Produto sem nome',
              preco: produto.precoVenda || produto.preco || 0,
              categoria: produto.categoria?.nome || produto.categoria || 'Sem Categoria',
              imagem: produto.imagem || '/placeholder-product.jpg'
            })));
          }
        }

        // Carregar categorias
        const categoriasResponse = await fetch('/api/categorias?ativas=true');
        if (categoriasResponse.ok) {
          const categoriasData = await categoriasResponse.json();
          
          if (categoriasData.success && categoriasData.data && Array.isArray(categoriasData.data)) {
            const categoriasMapeadas = categoriasData.data.map((categoria: any) => ({
              id: categoria._id?.toString() || categoria.id || '',
              nome: categoria.nome || 'Sem nome',
              descricao: categoria.descricao || '',
              icone: categoria.icone || '📦',
              imagem: categoria.imagem || '',
              usaImagem: Boolean(categoria.usaImagem),
              ordem: categoria.ordem || 999
            })).filter((cat: any) => cat.id);
            
            const categoriasOrdenadas = [...categoriasMapeadas].sort((a, b) => {
              return (a.ordem || 999) - (b.ordem || 999);
            });
            
            setCategoriasReais(categoriasOrdenadas);
            
            const primeiraCategoriaReal = categoriasOrdenadas[0];
            if (primeiraCategoriaReal && primeiraCategoriaReal.id) {
              setCategoriaAtiva(primeiraCategoriaReal.id);
            }
          } else {
            const categoriasFallback = [
              { id: 'bebidas', nome: 'Bebidas', icone: '🥤', usaImagem: false, imagem: '', ordem: 1 },
              { id: 'lanches', nome: 'Lanches', icone: '🍔', usaImagem: false, imagem: '', ordem: 2 },
              { id: 'acompanhamentos', nome: 'Acompanhamentos', icone: '🍟', usaImagem: false, imagem: '', ordem: 3 },
              { id: 'sobremesas', nome: 'Sobremesas', icone: '🍰', usaImagem: false, imagem: '', ordem: 4 },
            ];
            setCategoriasReais(categoriasFallback);
            setCategoriaAtiva('bebidas');
          }
        }

        // Carregar usuário logado
        const userStr = localStorage.getItem('user');
        if (userStr) {
          setUsuarioLogado(JSON.parse(userStr));
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, []);

  // Filtrar produtos
  const produtosFiltrados = produtosReais.filter(produto => {
    if (!categoriaAtiva) {
      return produto.nome.toLowerCase().includes(busca.toLowerCase());
    }
    
    const categoriaSelecionada = categoriasReais.find(c => c.id === categoriaAtiva);
    if (!categoriaSelecionada) return produto.nome.toLowerCase().includes(busca.toLowerCase());
    
    const passaBusca = produto.nome.toLowerCase().includes(busca.toLowerCase());
    const categoriaProduto = produto.categoria?.toLowerCase().trim();
    const nomeCategoriaSelecionada = categoriaSelecionada.nome?.toLowerCase().trim();
    const passaCategoria = categoriaProduto === nomeCategoriaSelecionada;
    
    return passaBusca && passaCategoria;
  });

  // Funções da venda
  const adicionarItem = (produtoId: string) => {
    const produto = produtosReais.find(p => p.id === produtoId);
    if (!produto) return;

    const itemExistenteIndex = itensVenda.findIndex(item => 
      item.produtoId === produtoId && 
      item.observacao === ''
    );

    if (itemExistenteIndex >= 0) {
      const novosItens = [...itensVenda];
      novosItens[itemExistenteIndex] = {
        ...novosItens[itemExistenteIndex],
        quantidade: novosItens[itemExistenteIndex].quantidade + 1
      };
      setItensVenda(novosItens);
    } else {
      const novoItem: ItemVenda = {
        id: Date.now() + Math.random(),
        produtoId,
        quantidade: 1,
        precoUnitario: produto.preco,
        produto,
        observacao: ''
      };
      setItensVenda(prev => [...prev, novoItem]);
    }
  };

  const removerItem = (itemId: number) => {
    setItensVenda(prev => prev.filter(item => item.id !== itemId));
  };

  const atualizarQuantidade = (itemId: number, novaQuantidade: number) => {
    if (novaQuantidade < 1) {
      removerItem(itemId);
      return;
    }

    setItensVenda(prev => prev.map(item => 
      item.id === itemId ? { ...item, quantidade: novaQuantidade } : item
    ));
  };

  const limparVenda = () => {
    if (itensVenda.length > 0 && window.confirm('Tem certeza que deseja limpar todos os itens?')) {
      setItensVenda([]);
    }
  };

  const totalVenda = itensVenda.reduce((sum, item) => 
    sum + (item.precoUnitario * item.quantidade), 0
  );

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const podeAcessarBalcao = () => {
    if (!usuarioLogado?.permissoes?.canAccessBalcao) {
      alert('Você não tem permissão para acessar o balcão');
      return false;
    }
    
    if (caixaStatus !== 'aberto') {
      alert('O caixa precisa estar aberto para realizar vendas no balcão');
      return false;
    }
    
    return true;
  };

  const prepararParaPagamento = () => {
    if (!podeAcessarBalcao()) return;
    
    if (itensVenda.length === 0) {
      alert('Adicione itens antes de finalizar a venda');
      return;
    }
    
    setMostrarModalPagamentoCompleto(true);
  };

  const handleFinalizarPagamentoBalcao = async (data: any) => {
    console.log('✅ Venda do balcão finalizada:', data);
    setItensVenda([]);
    setMostrarModalPagamentoCompleto(false);
    
    // Mostrar alerta com os detalhes da venda
    const formas = data.formasPagamento?.join(', ') || 'Não especificado';
    alert(`✅ Venda do balcão realizada com sucesso!\n\n` +
          `Número: ${data.numero}\n` +
          `Total: R$ ${data.total.toFixed(2)}\n` +
          `Formas de pagamento: ${formas}\n` +
          `Operador: ${usuarioLogado?.nome || 'Balcão'}`);
  };

  // Tela de carregamento
  if (carregando) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Carregando balcão...</p>
        </div>
      </div>
    );
  }

  // Verificar permissões e caixa
  if (!usuarioLogado?.permissoes?.canAccessBalcao) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
          <div className="bg-red-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Acesso Negado</h2>
          <p className="text-gray-600 mb-6">Você não tem permissão para acessar o balcão.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (caixaStatus !== 'aberto') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
          <div className="bg-yellow-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Caixa Fechado</h2>
          <p className="text-gray-600 mb-4">O caixa precisa estar aberto para realizar vendas no balcão.</p>
          <div className="flex gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Voltar
            </button>
            <button
              onClick={() => router.push('/caixa/abertura')}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Abrir Caixa
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b shrink-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingBag className="h-6 w-6 text-blue-600" />
                  Venda de Balcão
                </h1>
                <p className="text-gray-600 text-sm">Venda rápida - Caixa aberto</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Operador</p>
                <p className="font-medium">{usuarioLogado?.nome || 'Usuário'}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="container mx-auto px-4 py-4 flex-1 flex flex-col min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
          
          {/* Coluna da esquerda - Itens da venda */}
          <div className="lg:col-span-1 flex flex-col">
            <div className="bg-white rounded-xl shadow-sm border p-4 flex flex-col flex-1 min-h-0">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <h2 className="text-lg font-bold text-gray-900">Itens da Venda</h2>
                {itensVenda.length > 0 && (
                  <button
                    onClick={limparVenda}
                    className="text-sm text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded transition-colors"
                  >
                    Limpar tudo
                  </button>
                )}
              </div>
              
              {itensVenda.length === 0 ? (
                <div className="text-center py-8 flex-1 flex flex-col items-center justify-center">
                  <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mb-3 flex items-center justify-center">
                    <ShoppingBag className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-base font-medium text-gray-700 mb-1">Nenhum item adicionado</h3>
                  <p className="text-gray-500 text-sm">Clique nos produtos ao lado</p>
                </div>
              ) : (
                <>
                  {/* Lista de itens */}
                  <div className="space-y-3 flex-1 overflow-y-auto pr-2 min-h-0 mb-4" style={{ maxHeight: 'calc(100vh - 400px)' }}>
                    {itensVenda.map((item) => (
                      <div key={item.id} className="bg-gray-50 rounded-lg p-3 border hover:bg-gray-100 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm truncate">{item.produto.nome}</h4>
                            <p className="text-xs text-gray-600">{formatarMoeda(item.precoUnitario)}</p>
                          </div>
                          <button
                            onClick={() => removerItem(item.id)}
                            className="text-gray-400 hover:text-red-600 ml-2 flex-shrink-0"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => atualizarQuantidade(item.id, item.quantidade - 1)}
                              className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                            >
                              <Minus className="h-2 w-2" />
                            </button>
                            <span className="w-6 text-center font-medium text-gray-900 text-sm">{item.quantidade}</span>
                            <button
                              onClick={() => atualizarQuantidade(item.id, item.quantidade + 1)}
                              className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors"
                            >
                              <Plus className="h-2 w-2" />
                            </button>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-bold text-blue-600 text-base">
                              {formatarMoeda(item.precoUnitario * item.quantidade)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.quantidade} × {formatarMoeda(item.precoUnitario)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Resumo */}
                  <div className="pt-4 border-t shrink-0 bg-white">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Total</span>
                        <span className="text-blue-600 font-extrabold text-xl">{formatarMoeda(totalVenda)}</span>
                      </div>
                      
                      <button
                        onClick={prepararParaPagamento}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-bold hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200"
                        disabled={itensVenda.length === 0}
                      >
                        FINALIZAR VENDA
                      </button>
                      
                      {/* Botão de Voltar */}
                      <button
                        onClick={() => router.push('/dashboard')}
                        className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center justify-center gap-2 mt-2"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        VOLTAR AO DASHBOARD
                      </button>
                      
                      <p className="text-xs text-gray-500 text-center pt-1">
                        {itensVenda.length} item{itensVenda.length !== 1 ? 's' : ''} na venda
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Coluna da direita - Catálogo de produtos */}
          <div className="lg:col-span-2 flex flex-col min-h-0">
            <div className="bg-white rounded-xl shadow-sm border flex flex-col flex-1 min-h-0">
              
              {/* Cabeçalho do catálogo */}
              <div className="p-4 border-b shrink-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      placeholder="Buscar produtos..."
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
                
                {/* Filtros de categoria */}
                <div className="mt-3">
                  <div className="flex overflow-x-auto pb-2 gap-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {categoriasReais.map((categoria) => (
                      <button
                        key={categoria.id}
                        onClick={() => setCategoriaAtiva(categoria.id)}
                        className={`
                          flex items-center gap-2 px-3 py-2 rounded-lg 
                          transition-all duration-200 whitespace-nowrap flex-shrink-0
                          ${categoria.id === categoriaAtiva
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }
                        `}
                      >
                        {categoria.usaImagem && categoria.imagem ? (
                          <div className="w-6 h-6 flex items-center justify-center">
                            <img
                              src={categoria.imagem}
                              alt={categoria.nome}
                              className="w-full h-full object-cover rounded"
                            />
                          </div>
                        ) : (
                          <span className="text-sm">{categoria.icone || '📦'}</span>
                        )}
                        <span className="text-xs font-medium">{categoria.nome}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Grid de produtos */}
              <div className="flex-1 overflow-y-auto p-4 min-h-0">
                {produtosFiltrados.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                      <ShoppingBag className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-base font-medium text-gray-700 mb-1">Nenhum produto encontrado</h3>
                    <p className="text-gray-500 text-sm">
                      {busca ? `Nenhum resultado para "${busca}"` : 'Selecione uma categoria'}
                    </p>
                    {categoriaAtiva && (
                      <p className="text-xs text-blue-600 mt-2">
                        Categoria: {categoriasReais.find(c => c.id === categoriaAtiva)?.nome}
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Contador de produtos */}
                    {categoriaAtiva && (
                      <div className="mb-4 pb-3 border-b">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{categoriasReais.find(c => c.id === categoriaAtiva)?.icone || '📦'}</span>
                            <h3 className="font-bold text-gray-900">
                              {categoriasReais.find(c => c.id === categoriaAtiva)?.nome}
                            </h3>
                          </div>
                          <span className="text-sm text-gray-600">
                            {produtosFiltrados.length} produto{produtosFiltrados.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Grid compacto */}
                    <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                      {produtosFiltrados.map((produto) => (
                        <div
                          key={produto.id}
                          className="bg-gray-50 rounded-lg border hover:border-blue-300 hover:shadow-sm transition-all duration-200 cursor-pointer group flex flex-col"
                          onClick={() => adicionarItem(produto.id)}
                        >
                          {/* Imagem do produto */}
                          <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden flex items-center justify-center">
                            {produto.imagem && produto.imagem !== '/placeholder-product.jpg' ? (
                              <img
                                src={produto.imagem}
                                alt={produto.nome}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                                <span className="text-2xl">🍽️</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Informações do produto */}
                          <div className="p-2 flex flex-col flex-1">
                            <h3 className="font-medium text-gray-900 text-xs line-clamp-2 mb-1 min-h-[2rem]">
                              {produto.nome}
                            </h3>
                            
                            <div className="mt-auto">
                              <div className="flex items-center justify-between">
                                <span className="text-blue-600 font-bold text-xs">
                                  {formatarMoeda(produto.preco)}
                                </span>
                                <div className="bg-blue-100 text-blue-600 rounded-full p-1 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                  <Plus className="h-2.5 w-2.5" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              {/* Contador de produtos */}
              <div className="border-t p-3 bg-gray-50 shrink-0">
                <div className="flex justify-between items-center text-xs text-gray-600">
                  <span>
                    {produtosFiltrados.length} produto{produtosFiltrados.length !== 1 ? 's' : ''} encontrado{produtosFiltrados.length !== 1 ? 's' : ''}
                  </span>
                  <span className="text-blue-600 font-medium">
                    {categoriasReais.find(c => c.id === categoriaAtiva)?.nome || 'Todas as categorias'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL DE PAGAMENTO COMPLETO DO BALCÃO */}
      {mostrarModalPagamentoCompleto && (
        <BalcaoPagamentoModal
          itens={itensVenda.map(item => ({
            ...item,
            produto: {
              nome: item.produto.nome,
              categoria: item.produto.categoria
            }
          }))}
          total={totalVenda}
          onClose={() => setMostrarModalPagamentoCompleto(false)}
          onConfirmar={handleFinalizarPagamentoBalcao}
          operador={usuarioLogado?.nome || 'Balcão'}
        />
      )}
    </div>
  );
}