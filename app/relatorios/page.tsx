// app/relatorios/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  DollarSign, 
  Calendar,
  Filter,
  Download,
  Printer,
  Users,
  AlertCircle,
  Lock,
  Loader2,
  ShoppingBag,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart,
  PieChart as PieChartIcon,
  LineChart,
  TrendingDown,
  ChevronDown,
  Search
} from 'lucide-react';
import FiltrosPeriodo from '@/components/FiltrosPeriodo';
import GraficoVendas from '@/components/GraficoVendas';
import TopProdutos from '@/components/TopProdutos';
import MetricasResumo from '@/components/MetricasResumo';
import RelatorioVendas from '@/components/RelatorioVendas';
import GraficoCategorias from '@/components/GraficoCategorias';
import GraficoTendenciaProdutos from '@/components/GraficoTendenciaProdutos';
import CardMediaVendas from '@/components/CardMediaVendas';
import Link from 'next/link';

interface RelatorioData {
  totalVendas: number;
  totalComandas: number;
  totalBalcao: number;
  ticketMedio: number;
  produtosMaisVendidos: any[];
  categoriasMaisVendidas: any[];
  vendasPorPeriodo: any[];
  mesasMaisUtilizadas: any[];
  comandasFechadas: any[];
  resumoPorTipoVenda: {
    comanda: { quantidade: number; total: number; ticketMedio?: number };
    balcao: { quantidade: number; total: number; ticketMedio?: number };
  };
  distribuiçãoVendas?: {
    comanda: number;
    balcao: number;
  };
  tiposVenda?: any[];
}

interface UsuarioLogado {
  role: string;
  permissoes: Record<string, boolean>;
}

// Dados de exemplo para guia de compras
const dadosComprasExemplo = [
  {
    id: 1,
    produto: 'Refrigerante Coca-Cola 2L',
    estoqueAtual: 24,
    vendasDiarias: 8.2,
    diasRestantes: 2.9,
    status: 'critico',
    recomendacao: 'Comprar URGENTE!'
  },
  {
    id: 2,
    produto: 'Pão Francês',
    estoqueAtual: 150,
    vendasDiarias: 45.3,
    diasRestantes: 3.3,
    status: 'atencao',
    recomendacao: 'Comprar em 1-2 dias'
  },
  {
    id: 3,
    produto: 'Café em Pó 500g',
    estoqueAtual: 12,
    vendasDiarias: 1.8,
    diasRestantes: 6.7,
    status: 'ok',
    recomendacao: 'Comprar na próxima semana'
  },
  {
    id: 4,
    produto: 'Carne Moída 1kg',
    estoqueAtual: 18,
    vendasDiarias: 5.4,
    diasRestantes: 3.3,
    status: 'atencao',
    recomendacao: 'Comprar em 2-3 dias'
  }
];

export default function RelatoriosPage() {
  const searchParams = useSearchParams(); 
  const [periodo, setPeriodo] = useState('hoje');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [tipoVenda, setTipoVenda] = useState('todos');
  const [carregando, setCarregando] = useState(true);
  const [carregandoPermissoes, setCarregandoPermissoes] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [dados, setDados] = useState<RelatorioData | null>(null);
  const [visaoAtiva, setVisaoAtiva] = useState(() => {
    const aba = searchParams.get('aba');
    return aba === 'gestao' ? 'gestao' : 'visao-geral';
  });
  const [produtoSelecionado, setProdutoSelecionado] = useState<any>(null);
  const [tendenciaProduto, setTendenciaProduto] = useState<any>(null);
  const [carregandoTendencia, setCarregandoTendencia] = useState(false);
  const [filtroProdutos, setFiltroProdutos] = useState('');
  const [ordenacaoProdutos, setOrdenacaoProdutos] = useState('quantidade');
  const [mostrarGuiaCompras, setMostrarGuiaCompras] = useState(false);
  
  const [usuarioLogado, setUsuarioLogado] = useState<UsuarioLogado | null>(null);

  const [analiseDiaAtiva, setAnaliseDiaAtiva] = useState(false);


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

   useEffect(() => {
    if (produtoSelecionado?.id) {
      buscarTendenciaProduto(produtoSelecionado.id);
    }
  }, [produtoSelecionado]);

  useEffect(() => {
    const aba = searchParams.get('aba');
    if (aba === 'gestao') {
      setVisaoAtiva('gestao');
    } else {
      setVisaoAtiva('visao-geral');
    }
  }, [searchParams]);

  const buscarTendenciaProduto = async (produtoId: string) => {
    setCarregandoTendencia(true);
    try {
      const response = await fetch(`/api/relatorios/produtos-tendencia?produtoId=${produtoId}&periodo=30dias`);
      const result = await response.json();
      
      if (result.success) {
        setTendenciaProduto(result.data);
      }
    } catch (error) {
      console.error('Erro ao buscar tendência:', error);
    } finally {
      setCarregandoTendencia(false);
    }
  };

  // ✅ NOVO: Função de verificação de permissões
  const temPermissao = (permissao: string): boolean => {
    if (!usuarioLogado) return false;
    
    // Admin tem todas as permissões
    if (usuarioLogado.role === 'admin') return true;
    
    // Verifica permissão específica
    return usuarioLogado.permissoes[permissao] === true;
  };

  // ✅ NOVO: Verificar se pode visualizar relatórios
  const podeVerRelatorios = temPermissao('canViewReports');

  useEffect(() => {
    if (usuarioLogado !== null && podeVerRelatorios) {
      buscarRelatorios();
    }
  }, [periodo, dataInicio, dataFim, tipoVenda, usuarioLogado, podeVerRelatorios]);

  // ✅ NOVO: Tela de carregamento de permissões
  if (carregandoPermissoes) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando permissões...</p>
        </div>
      </div>
    );
  }

  const criarDadosVazios = (): RelatorioData => ({
    totalVendas: 0,
    totalComandas: 0,
    totalBalcao: 0,
    ticketMedio: 0,
    produtosMaisVendidos: [],
    categoriasMaisVendidas: [],
    vendasPorPeriodo: [],
    mesasMaisUtilizadas: [],
    comandasFechadas: [],
    resumoPorTipoVenda: {
      comanda: { quantidade: 0, total: 0, ticketMedio: 0 },
      balcao: { quantidade: 0, total: 0, ticketMedio: 0 }
    },
    distribuiçãoVendas: {
      comanda: 0,
      balcao: 0
    },
    tiposVenda: []
  });

  // ✅ NOVO: Verificar se tem permissão para acessar relatórios
  if (!podeVerRelatorios) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center mt-12">
          <div className="bg-red-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Lock className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Acesso Negado</h2>
          <p className="text-gray-600 mb-6">
            Você não tem permissão para visualizar relatórios.
            {usuarioLogado && (
              <span className="block mt-2 text-sm text-gray-500">
                Função: {usuarioLogado.role.toUpperCase()}
              </span>
            )}
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Voltar para Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const buscarRelatorios = async () => {
  setCarregando(true);
  setErro(null);
  try {
    let url = `/api/relatorios?periodo=${periodo}&tipoVenda=${tipoVenda}`;
    if (periodo === 'personalizado' && dataInicio && dataFim) {
      url += `&dataInicio=${dataInicio}&dataFim=${dataFim}`;
    }
    
    console.log('📡 Buscando relatórios:', url);
    
    const response = await fetch(url);
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Dados recebidos:', result.data);
      setDados(result.data);
    } else {
      setErro(result.error || 'Erro ao carregar relatórios');
      // Dados padrão completos que atendem à interface
      setDados({
        totalVendas: 0,
        totalComandas: 0,
        totalBalcao: 0, // ADICIONAR ESTA LINHA
        ticketMedio: 0,
        produtosMaisVendidos: [],
        categoriasMaisVendidas: [],
        vendasPorPeriodo: [],
        mesasMaisUtilizadas: [],
        comandasFechadas: [],
        resumoPorTipoVenda: { // ADICIONAR ESTE OBJETO
          comanda: { quantidade: 0, total: 0, ticketMedio: 0 },
          balcao: { quantidade: 0, total: 0, ticketMedio: 0 }
        },
        distribuiçãoVendas: { // ADICIONAR ESTE OBJETO
          comanda: 0,
          balcao: 0
        },
        tiposVenda: [] // ADICIONAR ESTA LINHA
      });
    }
  } catch (error: any) {
    console.error('❌ Erro ao buscar relatórios:', error);
    setErro('Erro de conexão com o servidor: ' + error.message);
    // Dados padrão completos para o estado de erro
    setDados({
      totalVendas: 0,
      totalComandas: 0,
      totalBalcao: 0,
      ticketMedio: 0,
      produtosMaisVendidos: [],
      categoriasMaisVendidas: [],
      vendasPorPeriodo: [],
      mesasMaisUtilizadas: [],
      comandasFechadas: [],
      resumoPorTipoVenda: {
        comanda: { quantidade: 0, total: 0, ticketMedio: 0 },
        balcao: { quantidade: 0, total: 0, ticketMedio: 0 }
      },
      distribuiçãoVendas: {
        comanda: 0,
        balcao: 0
      },
      tiposVenda: []
    });
  } finally {
    setCarregando(false);
  }
};

  const exportarCSV = () => {
    if (!dados) return;
    
    const headers = ['Data', 'Mesa', 'Total', 'Itens', 'Pagamentos'];
    const rows = dados.comandasFechadas.map(comanda => [
      new Date(comanda.fechadoEm).toLocaleDateString('pt-BR'),
      comanda.numeroMesa,
      `R$ ${comanda.total.toFixed(2)}`,
      comanda.itens.length,
      comanda.pagamentos?.map((p: any) => p.forma).join(', ') || 'N/A'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-vendas-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const imprimirRelatorio = () => {
    window.print();
  };

  // ✅ NOVO: Banner de permissões
  const renderizarBannerPermissoes = () => {
    return (
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start">
          <BarChart3 className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">
              Acesso a Relatórios
            </h3>
            <div className="mt-1 text-sm text-blue-700">
              <p>
                Você tem permissão para visualizar relatórios do sistema.
              </p>
              {usuarioLogado && (
                <div className="flex items-center mt-2 space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    usuarioLogado.role === 'admin' ? 'bg-red-100 text-red-800' :
                    usuarioLogado.role === 'gerente' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {usuarioLogado.role.toUpperCase()}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-800">
                    Acesso Concedido
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (carregando && podeVerRelatorios) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  if (erro && !dados && podeVerRelatorios) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl mx-auto mt-8">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h2 className="text-xl font-bold text-gray-900">Erro ao Carregar Relatórios</h2>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{erro}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={buscarRelatorios}
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
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <BarChart3 className="text-blue-600" size={32} />
              Relatórios
            </h1>
            <p className="text-gray-600 mt-1">
              Análise de vendas, produtos e desempenho do restaurante
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={exportarCSV}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
              title="Exportar dados para CSV"
            >
              <Download size={18} />
              Exportar CSV
            </button>
            <button
              onClick={imprimirRelatorio}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
              title="Imprimir relatório"
            >
              <Printer size={18} />
              Imprimir
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-gray-500" />
          <h2 className="font-semibold text-gray-800">Filtrar por Período</h2>
        </div>
        
        <FiltrosPeriodo
          periodo={periodo}
          dataInicio={dataInicio}
          dataFim={dataFim}
          tipoVenda={tipoVenda}
          onPeriodoChange={setPeriodo}
          onDataInicioChange={setDataInicio}
          onDataFimChange={setDataFim}
          onTipoVendaChange={setTipoVenda}
          onBuscar={buscarRelatorios}
        />
      </div>

      {/* Métricas Rápidas */}
      {dados && <MetricasResumo dados={dados} />}

      {/* Tabs de Visualização ATUALIZADAS */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex flex-wrap -mb-px gap-2">
            <button
              onClick={() => setVisaoAtiva('visao-geral')}
              className={`mr-2 py-3 px-4 border-b-2 font-medium text-sm rounded-t-lg ${visaoAtiva === 'visao-geral'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <BarChart3 size={18} className="inline mr-2" />
              Visão Geral
            </button>
            <button
              onClick={() => setVisaoAtiva('produtos')}
              className={`mr-2 py-3 px-4 border-b-2 font-medium text-sm rounded-t-lg ${visaoAtiva === 'produtos'
                  ? 'border-orange-500 text-orange-600 bg-orange-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <Package size={18} className="inline mr-2" />
              Análise de Produtos
            </button>
            <button
              onClick={() => setVisaoAtiva('vendas')}
              className={`mr-2 py-3 px-4 border-b-2 font-medium text-sm rounded-t-lg ${visaoAtiva === 'vendas'
                  ? 'border-green-500 text-green-600 bg-green-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <DollarSign size={18} className="inline mr-2" />
              Vendas Detalhadas
            </button>
            <button
              onClick={() => setVisaoAtiva('categorias')}
              className={`py-3 px-4 border-b-2 font-medium text-sm rounded-t-lg ${visaoAtiva === 'categorias'
                  ? 'border-purple-500 text-purple-600 bg-purple-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <Users size={18} className="inline mr-2" />
              Categorias
            </button>
          </nav>
        </div>
      </div>

      {/* Conteúdo das Tabs */}
      {visaoAtiva === 'visao-geral' && dados && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-semibold text-lg mb-4">Vendas por Período</h3>
            <GraficoVendas dados={dados.vendasPorPeriodo} periodo={periodo} />
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-semibold text-lg mb-4">Categorias Mais Vendidas</h3>
            <GraficoCategorias dados={dados.categoriasMaisVendidas} />
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 lg:col-span-2">
            <h3 className="font-semibold text-lg mb-4">Produtos Mais Vendidos</h3>
            <TopProdutos produtos={dados.produtosMaisVendidos} />
          </div>
        </div>
      )}

      {visaoAtiva === 'produtos' && dados && (
        <div className="space-y-6">
          {/* Guia de Compras */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg text-gray-800">Guia de Compras - Recomendações</h3>
              <button
                onClick={() => setMostrarGuiaCompras(!mostrarGuiaCompras)}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center gap-2"
              >
                {mostrarGuiaCompras ? 'Ocultar' : 'Mostrar'} Guia
                <ChevronDown size={16} className={mostrarGuiaCompras ? 'transform rotate-180' : ''} />
              </button>
            </div>
            
            {mostrarGuiaCompras && (
              <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-2">Como usar o guia de compras:</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• <strong>Dias Restantes</strong>: Estoque atual ÷ Vendas médias diárias</li>
                      <li>• <strong>Status Crítico</strong>: Menos de 3 dias de estoque</li>
                      <li>• <strong>Status Atenção</strong>: Entre 3 e 7 dias de estoque</li>
                      <li>• <strong>Status OK</strong>: Mais de 7 dias de estoque</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            {mostrarGuiaCompras && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estoque Atual</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendas Diárias</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dias Restantes</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recomendação</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dadosComprasExemplo.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{item.produto}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-blue-600">{item.estoqueAtual}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium">{item.vendasDiarias.toFixed(1)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-bold ${item.diasRestantes < 3 ? 'text-red-600' : item.diasRestantes < 7 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {item.diasRestantes.toFixed(1)} dias
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${item.status === 'critico' ? 'bg-red-100 text-red-800' : item.status === 'atencao' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                            {item.status === 'critico' ? 'CRÍTICO' : item.status === 'atencao' ? 'ATENÇÃO' : 'OK'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-medium ${item.status === 'critico' ? 'text-red-600' : item.status === 'atencao' ? 'text-yellow-600' : 'text-green-600'}`}>
                            {item.recomendacao}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Cards de Média */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <CardMediaVendas
              titulo="Segunda-feira"
              periodo="Últimas 4 semanas"
              mediaQuantidade={45.2}
              mediaValor={1250.80}
              variacao={8.5}
              descricao="Crescimento consistente"
            />
            <CardMediaVendas
              titulo="Terça-feira"
              periodo="Últimas 4 semanas"
              mediaQuantidade={52.7}
              mediaValor={1480.30}
              variacao={12.3}
              descricao="Melhor dia da semana"
            />
            <CardMediaVendas
              titulo="Fim de Semana"
              periodo="Últimas 4 semanas"
              mediaQuantidade={128.4}
              mediaValor={3850.90}
              variacao={15.8}
              descricao="Alta demanda"
            />
            <CardMediaVendas
              titulo="Semana Inteira"
              periodo="Último mês"
              mediaQuantidade={85.3}
              mediaValor={2560.50}
              variacao={5.2}
              descricao="Crescimento estável"
            />
          </div>

          {/* Análise Detalhada de Produtos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg text-gray-800">Top Produtos</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setOrdenacaoProdutos('quantidade')}
                      className={`px-3 py-1 text-sm rounded-lg ${ordenacaoProdutos === 'quantidade' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}
                    >
                      Por Quantidade
                    </button>
                    <button
                      onClick={() => setOrdenacaoProdutos('total')}
                      className={`px-3 py-1 text-sm rounded-lg ${ordenacaoProdutos === 'total' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                    >
                      Por Valor
                    </button>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Buscar produto..."
                      value={filtroProdutos}
                      onChange={(e) => setFiltroProdutos(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantidade</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Média</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dados.produtosMaisVendidos
                        .filter(produto => 
                          produto.nome.toLowerCase().includes(filtroProdutos.toLowerCase()) ||
                          produto.categoria.toLowerCase().includes(filtroProdutos.toLowerCase())
                        )
                        .map((produto, index) => (
                          <tr 
                            key={produto.id} 
                            className={`hover:bg-gray-50 cursor-pointer ${produtoSelecionado?.id === produto.id ? 'bg-blue-50' : ''}`}
                            onClick={() => setProdutoSelecionado(produto)}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <span className="text-blue-600 font-bold">
                                    {index + 1}
                                  </span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {produto.nome}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    ID: {produto.id?.toString().substring(0, 8)}...
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                                {produto.categoria}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                <span className="font-bold text-gray-900">
                                  {produto.quantidade}
                                </span>
                                {index < 3 && (
                                  <TrendingUp size={16} className="ml-2 text-green-500" />
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-bold text-green-600">
                                R$ {produto.total.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-gray-600">
                                R$ {(produto.total / produto.quantidade).toFixed(2)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProdutoSelecionado(produto);
                                }}
                                className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-lg hover:bg-blue-200"
                              >
                                Analisar
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Painel de Análise do Produto Selecionado */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="font-semibold text-lg text-gray-800 mb-4">
                {produtoSelecionado ? 'Análise do Produto' : 'Selecione um Produto'}
              </h3>
              
              {produtoSelecionado ? (
                <div className="space-y-4">
                  {/* Info do Produto */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-bold text-gray-900 mb-2">{produtoSelecionado.nome}</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-600">Categoria</p>
                        <p className="font-medium">{produtoSelecionado.categoria}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Vendas Totais</p>
                        <p className="font-bold text-green-600">{produtoSelecionado.quantidade} un.</p>
                      </div>
                    </div>
                  </div>

                  {/* Estatísticas */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Média Diária</p>
                      <p className="text-xl font-bold text-blue-600">
                        {(produtoSelecionado.quantidade / 30).toFixed(1)}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600">Valor Médio</p>
                      <p className="text-xl font-bold text-green-600">
                        R$ {(produtoSelecionado.total / produtoSelecionado.quantidade).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Tendência */}
                  {carregandoTendencia ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : tendenciaProduto ? (
                    <>
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Tendência (30 dias)</h4>
                        <GraficoTendenciaProdutos 
                          dados={tendenciaProduto.tendencia} 
                          tipoPeriodo="dia" 
                        />
                      </div>
                      
                      {/* Estatísticas da Tendência */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm font-medium text-yellow-800">Insights</span>
                        </div>
                        <div className="space-y-1 text-sm text-yellow-700">
                          <p>• Vendas médias diárias: {tendenciaProduto.estatisticas.mediaDiaria.toFixed(1)} un.</p>
                          <p>• {tendenciaProduto.estatisticas.diasComVenda} dias com venda</p>
                          <p>• Variação: {tendenciaProduto.estatisticas.variacao.toFixed(1)}%</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <BarChart className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>Clique em "Analisar" para ver tendências</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Selecione um produto da lista</p>
                  <p className="text-sm mt-1">para ver análise detalhada</p>
                </div>
              )}
            </div>
           

          </div>
        </div>
      )}

      

      {/* Restante do código mantido (abas de vendas e categorias) */}
      {visaoAtiva === 'vendas' && dados && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-lg mb-4">Vendas Detalhadas</h3>
          <div className="mb-6">
            <GraficoVendas dados={dados.vendasPorPeriodo} periodo={periodo} />
          </div>
          <RelatorioVendas comandas={dados.comandasFechadas} />
        </div>
      )}

      {visaoAtiva === 'categorias' && dados && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-lg mb-4">Análise por Categoria</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GraficoCategorias dados={dados.categoriasMaisVendidas} />
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Categorias por Valor</h4>
              <div className="space-y-3">
                {dados.categoriasMaisVendidas.map((cat: any, index: number) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{cat.nome}</span>
                      <span className="text-green-600 font-bold">
                        R$ {cat.total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 mt-1">
                      <span>{cat.quantidade} unidades</span>
                      <span>Média: R$ {(cat.total / cat.quantidade).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
