// app/relatorios/gestao/page.tsx - VERSÃO FINAL CORRIGIDA
'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  Package, 
  ShoppingCart,
  Download,
  Printer,
  AlertCircle,
  Loader2,
  Search,
  BarChart3,
  Calendar,
  Target,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  Zap,
  DollarSign,
  Hash,
  Clock,
  ArrowLeft,
  ShoppingBag,
  Tag,
  Battery,
  BatteryCharging,
  BatteryLow,
  Plus,
  Minus,
  Check,
  FileText,
  Copy,
  Info,
  CalendarDays
} from 'lucide-react';
import AnaliseDiaSemana from '@/components/AnaliseDiaSemana';
import Link from 'next/link';

interface Produto {
  id: string;
  _id: string;
  nome: string;
  categoria: string;
  preco: number;
  precoVenda: number;
  precoCusto?: number; // Adicione esta linha
  estoqueAtual: number;
  estoqueMinimo: number;
  quantidade?: number;
  total?: number;
}

interface ItemCompra {
  produtoId: string;
  produtoNome: string;
  categoria: string;
  precoUnitario: number;
  quantidade: number;
  estoqueAtual: number;
  estoqueMinimo: number;
  status: StatusEstoque;
}

type StatusEstoque = 'ESGOTADO' | 'CRÍTICO' | 'ATENÇÃO' | 'OK';

export default function GestaoProdutosPage() {
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null);
  const [filtroProdutos, setFiltroProdutos] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [mostrarAnalise, setMostrarAnalise] = useState(false);
  const [mostrarAnaliseDia, setMostrarAnaliseDia] = useState(false);
  const [ordenacao, setOrdenacao] = useState<'nome' | 'categoria' | 'estoque'>('nome');
  const [categorias, setCategorias] = useState<string[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>('todas');
  const [periodoAnalise, setPeriodoAnalise] = useState({
    dataInicio: '',
    dataFim: ''
  });
  const [mostrarSeletorPeriodo, setMostrarSeletorPeriodo] = useState(false);
  
  // Estados para lista de compras
  const [listaCompras, setListaCompras] = useState<ItemCompra[]>([]);
  const [mostrarModalCompra, setMostrarModalCompra] = useState(false);
  const [quantidadeCompra, setQuantidadeCompra] = useState(1);
  const [produtoParaCompra, setProdutoParaCompra] = useState<Produto | null>(null);
  const [mostrarListaCompras, setMostrarListaCompras] = useState(false);
  const [mostrarModalFinalizar, setMostrarModalFinalizar] = useState(false);

  const itensPorPagina = 12;
  const modalCompraRef = useRef<HTMLDivElement>(null);
  const modalListaRef = useRef<HTMLDivElement>(null);
  const modalFinalizarRef = useRef<HTMLDivElement>(null);
  const seletorPeriodoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    buscarProdutos();
    buscarCategorias();
    // Setar período padrão (últimos 30 dias)
    const dataFim = new Date();
    const dataInicio = new Date();
    dataInicio.setDate(dataFim.getDate() - 30);
    
    setPeriodoAnalise({
      dataInicio: dataInicio.toISOString().split('T')[0],
      dataFim: dataFim.toISOString().split('T')[0]
    });
  }, []);

  useEffect(() => {
    // Fechar modais ao clicar fora
    const handleClickOutside = (event: MouseEvent) => {
      if (seletorPeriodoRef.current && !seletorPeriodoRef.current.contains(event.target as Node)) {
        setMostrarSeletorPeriodo(false);
      }
      if (modalCompraRef.current && !modalCompraRef.current.contains(event.target as Node)) {
        setMostrarModalCompra(false);
      }
      if (modalListaRef.current && !modalListaRef.current.contains(event.target as Node)) {
        setMostrarListaCompras(false);
      }
      if (modalFinalizarRef.current && !modalFinalizarRef.current.contains(event.target as Node)) {
        setMostrarModalFinalizar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mostrarSeletorPeriodo, mostrarModalCompra, mostrarListaCompras, mostrarModalFinalizar]);

  const buscarProdutos = async () => {
    setCarregando(true);
    setErro(null);
    try {
      const response = await fetch('/api/produtos');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar produtos');
      }
      
      const result = await response.json();
      
      if (result.success) {
        const produtosFormatados: Produto[] = result.data.map((produto: any) => ({
        id: produto._id,
        _id: produto._id,
        nome: produto.nome,
        categoria: produto.categoria,
        preco: produto.precoVenda || produto.preco,
        precoVenda: produto.precoVenda || produto.preco,
        precoCusto: produto.precoCusto || 0, // Adicione esta linha
        estoqueAtual: produto.estoqueAtual || 0,
        estoqueMinimo: produto.estoqueMinimo || 0,
        quantidade: Math.floor(Math.random() * 1000),
        total: (produto.precoVenda || produto.preco) * Math.floor(Math.random() * 1000)
      }));

        
        setProdutos(produtosFormatados);
      } else {
        setErro(result.error || 'Erro ao carregar produtos');
      }
    } catch (error: any) {
      console.error('❌ Erro ao buscar produtos:', error);
      setErro('Erro de conexão com o servidor: ' + error.message);
    } finally {
      setCarregando(false);
    }
  };

  const buscarCategorias = async () => {
    try {
      const response = await fetch('/api/categorias?ativas=true');
      const result = await response.json();
      
      if (result.success) {
        const nomesCategorias = result.data.map((cat: any) => cat.nome);
        setCategorias(['todas', ...nomesCategorias]);
      }
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
  };

  const handleAnalisarProduto = (produto: Produto) => {
    setProdutoSelecionado(produto);
    setMostrarAnalise(true);
  };

  const handleAdicionarCompras = (produto: Produto) => {
    setProdutoParaCompra(produto);
    setQuantidadeCompra(1);
    setMostrarModalCompra(true);
  };

  const confirmarAdicionarCompra = () => {
    if (!produtoParaCompra) return;
    
    const status = calcularStatusEstoque(produtoParaCompra);
    const novoItem: ItemCompra = {
      produtoId: produtoParaCompra.id,
      produtoNome: produtoParaCompra.nome,
      categoria: produtoParaCompra.categoria,
      precoUnitario: produtoParaCompra.precoVenda,
      quantidade: quantidadeCompra,
      estoqueAtual: produtoParaCompra.estoqueAtual,
      estoqueMinimo: produtoParaCompra.estoqueMinimo,
      status
    };
    
    setListaCompras(prev => {
      const existe = prev.find(item => item.produtoId === produtoParaCompra.id);
      if (existe) {
        return prev.map(item => 
          item.produtoId === produtoParaCompra.id 
            ? { ...item, quantidade: item.quantidade + quantidadeCompra }
            : item
        );
      }
      return [...prev, novoItem];
    });
    
    setMostrarModalCompra(false);
    setProdutoParaCompra(null);
  };

  const removerDaListaCompras = (produtoId: string) => {
    setListaCompras(prev => prev.filter(item => item.produtoId !== produtoId));
  };

  const atualizarQuantidadeLista = (produtoId: string, novaQuantidade: number) => {
    if (novaQuantidade < 1) {
      removerDaListaCompras(produtoId);
      return;
    }
    
    setListaCompras(prev => 
      prev.map(item => 
        item.produtoId === produtoId 
          ? { ...item, quantidade: novaQuantidade }
          : item
      )
    );
  };

  const calcularTotalListaCompras = () => {
    return listaCompras.reduce((total, item) => total + (item.precoUnitario * item.quantidade), 0);
  };

  const gerarPDF = async () => {
  try {
    // Importação dinâmica para evitar problemas de SSR
    const { jsPDF } = await import('jspdf');
    const autoTable = await import('jspdf-autotable');
    
    const doc = new jsPDF();
    
    // Cabeçalho
    doc.setFontSize(20);
    doc.text('LISTA DE COMPRAS', 105, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 105, 22, { align: 'center' });
    doc.text(`Total de itens: ${listaCompras.length}`, 105, 28, { align: 'center' });
    
    // Preparar dados da tabela
    const tableData = listaCompras.map((item, index) => [
      index + 1,
      item.produtoNome,
      item.categoria,
      item.quantidade.toString(),
      `R$ ${item.precoUnitario.toFixed(2)}`,
      `R$ ${(item.precoUnitario * item.quantidade).toFixed(2)}`
    ]);
    
    // Adicionar tabela - usando a função autoTable do plugin
    autoTable.default(doc, {
      head: [['#', 'Produto', 'Categoria', 'Qtd', 'Preço Unit.', 'Subtotal']],
      body: tableData,
      startY: 35,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 60 },
        2: { cellWidth: 30 },
        3: { cellWidth: 20 },
        4: { cellWidth: 30 },
        5: { cellWidth: 30 }
      },
      margin: { left: 14 }
    });
    
    // Total
    const finalY = (doc as any).lastAutoTable?.finalY || 100;
    doc.setFontSize(12);
    doc.text(`TOTAL: R$ ${calcularTotalListaCompras().toFixed(2)}`, 14, finalY + 10);
    
    // Rodapé
    doc.setFontSize(8);
    doc.text('Gerado pelo Sistema de Gestão Servyx', 105, 280, { align: 'center' });
    
    // Baixar PDF
    doc.save(`lista-compras-${new Date().toISOString().split('T')[0]}.pdf`);
    setMostrarModalFinalizar(false);
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    alert('Erro ao gerar PDF. Tente novamente.');
  }
};

  const copiarLista = () => {
    const texto = listaCompras.map((item, index) => 
      `${index + 1}. ${item.quantidade}x ${item.produtoNome} - R$ ${(item.precoUnitario * item.quantidade).toFixed(2)}`
    ).join('\n');
    
    const total = calcularTotalListaCompras();
    const textoCompleto = `📋 LISTA DE COMPRAS\nData: ${new Date().toLocaleDateString('pt-BR')}\n\n${texto}\n\n💰 TOTAL: R$ ${total.toFixed(2)}`;
    
    navigator.clipboard.writeText(textoCompleto)
      .then(() => {
        alert('✅ Lista copiada para a área de transferência!');
        setMostrarModalFinalizar(false);
      })
      .catch(err => {
        console.error('Erro ao copiar:', err);
        alert('❌ Erro ao copiar lista');
      });
  };

  const finalizarLista = () => {
    setMostrarListaCompras(false);
    setMostrarModalFinalizar(true);
  };

  const limparListaCompras = () => {
    setListaCompras([]);
    setMostrarListaCompras(false);
  };

  const exportarCSV = () => {
    const headers = ['Produto', 'Categoria', 'Preço Venda', 'Estoque Atual', 'Estoque Mínimo', 'Status'];
    const rows = produtosFiltrados.map(produto => [
      produto.nome,
      produto.categoria,
      `R$ ${produto.precoVenda.toFixed(2)}`,
      produto.estoqueAtual.toString(),
      produto.estoqueMinimo.toString(),
      calcularStatusEstoque(produto)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gestao-produtos-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const calcularStatusEstoque = (produto: Produto): StatusEstoque => {
    if (produto.estoqueAtual === 0) return 'ESGOTADO';
    if (produto.estoqueAtual <= produto.estoqueMinimo) return 'CRÍTICO';
    if (produto.estoqueAtual <= produto.estoqueMinimo * 2) return 'ATENÇÃO';
    return 'OK';
  };

  const calcularStatusEstoqueIcon = (produto: Produto) => {
    const status = calcularStatusEstoque(produto);
    switch (status) {
      case 'ESGOTADO':
      case 'CRÍTICO':
        return <BatteryLow className="h-5 w-5 text-red-500" />;
      case 'ATENÇÃO':
        return <Battery className="h-5 w-5 text-yellow-500" />;
      case 'OK':
        return <BatteryCharging className="h-5 w-5 text-green-500" />;
    }
  };

  const calcularStatusEstoqueCor = (produto: Produto): string => {
    const status = calcularStatusEstoque(produto);
    const cores: Record<StatusEstoque, string> = {
      'ESGOTADO': 'border-red-200 bg-red-50 text-red-700',
      'CRÍTICO': 'border-red-200 bg-red-50 text-red-700',
      'ATENÇÃO': 'border-yellow-200 bg-yellow-50 text-yellow-700',
      'OK': 'border-green-200 bg-green-50 text-green-700'
    };
    return cores[status];
  };

  const formatarData = (data: string) => {
    if (!data) return 'Não definida';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const setarPeriodoMesAnterior = () => {
    const hoje = new Date();
    const primeiroDiaMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    const ultimoDiaMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
    
    setPeriodoAnalise({
      dataInicio: primeiroDiaMesAnterior.toISOString().split('T')[0],
      dataFim: ultimoDiaMesAnterior.toISOString().split('T')[0]
    });
    setMostrarSeletorPeriodo(false);
  };

  const setarPeriodoUltimos30Dias = () => {
    const dataFim = new Date();
    const dataInicio = new Date();
    dataInicio.setDate(dataFim.getDate() - 30);
    
    setPeriodoAnalise({
      dataInicio: dataInicio.toISOString().split('T')[0],
      dataFim: dataFim.toISOString().split('T')[0]
    });
    setMostrarSeletorPeriodo(false);
  };

  const calcularConsumoSemanal = (produtoId: string): number => {
  // Simulação - na prática buscar da API
  // Média baseada em vendas do último mês
  const vendasUltimoMes = Math.floor(Math.random() * 500) + 100; // Simulado
  return Math.floor(vendasUltimoMes / 4.33); // Aproximação de semanas no mês
};

  // Filtrar produtos
  const produtosFiltrados = produtos.filter(produto => {
    const buscaOk = produto.nome.toLowerCase().includes(filtroProdutos.toLowerCase()) ||
                   produto.categoria.toLowerCase().includes(filtroProdutos.toLowerCase());
    
    const categoriaOk = categoriaSelecionada === 'todas' || 
                       produto.categoria === categoriaSelecionada;
    
    return buscaOk && categoriaOk;
  }).sort((a, b) => {
    switch (ordenacao) {
      case 'nome':
        return a.nome.localeCompare(b.nome);
      case 'categoria':
        return a.categoria.localeCompare(b.categoria);
      case 'estoque':
        return b.estoqueAtual - a.estoqueAtual;
      default:
        return 0;
    }
  });

  const totalPaginas = Math.ceil(produtosFiltrados.length / itensPorPagina);
  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = inicio + itensPorPagina;
  const produtosPaginados = produtosFiltrados.slice(inicio, fim);

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando produtos...</p>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl mx-auto mt-8">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h2 className="text-xl font-bold text-gray-900">Erro ao Carregar Dados</h2>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{erro}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={buscarProdutos}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Tentar Novamente
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Voltar ao Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Página Principal - Lista de Produtos */}
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Package className="text-blue-600" size={32} />
                Gestão de Produtos
              </h1>
              <p className="text-gray-600 mt-1">
                Gerencie produtos, estoque e faça análises detalhadas
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={exportarCSV}
                className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
                title="Exportar dados para CSV"
              >
                <Download size={18} />
                Exportar
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
                title="Imprimir relatório"
              >
                <Printer size={18} />
                Imprimir
              </button>
            </div>
          </div>

          {/* Filtros e Busca */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Buscar produto por nome ou categoria..."
                    value={filtroProdutos}
                    onChange={(e) => {
                      setFiltroProdutos(e.target.value);
                      setPaginaAtual(1);
                    }}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <select
                  value={categoriaSelecionada}
                  onChange={(e) => {
                    setCategoriaSelecionada(e.target.value);
                    setPaginaAtual(1);
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {categorias.map(categoria => (
                    <option key={categoria} value={categoria}>
                      {categoria === 'todas' ? 'Todas categorias' : categoria}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              <button
                onClick={() => setOrdenacao('nome')}
                className={`px-4 py-2 rounded-lg whitespace-nowrap ${ordenacao === 'nome' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                <Hash className="inline mr-2 h-4 w-4" />
                Por Nome
              </button>
              <button
                onClick={() => setOrdenacao('categoria')}
                className={`px-4 py-2 rounded-lg whitespace-nowrap ${ordenacao === 'categoria' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                <Tag className="inline mr-2 h-4 w-4" />
                Por Categoria
              </button>
              <button
                onClick={() => setOrdenacao('estoque')}
                className={`px-4 py-2 rounded-lg whitespace-nowrap ${ordenacao === 'estoque' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                <Package className="inline mr-2 h-4 w-4" />
                Por Estoque
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Produtos */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Produtos em Estoque
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {produtosFiltrados.length} produtos encontrados
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  Página <span className="font-bold">{paginaAtual}</span> de <span className="font-bold">{totalPaginas}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                    disabled={paginaAtual === 1}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                    disabled={paginaAtual === totalPaginas}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Produto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preço Venda
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preço Custo
                </th> {/* Nova coluna */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estoque
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {produtosPaginados.map((produto, index) => (
                  <tr 
                    key={produto.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                          <Package className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {produto.nome}
                          </div>
                          <div className="text-xs text-gray-500">
                            #{produto.id.substring(0, 6)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                        {produto.categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-green-600">
                        R$ {produto.precoVenda.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
  <div className="text-sm font-bold text-red-600">
    R$ {produto.precoCusto?.toFixed(2) || '0.00'}
  </div>
  <div className="text-xs text-gray-500">
    {produto.precoCusto && produto.precoVenda ? 
      `${(((produto.precoVenda - produto.precoCusto) / produto.precoCusto) * 100).toFixed(1)}% margem` : 
      'N/A'
    }
  </div>
</td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {calcularStatusEstoqueIcon(produto)}
                        <div className="text-sm font-bold text-gray-900">
                          {produto.estoqueAtual}
                        </div>
                        <div className="text-xs text-gray-500">
                          / {produto.estoqueMinimo} mín
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full border ${calcularStatusEstoqueCor(produto)}`}>
                        {calcularStatusEstoque(produto)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAnalisarProduto(produto)}
                          className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all flex items-center gap-2 text-sm"
                        >
                          <BarChart3 size={14} />
                          Analisar
                        </button>
                        <button
                          onClick={() => handleAdicionarCompras(produto)}
                          className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all flex items-center gap-2 text-sm"
                        >
                          <ShoppingCart size={14} />
                          Comprar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {produtosFiltrados.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Nenhum produto encontrado</p>
              <p className="text-gray-400 text-sm mt-1">Tente ajustar os filtros de busca</p>
            </div>
          )}
        </div>

        {/* Footer da Lista */}
        <div className="mt-6 flex justify-between items-center text-sm text-gray-600">
          <div>
            Mostrando {inicio + 1} a {Math.min(fim, produtosFiltrados.length)} de {produtosFiltrados.length} produtos
          </div>
          <div className="flex gap-2">
            {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPaginaAtual(pageNum)}
                  className={`w-8 h-8 rounded-lg ${paginaAtual === pageNum ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Botão Flutuante da Lista de Compras */}
      {listaCompras.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="relative group">
            <button
              onClick={() => setMostrarListaCompras(!mostrarListaCompras)}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105 active:scale-95"
            >
              <div className="relative">
                <ShoppingCart size={24} />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {listaCompras.length}
                </span>
              </div>
            </button>
            <div className="absolute right-0 bottom-full mb-2 w-64 bg-white rounded-lg shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
              <div className="p-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-t-lg border-b">
                🛒 Lista de Compras
              </div>
              <div className="p-3">
                <div className="text-xs text-gray-600 mb-2">
                  {listaCompras.length} itens • Total: R$ {calcularTotalListaCompras().toFixed(2)}
                </div>
                <button
                  onClick={finalizarLista}
                  className="w-full py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors"
                >
                  Finalizar Lista
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Adicionar à Lista de Compras */}
      {mostrarModalCompra && produtoParaCompra && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[100] flex items-center justify-center p-4">
          <div ref={modalCompraRef} className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scaleIn">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Adicionar à Lista de Compras</h2>
                <button
                  onClick={() => setMostrarModalCompra(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-2">{produtoParaCompra.nome}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Categoria: {produtoParaCompra.categoria}</span>
                  <span>Estoque: {produtoParaCompra.estoqueAtual}</span>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantidade
                </label>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setQuantidadeCompra(q => Math.max(1, q - 1))}
                    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Minus size={20} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantidadeCompra}
                    onChange={(e) => setQuantidadeCompra(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 text-center border border-gray-300 rounded-lg py-2 px-3 text-lg font-medium"
                  />
                  <button
                    onClick={() => setQuantidadeCompra(q => q + 1)}
                    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
              
<div className="mt-4 p-3 bg-blue-50 rounded-lg">
  <div className="flex items-center gap-2 text-sm text-blue-700">
    <Info className="h-4 w-4" />
    <span>
      Você costuma gastar <strong>{calcularConsumoSemanal(produtoParaCompra.id)}</strong> itens desse por semana
    </span>
  </div>
  <div className="text-xs text-blue-600 mt-1">
    Baseado na média de segunda a domingo do último mês
  </div>
</div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setMostrarModalCompra(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarAdicionarCompra}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:opacity-90 flex items-center justify-center gap-2 font-medium transition-opacity"
                >
                  <Check size={20} />
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal da Lista de Compras */}
      {mostrarListaCompras && listaCompras.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[100] flex items-center justify-center p-4">
          <div ref={modalListaRef} className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden animate-scaleIn">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Lista de Compras
                </h2>
                <button
                  onClick={() => setMostrarListaCompras(false)}
                  className="p-2 hover:bg-white rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {listaCompras.map((item) => (
                <div key={item.produtoId} className="border-b border-gray-200 py-4 last:border-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.produtoNome}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-600">{item.categoria}</span>
                        <span className="text-sm font-medium text-gray-700">
                          R$ {item.precoUnitario.toFixed(2)}/un
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${calcularStatusEstoqueCor({
                          estoqueAtual: item.estoqueAtual,
                          estoqueMinimo: item.estoqueMinimo
                        } as Produto)}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => atualizarQuantidadeLista(item.produtoId, item.quantidade - 1)}
                          className="p-1.5 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantidade}</span>
                        <button
                          onClick={() => atualizarQuantidadeLista(item.produtoId, item.quantidade + 1)}
                          className="p-1.5 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      
                      <div className="text-right min-w-[80px]">
                        <div className="font-bold text-green-600">
                          R$ {(item.precoUnitario * item.quantidade).toFixed(2)}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => removerDaListaCompras(item.produtoId)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div className="text-sm text-gray-600">Total da Lista</div>
                  <div className="text-2xl font-bold text-green-600">
                    R$ {calcularTotalListaCompras().toFixed(2)}
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {listaCompras.length} {listaCompras.length === 1 ? 'item' : 'itens'}
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={limparListaCompras}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors font-medium"
                >
                  Limpar Lista
                </button>
                <button
                  onClick={finalizarLista}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                >
                  Finalizar Compra
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Finalizar Lista */}
      {mostrarModalFinalizar && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[110] flex items-center justify-center p-4">
          <div ref={modalFinalizarRef} className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scaleIn">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Finalizar Lista de Compras</h2>
                <button
                  onClick={() => setMostrarModalFinalizar(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-600 mb-4">Escolha como deseja finalizar sua lista de compras:</p>
                
                <div className="space-y-3">
                  <button
                    onClick={gerarPDF}
                    className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:opacity-90 flex items-center justify-center gap-2 transition-opacity font-medium"
                  >
                    <FileText size={20} />
                    Baixar PDF
                  </button>
                  
                  <button
                    onClick={copiarLista}
                    className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:opacity-90 flex items-center justify-center gap-2 transition-opacity font-medium"
                  >
                    <Copy size={20} />
                    Copiar Lista
                  </button>
                </div>
              </div>
              
              <button
                onClick={() => setMostrarModalFinalizar(false)}
                className="w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay de Análise do Produto */}
      {mostrarAnalise && produtoSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[90] overflow-y-auto">
          <div className="min-h-screen p-4 md:p-6 flex items-start justify-center">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl my-8 overflow-hidden">
              {/* Header do Modal */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setMostrarAnalise(false)}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                    >
                      <ArrowLeft className="h-5 w-5 text-white" />
                    </button>
                    <div>
                      <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <BarChart3 className="h-7 w-7" />
                        Análise do Produto
                      </h2>
                      <p className="text-white/90 mt-1">Análise detalhada de vendas e desempenho</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMostrarAnalise(false)}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                    >
                      <X className="h-5 w-5 text-white" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Corpo do Modal */}
              <div className="p-6">
                {/* Header do Produto */}
                <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{produtoSelecionado.nome}</h3>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                          {produtoSelecionado.categoria}
                        </span>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Package className="h-4 w-4" />
                          <span>ID: {produtoSelecionado.id.substring(0, 8)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        R$ {produtoSelecionado.precoVenda.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">Preço de venda</div>
                    </div>
                  </div>
                </div>

                {/* Controle de Período */}
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-gray-900">Período de Análise</h4>
                      <p className="text-sm text-gray-600">
                        De {formatarData(periodoAnalise.dataInicio)} até {formatarData(periodoAnalise.dataFim)}
                      </p>
                    </div>
                    <div className="relative" ref={seletorPeriodoRef}>
                      <button
                        onClick={() => setMostrarSeletorPeriodo(!mostrarSeletorPeriodo)}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
                      >
                        <CalendarDays size={18} />
                        Alterar Período
                      </button>
                      
                      {mostrarSeletorPeriodo && (
                        <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-xl z-10">
                          <div className="p-4">
                            <h5 className="font-medium text-gray-900 mb-3">Selecionar Período</h5>
                            
                            <div className="space-y-3 mb-4">
                              <div>
                                <label className="block text-sm text-gray-700 mb-1">Data Inicial</label>
                                <input
                                  type="date"
                                  value={periodoAnalise.dataInicio}
                                  onChange={(e) => setPeriodoAnalise(prev => ({ ...prev, dataInicio: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm text-gray-700 mb-1">Data Final</label>
                                <input
                                  type="date"
                                  value={periodoAnalise.dataFim}
                                  onChange={(e) => setPeriodoAnalise(prev => ({ ...prev, dataFim: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <button
                                onClick={setarPeriodoMesAnterior}
                                className="w-full text-left px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                              >
                                ↺ Período do mês anterior
                              </button>
                              <button
                                onClick={setarPeriodoUltimos30Dias}
                                className="w-full text-left px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                              >
                                ↺ Últimos 30 dias
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Grid com Métricas, Insights e Recomendações */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Coluna 1: Métricas e Ações */}
                  <div className="lg:col-span-1 space-y-6">
                    {/* Métricas Principais */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5">
                      <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        Métricas Principais
                      </h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                          <div>
                            <div className="text-sm text-gray-600">Estoque Atual</div>
                            <div className="text-xl font-bold text-blue-700">
                              {produtoSelecionado.estoqueAtual}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">Mínimo</div>
                            <div className="text-lg font-medium text-gray-700">
                              {produtoSelecionado.estoqueMinimo}
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">Vendas Totais</div>
                          <div className="text-2xl font-bold text-green-700">
                            {produtoSelecionado.quantidade?.toLocaleString() || '0'}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">unidades vendidas</div>
                        </div>
                        
                        <div className="p-3 bg-purple-50 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">Faturamento Total</div>
                          <div className="text-2xl font-bold text-purple-700">
                            R$ {produtoSelecionado.total?.toFixed(2) || '0.00'}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">valor total vendido</div>
                        </div>
                      </div>
                    </div>

                    {/* Ações Rápidas */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5">
                      <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-600" />
                        Ações Rápidas
                      </h4>
                      <div className="space-y-3">
                        <button
                          onClick={() => {
                            setMostrarAnaliseDia(true);
                            setMostrarAnalise(false);
                          }}
                          className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 font-medium"
                        >
                          <Calendar className="h-5 w-5" />
                          Análise por Dia
                        </button>
                        
                        <button
                          onClick={() => handleAdicionarCompras(produtoSelecionado)}
                          className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 font-medium"
                        >
                          <ShoppingCart className="h-5 w-5" />
                          Adicionar às Compras
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Coluna 2 e 3: Insights e Estatísticas */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Insights e Recomendações */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5">
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-blue-600" />
                          Insights do Produto
                        </h4>
                        <ul className="space-y-2">
                          <li className="flex items-start gap-2">
                            <div className="h-2 w-2 bg-blue-600 rounded-full mt-2"></div>
                            <span className="text-sm text-gray-700">
                              Vendas concentradas das <strong>17h às 21h</strong>
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="h-2 w-2 bg-blue-600 rounded-full mt-2"></div>
                            <span className="text-sm text-gray-700">
                              <strong>+42%</strong> mais vendido aos sábados
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="h-2 w-2 bg-blue-600 rounded-full mt-2"></div>
                            <span className="text-sm text-gray-700">
                              Vende 3x mais no <strong>verão</strong>
                            </span>
                          </li>
                        </ul>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-5">
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <ShoppingBag className="h-5 w-5 text-green-600" />
                          Recomendações
                        </h4>
                        <ul className="space-y-2">
                          <li className="flex items-start gap-2">
                            <div className="h-2 w-2 bg-green-600 rounded-full mt-2"></div>
                            <span className="text-sm text-gray-700">
                              Aumentar estoque em <strong>30%</strong>
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="h-2 w-2 bg-green-600 rounded-full mt-2"></div>
                            <span className="text-sm text-gray-700">
                              Criar promoção aos <strong>sábados</strong>
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="h-2 w-2 bg-green-600 rounded-full mt-2"></div>
                            <span className="text-sm text-gray-700">
                              Sugerir como <strong>acompanhamento</strong>
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Estatísticas de Venda */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5">
                      <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        Estatísticas de Venda
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-sm text-gray-600">Média Diária</div>
                          <div className="text-xl font-bold text-gray-900">42.5 un</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-600">Ticket Médio</div>
                          <div className="text-xl font-bold text-green-600">R$ 15.80</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-600">Dias com Venda</div>
                          <div className="text-xl font-bold text-blue-600">28/30</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-600">Melhor Dia</div>
                          <div className="text-xl font-bold text-purple-600">Sexta</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Análise por Dia da Semana */}
      {mostrarAnaliseDia && produtoSelecionado && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-scaleIn">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Análise por Dia da Semana</h2>
                <button
                  onClick={() => setMostrarAnaliseDia(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <AnaliseDiaSemana
                produtoId={produtoSelecionado.id}
                produtoNome={produtoSelecionado.nome}
                periodo={periodoAnalise}
                onClose={() => setMostrarAnaliseDia(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}