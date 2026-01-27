// app/configuracao/produtos/page.tsx - COM PERMISSÃO
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Package, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Filter,
  Eye,
  EyeOff,
  Tag,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  AlertCircle
} from 'lucide-react';

interface Produto {
  _id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria: string;
  imagem: string;
  ativo: boolean;
  adicionais: string[];
  criadoEm: string;
}

interface UsuarioLogado {
  _id: string;
  email: string;
  nome: string;
  role: string;
  permissoes: {
    canManageProducts?: boolean;
    [key: string]: boolean | undefined;
  };
}

type OrdenacaoCampo = 'nome' | 'preco' | 'categoria' | 'criadoEm';
type DirecaoOrdenacao = 'asc' | 'desc';

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [ordenacao, setOrdenacao] = useState<OrdenacaoCampo>('nome');
  const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<DirecaoOrdenacao>('asc');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  
  // ✅ NOVO: Estado para usuário logado
  const [usuarioLogado, setUsuarioLogado] = useState<UsuarioLogado | null>(null);
  const [carregandoPermissoes, setCarregandoPermissoes] = useState(true);

  // ✅ NOVO: Carregar usuário logado
  useEffect(() => {
    const carregarUsuario = () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          setUsuarioLogado(user);
        }
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
      } finally {
        setCarregandoPermissoes(false);
      }
    };

    carregarUsuario();
  }, []);

  // ✅ NOVO: Função de verificação de permissões
  const temPermissao = (permissao: string): boolean => {
    if (!usuarioLogado) return false;
    
    // Admin tem todas as permissões
    if (usuarioLogado.role === 'admin') return true;
    
    // Verifica permissão específica
    return usuarioLogado.permissoes[permissao] === true;
  };

  // ✅ NOVO: Verificar se tem permissão para gerenciar produtos
  const podeGerenciarProdutos = temPermissao('canManageProducts');

  // Carregar dados quando filtros mudarem
  useEffect(() => {
    if (usuarioLogado !== null) { // Esperar até o usuário ser carregado
      carregarDados();
    }
  }, [filtroCategoria, mostrarInativos, filtroStatus, usuarioLogado]);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      setErroCarregamento(null);
      
      // Construir query string
      const query = new URLSearchParams();
      if (filtroCategoria !== 'todas') query.append('categoria', filtroCategoria);
      if (!mostrarInativos) query.append('ativos', 'true');
      if (filtroStatus !== 'todos') query.append('status', filtroStatus);
      
      const responseProdutos = await fetch(`/api/produtos?${query}`, {
        cache: 'no-store'
      });
      
      if (!responseProdutos.ok) {
        throw new Error('Erro ao carregar produtos');
      }
      
      const dataProdutos = await responseProdutos.json();
      
      if (dataProdutos.success) {
        setProdutos(dataProdutos.data);
        
        // Extrair categorias únicas
        const cats: string[] = Array.from(
          new Set(dataProdutos.data.map((p: Produto) => p.categoria))
        ) as string[];
        setCategorias(cats);
      } else {
        throw new Error(dataProdutos.error || 'Erro desconhecido ao carregar produtos');
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setErroCarregamento('Não foi possível carregar os produtos. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  // ✅ NOVO: Tela de carregamento de permissões
  if (carregandoPermissoes) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-gray-600">Carregando permissões...</span>
        </div>
      </div>
    );
  }

  // ✅ NOVO: Verificar se tem permissão para acessar esta página
  if (!podeGerenciarProdutos) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="bg-red-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Package className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Acesso Negado</h2>
          <p className="text-gray-600 mb-6">
            Você não tem permissão para gerenciar produtos.
            {usuarioLogado && (
              <span className="block mt-2 text-sm text-gray-500">
                Função: {usuarioLogado.role.toUpperCase()}
              </span>
            )}
          </p>
          <Link
            href="/configuracao"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Voltar para Configurações
          </Link>
        </div>
      </div>
    );
  }

  // Filtrar produtos
  const produtosFiltrados = produtos.filter(produto => {
    const buscaMatch = 
      produto.nome.toLowerCase().includes(busca.toLowerCase()) ||
      produto.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      produto.categoria.toLowerCase().includes(busca.toLowerCase());
    
    const statusMatch = filtroStatus === 'todos' || 
      (filtroStatus === 'ativo' && produto.ativo) ||
      (filtroStatus === 'inativo' && !produto.ativo);
    
    return buscaMatch && statusMatch;
  });

  // Ordenar produtos
  const produtosOrdenados = [...produtosFiltrados].sort((a, b) => {
    let valorA: any = a[ordenacao];
    let valorB: any = b[ordenacao];
    
    if (ordenacao === 'criadoEm') {
      valorA = new Date(valorA).getTime();
      valorB = new Date(valorB).getTime();
    }
    
    if (typeof valorA === 'string' && typeof valorB === 'string') {
      return direcaoOrdenacao === 'asc' 
        ? valorA.localeCompare(valorB, 'pt-BR')
        : valorB.localeCompare(valorA, 'pt-BR');
    }
    
    if (typeof valorA === 'number' && typeof valorB === 'number') {
      return direcaoOrdenacao === 'asc' ? valorA - valorB : valorB - valorA;
    }
    
    return 0;
  });

  // Paginar produtos
  const indiceInicial = (paginaAtual - 1) * itensPorPagina;
  const indiceFinal = paginaAtual * itensPorPagina;
  const produtosPaginados = produtosOrdenados.slice(indiceInicial, indiceFinal);
  const totalPaginas = Math.ceil(produtosOrdenados.length / itensPorPagina);

  const toggleAtivo = async (produto: Produto) => {
    if (!podeGerenciarProdutos) {
      alert('Você não tem permissão para alterar o status de produtos!');
      return;
    }
    
    const acao = produto.ativo ? 'desativar' : 'ativar';
    
    if (!confirm(`Deseja ${acao} o produto "${produto.nome}"?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/produtos/${produto._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !produto.ativo })
      });
      
      if (response.ok) {
        carregarDados();
      } else {
        const data = await response.json();
        alert(data.error || `Erro ao ${acao} produto`);
      }
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      alert(`Erro ao ${acao} produto`);
    }
  };

  const excluirProduto = async (id: string, nome: string) => {
    if (!podeGerenciarProdutos) {
      alert('Você não tem permissão para excluir produtos!');
      return;
    }
    
    if (!confirm(`Tem certeza que deseja excluir permanentemente o produto "${nome}"? Esta ação não pode ser desfeita.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/produtos/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        carregarDados();
        setPaginaAtual(1);
      } else {
        const data = await response.json();
        alert(data.error || 'Erro ao excluir produto');
      }
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      alert('Erro ao excluir produto');
    }
  };

  const handleOrdenacao = (campo: OrdenacaoCampo) => {
    if (ordenacao === campo) {
      setDirecaoOrdenacao(direcaoOrdenacao === 'asc' ? 'desc' : 'asc');
    } else {
      setOrdenacao(campo);
      setDirecaoOrdenacao('asc');
    }
  };

  const limparFiltros = () => {
    setBusca('');
    setFiltroCategoria('todas');
    setFiltroStatus('todos');
    setMostrarInativos(false);
    setPaginaAtual(1);
  };

  // ✅ NOVO: Componente para botões de ação com permissão
  const renderizarAcoesProduto = (produto: Produto) => {
    if (!podeGerenciarProdutos) {
      return (
        <div className="px-6 py-4 text-center">
          <span className="text-xs text-gray-400 italic">
            Sem permissão
          </span>
        </div>
      );
    }
    
    return (
      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          <Link
            href={`/configuracao/produtos/editar/${produto._id}`}
            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
            title="Editar"
            aria-label={`Editar ${produto.nome}`}
          >
            <Edit className="h-5 w-5" />
          </Link>
          <button
            onClick={() => excluirProduto(produto._id, produto.nome)}
            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
            title="Excluir"
            aria-label={`Excluir ${produto.nome}`}
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </td>
    );
  };

  // ✅ NOVO: Componente para botão de status com permissão
  const renderizarStatusProduto = (produto: Produto) => {
    if (!podeGerenciarProdutos) {
      return (
        <td className="px-6 py-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium cursor-default ${
            produto.ativo
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {produto.ativo ? 'Ativo' : 'Inativo'}
          </span>
        </td>
      );
    }
    
    return (
      <td className="px-6 py-4">
        <button
          onClick={() => toggleAtivo(produto)}
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium cursor-pointer ${
            produto.ativo
              ? 'bg-green-100 text-green-800 hover:bg-green-200'
              : 'bg-red-100 text-red-800 hover:bg-red-200'
          }`}
          aria-label={produto.ativo ? "Desativar produto" : "Ativar produto"}
        >
          {produto.ativo ? 'Ativo' : 'Inativo'}
        </button>
      </td>
    );
  };

  // Componente para imagem do produto
  const ProdutoImagem = ({ src, alt }: { src: string; alt: string }) => {
    const [erro, setErro] = useState(false);
    
    if (!src || erro) {
      return (
        <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
          <Package className="h-6 w-6 text-gray-400" />
        </div>
      );
    }
    
    return (
      <img 
        src={src} 
        alt={alt}
        onError={() => setErro(true)}
        className="h-10 w-10 rounded-lg object-cover"
      />
    );
  };

  // ✅ NOVO: Banner de permissões
  const renderizarBannerPermissoes = () => {
    if (usuarioLogado?.role === 'admin') return null;
    
    return (
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">
              Permissões de Produto Ativas
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Você está acessando a gestão de produtos com permissão completa.
                {!podeGerenciarProdutos && ' (Apenas visualização)'}
              </p>
              {usuarioLogado && (
                <p className="mt-1 text-xs text-blue-600">
                  Função: {usuarioLogado.role.toUpperCase()}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <div className="flex items-center mb-2">
            <Package className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
              {usuarioLogado && (
                <div className="flex items-center mt-1">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    usuarioLogado.role === 'admin' ? 'bg-red-100 text-red-800' :
                    usuarioLogado.role === 'gerente' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {usuarioLogado.role.toUpperCase()}
                  </span>
                  {!podeGerenciarProdutos && (
                    <span className="ml-2 text-xs text-yellow-600">
                      (Apenas visualização)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <p className="text-gray-600">
            Gerencie o cardápio do restaurante
          </p>
        </div>
        <div className="mt-4 lg:mt-0 flex items-center space-x-3">
          <button
            onClick={limparFiltros}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            aria-label="Limpar filtros"
          >
            Limpar Filtros
          </button>
          <button
            onClick={carregarDados}
            disabled={carregando}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center"
            aria-label="Atualizar lista"
          >
            <RefreshCw className={`h-5 w-5 mr-2 ${carregando ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          
          {/* ✅ NOVO: Botão "Novo Produto" só aparece se tiver permissão */}
          {podeGerenciarProdutos && (
            <Link
              href="/configuracao/produtos/novo"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Novo Produto
            </Link>
          )}
        </div>
      </div>

      {/* ✅ NOVO: Banner de permissões */}
      {renderizarBannerPermissoes()}

      {/* Filtros e Busca */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setPaginaAtual(1);
                }}
                placeholder="Buscar produtos por nome, descrição ou categoria..."
                aria-label="Buscar produtos"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
              aria-label="Filtrar por categoria"
            >
              <option value="todas">Todas categorias</option>
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[120px]"
              aria-label="Filtrar por status"
            >
              <option value="todos">Todos status</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>
            
            <button
              onClick={() => setMostrarInativos(!mostrarInativos)}
              className={`flex items-center px-3 py-2 rounded-lg ${mostrarInativos 
                ? 'bg-gray-200 text-gray-800' 
                : 'bg-white border border-gray-300 text-gray-700'
              }`}
              aria-label={mostrarInativos ? "Ocultar inativos" : "Mostrar inativos"}
            >
              {mostrarInativos ? (
                <Eye className="h-5 w-5 mr-2" />
              ) : (
                <EyeOff className="h-5 w-5 mr-2" />
              )}
              Inativos
            </button>
            
            <select
              value={itensPorPagina}
              onChange={(e) => {
                setItensPorPagina(Number(e.target.value));
                setPaginaAtual(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Itens por página"
            >
              <option value="5">5 por página</option>
              <option value="10">10 por página</option>
              <option value="20">20 por página</option>
              <option value="50">50 por página</option>
            </select>
          </div>
        </div>
        
        {/* Mensagem de erro */}
        {erroCarregamento && (
          <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {erroCarregamento}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-600">Total de Produtos</div>
          <div className="text-2xl font-bold mt-1">{produtos.length}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-600">Produtos Ativos</div>
          <div className="text-2xl font-bold mt-1 text-green-600">
            {produtos.filter(p => p.ativo).length}
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-600">Valor Médio</div>
          <div className="text-2xl font-bold mt-1">
            {produtos.length > 0 
              ? formatarMoeda(produtos.reduce((sum, p) => sum + p.preco, 0) / produtos.length)
              : 'R$ 0,00'
            }
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-600">Categorias</div>
          <div className="text-2xl font-bold mt-1">{categorias.length}</div>
        </div>
      </div>

      {/* Tabela de Produtos */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleOrdenacao('nome')}>
                  <div className="flex items-center">
                    Produto
                    {ordenacao === 'nome' && (
                      direcaoOrdenacao === 'asc' ? 
                        <ChevronUp className="ml-1 h-4 w-4" /> : 
                        <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleOrdenacao('categoria')}>
                  <div className="flex items-center">
                    Categoria
                    {ordenacao === 'categoria' && (
                      direcaoOrdenacao === 'asc' ? 
                        <ChevronUp className="ml-1 h-4 w-4" /> : 
                        <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleOrdenacao('preco')}>
                  <div className="flex items-center">
                    Preço
                    {ordenacao === 'preco' && (
                      direcaoOrdenacao === 'asc' ? 
                        <ChevronUp className="ml-1 h-4 w-4" /> : 
                        <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Adicionais
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {carregando ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                      <p className="text-gray-600">Carregando produtos...</p>
                    </div>
                  </td>
                </tr>
              ) : produtosPaginados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Package className="h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-gray-500 text-lg font-medium mb-2">
                        Nenhum produto encontrado
                      </p>
                      <p className="text-gray-400">
                        {busca || filtroCategoria !== 'todas' || filtroStatus !== 'todos'
                          ? 'Tente ajustar seus filtros de busca'
                          : 'Comece adicionando seu primeiro produto'
                        }
                      </p>
                      {podeGerenciarProdutos && (
                        <Link
                          href="/configuracao/produtos/novo"
                          className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                        >
                          <Plus className="h-5 w-5 mr-2" />
                          Criar Primeiro Produto
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                produtosPaginados.map((produto) => (
                  <tr key={produto._id} className={`hover:bg-gray-50 ${!produto.ativo ? 'opacity-70 bg-gray-50' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <ProdutoImagem src={produto.imagem} alt={produto.nome} />
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">{produto.nome}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {produto.descricao || 'Sem descrição'}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Criado em {formatarData(produto.criadoEm)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Tag className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-900">{produto.categoria}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">
                        {formatarMoeda(produto.preco)}
                      </div>
                    </td>
                    
                    {/* ✅ NOVO: Status com permissão */}
                    {renderizarStatusProduto(produto)}
                    
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {produto.adicionais && produto.adicionais.length > 0 ? (
                          produto.adicionais.slice(0, 3).map((adicional, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {adicional}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">Nenhum</span>
                        )}
                        {produto.adicionais && produto.adicionais.length > 3 && (
                          <span className="text-gray-500 text-xs">
                            +{produto.adicionais.length - 3} mais
                          </span>
                        )}
                      </div>
                    </td>
                    
                    {/* ✅ NOVO: Ações com permissão */}
                    {renderizarAcoesProduto(produto)}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginação */}
      {produtosOrdenados.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 space-y-3 sm:space-y-0">
          <div className="text-sm text-gray-500">
            Mostrando {indiceInicial + 1} a {Math.min(indiceFinal, produtosOrdenados.length)} de {produtosOrdenados.length} produtos
            {busca && ` • Resultados para: "${busca}"`}
            {filtroCategoria !== 'todas' && ` • Categoria: ${filtroCategoria}`}
            {filtroStatus !== 'todos' && ` • Status: ${filtroStatus === 'ativo' ? 'Ativos' : 'Inativos'}`}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
              disabled={paginaAtual === 1}
              className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              aria-label="Página anterior"
            >
              Anterior
            </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                let pageNum;
                if (totalPaginas <= 5) {
                  pageNum = i + 1;
                } else if (paginaAtual <= 3) {
                  pageNum = i + 1;
                } else if (paginaAtual >= totalPaginas - 2) {
                  pageNum = totalPaginas - 4 + i;
                } else {
                  pageNum = paginaAtual - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPaginaAtual(pageNum)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      paginaAtual === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                    aria-label={`Ir para página ${pageNum}`}
                    aria-current={paginaAtual === pageNum ? 'page' : undefined}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              {totalPaginas > 5 && paginaAtual < totalPaginas - 2 && (
                <>
                  <span className="px-1">...</span>
                  <button
                    onClick={() => setPaginaAtual(totalPaginas)}
                    className="w-8 h-8 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center justify-center"
                    aria-label={`Ir para última página ${totalPaginas}`}
                  >
                    {totalPaginas}
                  </button>
                </>
              )}
            </div>
            
            <button
              onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
              disabled={paginaAtual === totalPaginas}
              className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              aria-label="Próxima página"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
}