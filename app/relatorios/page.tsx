'use client';

import { useState, useEffect, Suspense } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  DollarSign, 
  Filter,
  Download,
  Printer,
  Users,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

// Seus componentes (ajuste os caminhos de importação se necessário)
import FiltrosPeriodo from '@/components/FiltrosPeriodo';
import GraficoVendas from '@/components/GraficoVendas';
import TopProdutos from '@/components/TopProdutos';
import MetricasResumo from '@/components/MetricasResumo';
import RelatorioVendas from '@/components/RelatorioVendas';
import GraficoCategorias from '@/components/GraficoCategorias';

// Tipagem
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

function RelatoriosContent() {
  const [periodo, setPeriodo] = useState('hoje');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [dados, setDados] = useState<RelatorioData | null>(null);
  const [visaoAtiva, setVisaoAtiva] = useState('resumo');

  const buscarRelatorios = async () => {
    setCarregando(true);
    setErro(null);
    try {
      let url = `/api/relatorios?periodo=${periodo}`;
      if (periodo === 'personalizado' && dataInicio && dataFim) {
        url += `&dataInicio=${dataInicio}&dataFim=${dataFim}`;
      }
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setDados(result.data);
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      console.error('Erro:', error);
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarRelatorios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodo, dataInicio, dataFim]);

  const exportarCSV = () => {
    if (!dados) return;
    const headers = ['Data', 'Mesa', 'Total', 'Itens'];
    const rows = dados.comandasFechadas.map(comanda => [
      new Date(comanda.fechadoEm).toLocaleDateString('pt-BR'),
      comanda.numeroMesa,
      `R$ ${comanda.total.toFixed(2)}`,
      comanda.itens?.length || 0
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Calculando estatísticas...</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Erro ao carregar dados</h2>
        <p className="text-red-600 bg-red-50 px-4 py-2 rounded mb-4">{erro}</p>
        <button onClick={buscarRelatorios} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 fade-in">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="text-blue-600" size={32} />
            Relatórios Financeiros
          </h1>
          <p className="text-gray-500 mt-1">Visão geral do desempenho do seu negócio</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportarCSV} className="btn-secondary flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-50">
            <Download size={18} /> Exportar
          </button>
          <button onClick={() => window.print()} className="btn-primary flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            <Printer size={18} /> Imprimir
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
         <div className="flex items-center gap-2 mb-4 text-gray-700 font-medium">
            <Filter size={20} /> Filtros de Período
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

      {/* Cards de Resumo */}
      {dados && <MetricasResumo dados={dados} />}

      {/* Navegação de Abas */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-6 overflow-x-auto pb-1">
          {[
            { id: 'resumo', label: 'Visão Geral', icon: TrendingUp },
            { id: 'produtos', label: 'Produtos', icon: Package },
            { id: 'vendas', label: 'Histórico', icon: DollarSign },
            { id: 'categorias', label: 'Categorias', icon: Users },
          ].map((aba) => (
            <button
              key={aba.id}
              onClick={() => setVisaoAtiva(aba.id)}
              className={`flex items-center gap-2 pb-3 px-1 border-b-2 font-medium transition-colors whitespace-nowrap ${
                visaoAtiva === aba.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <aba.icon size={18} />
              {aba.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Conteúdo das Abas */}
      {dados && (
        <div className="space-y-6">
          {visaoAtiva === 'resumo' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="font-semibold text-lg mb-4">Vendas no Período</h3>
                <GraficoVendas dados={dados.vendasPorPeriodo} periodo={periodo} />
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="font-semibold text-lg mb-4">Categorias Principais</h3>
                <GraficoCategorias dados={dados.categoriasMaisVendidas} />
              </div>
              <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm">
                <h3 className="font-semibold text-lg mb-4">Top Produtos</h3>
                <TopProdutos produtos={dados.produtosMaisVendidos} />
              </div>
            </div>
          )}

          {visaoAtiva === 'produtos' && (
            <div className="bg-white p-6 rounded-xl shadow-sm">
               <h3 className="font-semibold text-lg mb-6">Detalhamento de Produtos</h3>
               <TopProdutos produtos={dados.produtosMaisVendidos} />
            </div>
          )}

          {visaoAtiva === 'vendas' && (
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="font-semibold text-lg mb-6">Registro de Comandas Fechadas</h3>
              <RelatorioVendas comandas={dados.comandasFechadas} />
            </div>
          )}
          
          {visaoAtiva === 'categorias' && (
             <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="font-semibold text-lg mb-6">Desempenho por Categoria</h3>
                <div className="h-80 w-full">
                  <GraficoCategorias dados={dados.categoriasMaisVendidas} />
                </div>
             </div>
          )}
        </div>
      )}
    </div>
  );
}

// O componente exportado DEVE envolver o conteúdo em Suspense
// Isso evita erros de hidratação no Next.js App Router
export default function RelatoriosPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Iniciando sistema de relatórios...</p>
        </div>
      </div>
    }>
      <RelatoriosContent />
    </Suspense>
  );
}