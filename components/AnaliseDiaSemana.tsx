// components/AnaliseDiaSemana.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  Target,
  PieChart,
  LineChart,
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
  Filter,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';

interface AnaliseDiaSemanaProps {
  produtoId: string;
  produtoNome: string;
  periodo?: {  // ← Adicione esta linha (opcional com ?)
    dataInicio: string;
    dataFim: string;
  };
  onClose: () => void;
}

interface DiaVenda {
  diaSemana: number;
  nomeDia: string;
  diaAbreviado: string;
  quantidade: number;
  total: number;
  quantidadeDias: number;
  mediaPorDia: number;
  mediaValorPorDia: number;
  diasUnicos: string[];
}

export default function AnaliseDiaSemana({ produtoId, produtoNome, onClose }: AnaliseDiaSemanaProps) {
  const [diasSelecionados, setDiasSelecionados] = useState<number[]>([1, 2, 3, 4, 5]); // Seg-Sex por padrão
  const [periodo, setPeriodo] = useState('30dias');
  const [carregando, setCarregando] = useState(false);
  const [dados, setDados] = useState<any>(null);
  const [expandido, setExpandido] = useState(false);
  
  const diasDaSemana = [
    { id: 0, nome: 'Domingo', abreviado: 'Dom', cor: 'bg-red-100 text-red-800' },
    { id: 1, nome: 'Segunda-feira', abreviado: 'Seg', cor: 'bg-blue-100 text-blue-800' },
    { id: 2, nome: 'Terça-feira', abreviado: 'Ter', cor: 'bg-green-100 text-green-800' },
    { id: 3, nome: 'Quarta-feira', abreviado: 'Qua', cor: 'bg-yellow-100 text-yellow-800' },
    { id: 4, nome: 'Quinta-feira', abreviado: 'Qui', cor: 'bg-purple-100 text-purple-800' },
    { id: 5, nome: 'Sexta-feira', abreviado: 'Sex', cor: 'bg-pink-100 text-pink-800' },
    { id: 6, nome: 'Sábado', abreviado: 'Sáb', cor: 'bg-indigo-100 text-indigo-800' }
  ];

  const presets = {
    'dias-uteis': [1, 2, 3, 4, 5],
    'fim-semana': [0, 6],
    'segunda': [1],
    'terca': [2],
    'quarta': [3],
    'quinta': [4],
    'sexta': [5],
    'sabado': [6],
    'domingo': [0],
    'todos': [0, 1, 2, 3, 4, 5, 6]
  };

  useEffect(() => {
    buscarDados();
  }, [produtoId, diasSelecionados, periodo]);

  const buscarDados = async () => {
    setCarregando(true);
    try {
      const diasParam = diasSelecionados.join(',');
      const response = await fetch(
        `/api/relatorios/vendas-por-dia?produtoId=${produtoId}&dias=${diasParam}&periodo=${periodo}`
      );
      const result = await response.json();
      
      if (result.success) {
        setDados(result.data);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setCarregando(false);
    }
  };

  const toggleDia = (diaId: number) => {
    setDiasSelecionados(prev => 
      prev.includes(diaId) 
        ? prev.filter(d => d !== diaId)
        : [...prev, diaId]
    );
  };

  const aplicarPreset = (presetKey: keyof typeof presets) => {
    setDiasSelecionados(presets[presetKey]);
  };

  const calcularVariacao = () => {
    if (!dados?.vendasPorDia || dados.vendasPorDia.length < 2) return 0;
    
    const medias = dados.vendasPorDia.map((dia: DiaVenda) => dia.mediaPorDia);
    const max = Math.max(...medias);
    const min = Math.min(...medias);
    
    return min > 0 ? ((max - min) / min) * 100 : 0;
  };

  const encontrarMelhorPiorDia = () => {
    if (!dados?.vendasPorDia || dados.vendasPorDia.length === 0) {
      return { melhor: null, pior: null };
    }
    
    const vendas = dados.vendasPorDia;
    const melhor = vendas.reduce((prev: DiaVenda, current: DiaVenda) => 
      prev.mediaPorDia > current.mediaPorDia ? prev : current
    );
    
    const pior = vendas.reduce((prev: DiaVenda, current: DiaVenda) => 
      prev.mediaPorDia < current.mediaPorDia ? prev : current
    );
    
    return { melhor, pior };
  };

  const { melhor, pior } = encontrarMelhorPiorDia();
  const variacao = calcularVariacao();

  return (
    <div className="bg-white rounded-xl shadow-sm border p-5">
      {/* Cabeçalho */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            Análise por Dia da Semana
          </h3>
          <p className="text-sm text-gray-600 mt-1">{produtoNome}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Filtros Rápidos */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-700">Presets Rápidos</h4>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Filtrar:</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(presets).map(([key, value]) => (
            <button
              key={key}
              onClick={() => aplicarPreset(key as keyof typeof presets)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                JSON.stringify(diasSelecionados.sort()) === JSON.stringify(value.sort())
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {key.replace('-', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Seleção de Dias */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-700 mb-3">Selecionar Dias</h4>
        <div className="grid grid-cols-7 gap-2">
          {diasDaSemana.map(dia => (
            <button
              key={dia.id}
              onClick={() => toggleDia(dia.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${
                diasSelecionados.includes(dia.id)
                  ? `${dia.cor.split(' ')[0]} border-2 ${dia.cor.split(' ')[1]} font-bold`
                  : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg font-bold">{dia.abreviado}</span>
              <span className="text-xs mt-1">{dia.nome.split('-')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Período */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-gray-500" />
          <h4 className="font-medium text-gray-700">Período de Análise</h4>
        </div>
        <div className="flex gap-2 mt-2">
          {['7dias', '30dias', '90dias'].map(p => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-4 py-2 rounded-lg ${
                periodo === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p === '7dias' ? '7 dias' : p === '30dias' ? '30 dias' : '90 dias'}
            </button>
          ))}
        </div>
      </div>

      {/* Resultados */}
      {carregando ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : dados ? (
        <>
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-800">Média Total</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {dados.resumo.mediaGeralPorDia.toFixed(1)}
              </p>
              <p className="text-sm text-blue-700 mt-1">unidades/dia</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Variação</span>
              </div>
              <p className={`text-2xl font-bold ${variacao > 20 ? 'text-green-600' : variacao > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                {variacao.toFixed(1)}%
              </p>
              <p className="text-sm text-green-700 mt-1">entre melhor e pior dia</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-purple-800">Dias Analisados</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {dados.resumo.totalDiasUnicos}
              </p>
              <p className="text-sm text-purple-700 mt-1">dias únicos com venda</p>
            </div>
          </div>

          {/* Melhor e Pior Dia */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {melhor && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="font-bold text-green-800">🏆 Melhor Dia</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl font-bold text-green-700">{melhor.nomeDia}</p>
                    <p className="text-sm text-green-600">Média: {melhor.mediaPorDia.toFixed(1)} unidades</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">{melhor.quantidade}</p>
                    <p className="text-sm text-green-600">total</p>
                  </div>
                </div>
              </div>
            )}

            {pior && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  <span className="font-bold text-red-800">📉 Pior Dia</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xl font-bold text-red-700">{pior.nomeDia}</p>
                    <p className="text-sm text-red-600">Média: {pior.mediaPorDia.toFixed(1)} unidades</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-600">{pior.quantidade}</p>
                    <p className="text-sm text-red-600">total</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tabela Detalhada */}
          <div className="mb-4">
            <button
              onClick={() => setExpandido(!expandido)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
            >
              {expandido ? 'Ocultar Detalhes' : 'Ver Detalhes por Dia'}
              {expandido ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {expandido && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dia</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Vendido</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dias com Venda</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Média/Dia</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Médio</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participação</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dados.vendasPorDia.map((dia: DiaVenda, index: number) => {
                    const participacao = (dia.quantidade / dados.resumo.totalQuantidade) * 100;
                    return (
                      <tr key={dia.diaSemana} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                              diasDaSemana[dia.diaSemana - 1]?.cor.split(' ')[0]
                            }`}>
                              <span className={`text-sm font-bold ${
                                diasDaSemana[dia.diaSemana - 1]?.cor.split(' ')[1]
                              }`}>
                                {dia.diaAbreviado}
                              </span>
                            </div>
                            <span className="font-medium">{dia.nomeDia}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-green-600">{dia.quantidade} un.</span>
                          <p className="text-xs text-gray-500">R$ {dia.total.toFixed(2)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium">{dia.quantidadeDias} dias</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-blue-600">{dia.mediaPorDia.toFixed(1)}</span>
                          <p className="text-xs text-gray-500">unidades/dia</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-700">R$ {dia.mediaValorPorDia.toFixed(2)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm">{participacao.toFixed(1)}%</span>
                              <span className="text-sm font-medium">
                                {dia === melhor ? '🏆' : dia === pior ? '📉' : ''}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${participacao}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Insights */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800 mb-2">Insights para Compras</h4>
                <div className="space-y-1 text-sm text-yellow-700">
                  {melhor && pior && (
                    <>
                      <p>• <strong>{melhor.nomeDia}</strong> vende {melhor.mediaPorDia.toFixed(1)}x mais que <strong>{pior.nomeDia}</strong></p>
                      <p>• Estoque para {melhor.nomeDia} deve ser {Math.ceil(melhor.mediaPorDia * 1.2)} unidades</p>
                      <p>• Considere promoções no {pior.nomeDia} para aumentar vendas</p>
                    </>
                  )}
                  <p>• Planeje compras baseado na média de {dados.resumo.mediaGeralPorDia.toFixed(1)} unidades/dia</p>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Selecione os dias e período para ver a análise</p>
        </div>
      )}
    </div>
  );
}