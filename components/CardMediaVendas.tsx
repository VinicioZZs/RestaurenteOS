// components/CardMediaVendas.tsx
'use client';

import { TrendingUp, TrendingDown, Minus, Calendar, Clock } from 'lucide-react';

interface CardMediaVendasProps {
  titulo: string;
  periodo: string;
  mediaQuantidade: number;
  mediaValor: number;
  variacao: number; // percentual
  descricao?: string;
}

export default function CardMediaVendas({
  titulo,
  periodo,
  mediaQuantidade,
  mediaValor,
  variacao,
  descricao
}: CardMediaVendasProps) {
  const getVariacaoIcon = () => {
    if (variacao > 5) {
      return <TrendingUp className="h-5 w-5 text-green-500" />;
    } else if (variacao < -5) {
      return <TrendingDown className="h-5 w-5 text-red-500" />;
    }
    return <Minus className="h-5 w-5 text-gray-500" />;
  };

  const getVariacaoColor = () => {
    if (variacao > 5) return 'text-green-600';
    if (variacao < -5) return 'text-red-600';
    return 'text-gray-600';
  };

  const getVariacaoBg = () => {
    if (variacao > 5) return 'bg-green-50 border-green-200';
    if (variacao < -5) return 'bg-red-50 border-red-200';
    return 'bg-gray-50 border-gray-200';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-gray-900">{titulo}</h3>
          <div className="flex items-center gap-1 mt-1">
            <Calendar className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-500">{periodo}</span>
          </div>
        </div>
        {getVariacaoIcon()}
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Média Unidades</p>
          <p className="text-xl font-bold text-blue-600">{mediaQuantidade.toFixed(1)}</p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-xs text-gray-600 mb-1">Média Valor</p>
          <p className="text-xl font-bold text-green-600">R$ {mediaValor.toFixed(2)}</p>
        </div>
      </div>
      
      <div className={`${getVariacaoBg()} border rounded-lg p-2`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Variação</span>
          </div>
          <span className={`font-bold ${getVariacaoColor()}`}>
            {variacao > 0 ? '+' : ''}{variacao.toFixed(1)}%
          </span>
        </div>
        {descricao && (
          <p className="text-xs text-gray-600 mt-2">{descricao}</p>
        )}
      </div>
    </div>
  );
}