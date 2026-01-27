'use client';

import { useState, useEffect } from 'react';
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
  Loader2
} from 'lucide-react';
import FiltrosPeriodo from '@/components/FiltrosPeriodo';
import GraficoVendas from '@/components/GraficoVendas';
import TopProdutos from '@/components/TopProdutos';
import MetricasResumo from '@/components/MetricasResumo';
import RelatorioVendas from '@/components/RelatorioVendas';
import GraficoCategorias from '@/components/GraficoCategorias';
import Link from 'next/link';

interface RelatorioData {
  totalVendas: number;
  totalComandas: number;
  ticketMedio: number;
  produtosMaisVendidos: any[];
  categoriasMaisVendidas: any[];
  vendasPorPeriodo: any[];
  mesasMaisUtilizadas: any[];
  comandasFechadas: any[];
}

interface UsuarioLogado {
  role: string;
  permissoes: Record<string, boolean>;
}

export default function RelatoriosPage() {
  const [periodo, setPeriodo] = useState('hoje');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [carregandoPermissoes, setCarregandoPermissoes] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [dados, setDados] = useState<RelatorioData | null>(null);
  const [visaoAtiva, setVisaoAtiva] = useState('resumo');
  
  // ✅ NOVO: Estado para usuário logado
  const [usuarioLogado, setUsuarioLogado] = useState<UsuarioLogado | null>(null);

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

  // ✅ NOVO: Verificar se pode visualizar relatórios
  const podeVerRelatorios = temPermissao('canViewReports');

  useEffect(() => {
    if (usuarioLogado !== null && podeVerRelatorios) {
      buscarRelatorios();
    }
  }, [periodo, dataInicio, dataFim, usuarioLogado, podeVerRelatorios]);

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
      let url = `/api/relatorios?periodo=${periodo}`;
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
        // Dados padrão vazios
        setDados({
          totalVendas: 0,
          totalComandas: 0,
          ticketMedio: 0,
          produtosMaisVendidos: [],
          categoriasMaisVendidas: [],
          vendasPorPeriodo: [],
          mesasMaisUtilizadas: [],
          comandasFechadas: []
        });
      }
    } catch (error: any) {
      console.error('❌ Erro ao buscar relatórios:', error);
      setErro('Erro de conexão com o servidor: ' + error.message);
      setDados(null);
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
            {usuarioLogado && (
              <div className="flex items-center mt-2">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  usuarioLogado.role === 'admin' ? 'bg-red-100 text-red-800' :
                  usuarioLogado.role === 'gerente' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {usuarioLogado.role.toUpperCase()}
                </span>
              </div>
            )}
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

      {/* ✅ NOVO: Banner de permissões */}
      {renderizarBannerPermissoes()}

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
          onPeriodoChange={setPeriodo}
          onDataInicioChange={setDataInicio}
          onDataFimChange={setDataFim}
          onBuscar={buscarRelatorios}
        />
      </div>

      {/* Métricas Rápidas */}
      {dados && <MetricasResumo dados={dados} />}

      {/* Tabs de Visualização */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex flex-wrap -mb-px">
            <button
              onClick={() => setVisaoAtiva('resumo')}
              className={`mr-6 py-2 px-1 border-b-2 font-medium text-sm ${
                visaoAtiva === 'resumo'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <TrendingUp size={18} className="inline mr-2" />
              Visão Geral
            </button>
            <button
              onClick={() => setVisaoAtiva('produtos')}
              className={`mr-6 py-2 px-1 border-b-2 font-medium text-sm ${
                visaoAtiva === 'produtos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package size={18} className="inline mr-2" />
              Produtos
            </button>
            <button
              onClick={() => setVisaoAtiva('vendas')}
              className={`mr-6 py-2 px-1 border-b-2 font-medium text-sm ${
                visaoAtiva === 'vendas'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DollarSign size={18} className="inline mr-2" />
              Vendas Detalhadas
            </button>
            <button
              onClick={() => setVisaoAtiva('categorias')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                visaoAtiva === 'categorias'
                  ? 'border-blue-500 text-blue-600'
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
      {visaoAtiva === 'resumo' && dados && (
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
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-lg mb-4">Análise de Produtos</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Top 10 Produtos por Quantidade</h4>
              <TopProdutos produtos={dados.produtosMaisVendidos} />
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Distribuição por Categoria</h4>
              <GraficoCategorias dados={dados.categoriasMaisVendidas} />
            </div>
          </div>
        </div>
      )}

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