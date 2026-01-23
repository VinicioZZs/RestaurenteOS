'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface GraficoVendasProps {
  dados: any[];
  periodo: string;
}

export default function GraficoVendas({ dados, periodo }: GraficoVendasProps) {
  if (!dados || dados.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        Nenhum dado disponível para o período selecionado
      </div>
    );
  }

  const ChartComponent = periodo === 'hoje' ? BarChart : LineChart;

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent data={dados}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="periodo" 
            stroke="#666"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            stroke="#666"
            tickFormatter={(value) => `R$ ${value}`}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Total']}
            labelFormatter={(label) => `Período: ${label}`}
          />
          {periodo === 'hoje' ? (
            <Bar 
              dataKey="total" 
              fill="#3b82f6" 
              radius={[4, 4, 0, 0]}
              name="Vendas"
            />
          ) : (
            <Line 
              type="monotone" 
              dataKey="total" 
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Vendas"
            />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}