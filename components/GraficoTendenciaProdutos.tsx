// components/GraficoTendenciaProdutos.tsx
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface TendenciaProduto {
  periodo: string;
  quantidade: number;
  total: number;
}

interface GraficoTendenciaProdutosProps {
  dados: TendenciaProduto[];
  tipoPeriodo: 'dia' | 'semana' | 'mes';
}

export default function GraficoTendenciaProdutos({ dados, tipoPeriodo }: GraficoTendenciaProdutosProps) {
  if (!dados || dados.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-gray-500">
        <p>Nenhum dado de tendência disponível</p>
        <p className="text-sm mt-1">Adicione vendas para ver as tendências</p>
      </div>
    );
  }

  // Calcular média
  const mediaQuantidade = dados.reduce((sum, item) => sum + item.quantidade, 0) / dados.length;
  const mediaTotal = dados.reduce((sum, item) => sum + item.total, 0) / dados.length;

  return (
    <div className="h-72">
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600">Média de Unidades</p>
          <p className="text-xl font-bold text-blue-600">{mediaQuantidade.toFixed(1)}</p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600">Média de Valor</p>
          <p className="text-xl font-bold text-green-600">R$ {mediaTotal.toFixed(2)}</p>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dados}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="periodo" 
            stroke="#666"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            yAxisId="left"
            stroke="#666"
            tickFormatter={(value) => value.toString()}
            tick={{ fontSize: 12 }}
            label={{ 
              value: 'Quantidade', 
              angle: -90, 
              position: 'insideLeft',
              offset: 10
            }}
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#666"
            tickFormatter={(value) => `R$ ${value}`}
            tick={{ fontSize: 12 }}
            label={{ 
              value: 'Valor (R$)', 
              angle: 90, 
              position: 'insideRight',
              offset: 10
            }}
          />
          <Tooltip 
            formatter={(value, name) => {
              if (name === 'quantidade') {
                return [value, 'Unidades'];
              }
              return [`R$ ${Number(value).toFixed(2)}`, 'Valor Total'];
            }}
            labelFormatter={(label) => `Período: ${label}`}
          />
          <Legend />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="quantidade" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name="Quantidade"
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="total" 
            stroke="#10b981" 
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name="Valor Total"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}