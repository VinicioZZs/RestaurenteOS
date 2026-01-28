// components/ComparacaoProdutos.tsx
'use client';

import { useState } from 'react';
import { 
  BarChart3, 
  CheckCircle,
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  Target,
  X,
  Plus,
  Trash2,
  Calendar,
  ShoppingBag
} from 'lucide-react';

interface ComparacaoProdutosProps {
  produtos: any[];
}

export default function ComparacaoProdutos({ produtos }: ComparacaoProdutosProps) {
  const [produtosComparacao, setProdutosComparacao] = useState<any[]>([]);
  const [periodo, setPeriodo] = useState('30dias');
  const [diasSelecionados, setDiasSelecionados] = useState<number[]>([1,2,3,4,5]);

  const adicionarProduto = (produto: any) => {
    if (!produtosComparacao.find(p => p.id === produto.id)) {
      setProdutosComparacao([...produtosComparacao, produto]);
    }
  };

  const removerProduto = (produtoId: string) => {
    setProdutosComparacao(produtosComparacao.filter(p => p.id !== produtoId));
  };

  const diasDaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="bg-white rounded-xl shadow-sm border p-5">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-blue-600" />
        Comparação entre Produtos
      </h3>

      {/* Seleção de Produtos */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <ShoppingBag className="h-4 w-4 text-gray-500" />
          <span className="font-medium text-gray-700">Produtos para Comparar</span>
        </div>
        
        {/* Produtos Selecionados */}
        <div className="flex flex-wrap gap-2 mb-3">
          {produtosComparacao.map(produto => (
            <div key={produto.id} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg">
              <span className="font-medium">{produto.nome}</span>
              <button
                onClick={() => removerProduto(produto.id)}
                className="text-blue-500 hover:text-blue-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {produtosComparacao.length === 0 && (
            <p className="text-gray-500 text-sm">Nenhum produto selecionado</p>
          )}
        </div>

        {/* Lista de Sugestões */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {produtos.slice(0, 8).map(produto => (
            <button
              key={produto.id}
              onClick={() => adicionarProduto(produto)}
              disabled={produtosComparacao.find(p => p.id === produto.id)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                produtosComparacao.find(p => p.id === produto.id)
                  ? 'bg-green-100 border-green-300 text-green-800'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate">{produto.nome}</span>
                {produtosComparacao.find(p => p.id === produto.id) ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Plus className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {produto.quantidade} vendas • R$ {produto.total.toFixed(2)}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-700">Período</span>
          </div>
          <div className="flex gap-2">
            {['7dias', '30dias', '90dias'].map(p => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-3 py-1.5 text-sm rounded-lg ${
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

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-700">Dias da Semana</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {diasDaSemana.map((dia, index) => (
              <button
                key={index}
                onClick={() => {
                  if (diasSelecionados.includes(index)) {
                    setDiasSelecionados(diasSelecionados.filter(d => d !== index));
                  } else {
                    setDiasSelecionados([...diasSelecionados, index]);
                  }
                }}
                className={`px-2 py-1 text-xs rounded ${
                  diasSelecionados.includes(index)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {dia}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Resultados da Comparação */}
      {produtosComparacao.length > 0 ? (
        <div className="space-y-4">
          {/* Gráfico de Barras Simulado */}
          <div className="h-64 bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Gráfico de comparação</p>
                <p className="text-sm">(implementar gráfico com recharts)</p>
              </div>
            </div>
          </div>

          {/* Tabela de Comparação */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendas</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Média/Dia</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket Médio</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {produtosComparacao.map((produto, index) => (
                  <tr key={produto.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                          <span className="text-blue-600 font-bold">{index + 1}</span>
                        </div>
                        <span className="font-medium">{produto.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold">{produto.quantidade}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-blue-600">
                        {(produto.quantidade / 30).toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-green-600">
                        R$ {produto.total.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-700">
                        R$ {(produto.total / produto.quantidade).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => removerProduto(produto.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <PieChart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Adicione produtos para comparar</p>
          <p className="text-sm mt-1">Clique nos produtos acima</p>
        </div>
      )}
    </div>
  );
}