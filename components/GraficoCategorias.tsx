'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface GraficoCategoriasProps {
  dados: any[];
}

const CORES = [
  '#3b82f6', // Azul
  '#10b981', // Verde
  '#f59e0b', // Amarelo
  '#ef4444', // Vermelho
  '#8b5cf6', // Roxo
  '#ec4899', // Rosa
  '#06b6d4', // Ciano
  '#84cc16', // Verde-limão
];

export default function GraficoCategorias({ dados }: GraficoCategoriasProps) {
  if (!dados || dados.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        Nenhuma categoria com vendas
      </div>
    );
  }

  const dadosFormatados = dados.map((item, index) => ({
    name: item.nome,
    value: item.total,
    quantidade: item.quantidade,
    color: CORES[index % CORES.length]
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={dadosFormatados}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {dadosFormatados.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Total']}
            labelFormatter={(label) => `Categoria: ${label}`}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}