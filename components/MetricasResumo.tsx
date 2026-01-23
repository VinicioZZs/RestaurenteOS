'use client';

import { DollarSign, ShoppingCart, TrendingUp, Package, CreditCard, Users } from 'lucide-react';

interface MetricasResumoProps {
  dados: {
    totalVendas: number;
    totalComandas: number;
    ticketMedio: number;
    produtosMaisVendidos: any[];
    mesasMaisUtilizadas: any[];
  };
}

export default function MetricasResumo({ dados }: MetricasResumoProps) {
  const metricas = [
    {
      titulo: 'Total de Vendas',
      valor: `R$ ${dados.totalVendas.toFixed(2)}`,
      icon: DollarSign,
      cor: 'bg-green-500',
      textoCor: 'text-green-700',
      bgCor: 'bg-green-50'
    },
    {
      titulo: 'Comandas Fechadas',
      valor: dados.totalComandas,
      icon: ShoppingCart,
      cor: 'bg-blue-500',
      textoCor: 'text-blue-700',
      bgCor: 'bg-blue-50'
    },
    {
      titulo: 'Ticket Médio',
      valor: `R$ ${dados.ticketMedio.toFixed(2)}`,
      icon: TrendingUp,
      cor: 'bg-purple-500',
      textoCor: 'text-purple-700',
      bgCor: 'bg-purple-50'
    },
    {
      titulo: 'Produtos Vendidos',
      valor: dados.produtosMaisVendidos.reduce((acc, prod) => acc + prod.quantidade, 0),
      icon: Package,
      cor: 'bg-orange-500',
      textoCor: 'text-orange-700',
      bgCor: 'bg-orange-50'
    },
    {
      titulo: 'Mesas Ativas',
      valor: dados.mesasMaisUtilizadas.length,
      icon: Users,
      cor: 'bg-pink-500',
      textoCor: 'text-pink-700',
      bgCor: 'bg-pink-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {metricas.map((metrica, index) => (
        <div key={index} className={`${metrica.bgCor} rounded-xl p-4 shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{metrica.titulo}</p>
              <p className={`text-2xl font-bold mt-1 ${metrica.textoCor}`}>
                {metrica.valor}
              </p>
            </div>
            <div className={`${metrica.cor} p-3 rounded-lg`}>
              <metrica.icon size={24} className="text-white" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}