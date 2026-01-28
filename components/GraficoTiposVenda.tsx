// components/GraficoTiposVenda.tsx
'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface GraficoTiposVendaProps {
  dados: {
    comanda: number;
    balcao: number;
  };
}

const CORES = [
  '#3b82f6', // Azul para comandas
  '#f59e0b', // Laranja para balcão
];

export default function GraficoTiposVenda({ dados }: GraficoTiposVendaProps) {
  // Verificar se há dados
  const temDados = dados.comanda > 0 || dados.balcao > 0;
  
  if (!temDados) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        Nenhuma venda registrada
      </div>
    );
  }

  // Preparar dados para o gráfico
  const dadosFormatados = [
    { 
      name: 'Comandas', 
      value: dados.comanda,
      percent: dados.comanda > 0 ? dados.comanda / (dados.comanda + dados.balcao) * 100 : 0
    },
    { 
      name: 'Balcão', 
      value: dados.balcao,
      percent: dados.balcao > 0 ? dados.balcao / (dados.comanda + dados.balcao) * 100 : 0
    }
  ].filter(item => item.value > 0);

  // Se após filtrar não houver dados
  if (dadosFormatados.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        Nenhuma venda registrada
      </div>
    );
  }

  // Calcular percentuais totais
  const total = dadosFormatados.reduce((sum, item) => sum + item.value, 0);
  
  // Atualizar percentuais exatos
  const dadosComPercentuais = dadosFormatados.map(item => ({
    ...item,
    percent: total > 0 ? (item.value / total) * 100 : 0
  }));

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={dadosComPercentuais}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry) => {
              // Verificar se entry é válido e tem percent
              if (entry && typeof entry.percent === 'number') {
                return `${entry.name}: ${entry.percent.toFixed(0)}%`;
              }
              return `${entry.name}`;
            }}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {dadosComPercentuais.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value, name, props) => {
              if (props && props.payload && props.payload.percent !== undefined) {
                return [
                  `R$ ${Number(value).toFixed(2)} (${props.payload.percent.toFixed(1)}%)`,
                  name
                ];
              }
              return [`R$ ${Number(value).toFixed(2)}`, name];
            }}
            labelFormatter={(label) => `Tipo: ${label}`}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}