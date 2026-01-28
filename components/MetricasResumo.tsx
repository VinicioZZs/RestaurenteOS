// components/MetricasResumo.tsx
'use client';

import { DollarSign, ShoppingCart, TrendingUp, Package, CreditCard, Users, Coffee } from 'lucide-react';

interface MetricasResumoProps {
  dados: {
    totalVendas: number;
    totalComandas: number;
    totalBalcao?: number; // TORNAR OPCIONAL para compatibilidade
    ticketMedio: number;
    produtosMaisVendidos: any[];
    mesasMaisUtilizadas: any[];
    tiposVenda?: any[]; // Adicionar para compatibilidade
  };
}

export default function MetricasResumo({ dados }: MetricasResumoProps) {
  // Calcular totalBalcao se não existir
  const totalBalcao = dados.totalBalcao || 
    (dados.tiposVenda?.find((t: any) => t.tipo === 'balcao')?.total || 0);
  
  const metricas = [
    {
      titulo: 'Total de Vendas',
      valor: `R$ ${dados.totalVendas.toFixed(2)}`,
      icon: DollarSign,
      cor: 'bg-green-500',
      textoCor: 'text-green-700',
      bgCor: 'bg-green-50',
      descricao: `${dados.totalComandas + totalBalcao} vendas no total`
    },
    {
      titulo: 'Comandas Fechadas',
      valor: dados.totalComandas,
      icon: ShoppingCart,
      cor: 'bg-blue-500',
      textoCor: 'text-blue-700',
      bgCor: 'bg-blue-50',
      descricao: 'Vendas em mesas'
    },
    {
      titulo: 'Vendas Balcão',
      valor: totalBalcao,
      icon: Coffee,
      cor: 'bg-orange-500',
      textoCor: 'text-orange-700',
      bgCor: 'bg-orange-50',
      descricao: 'Vendas diretas no balcão'
    },
    {
      titulo: 'Ticket Médio',
      valor: `R$ ${dados.ticketMedio.toFixed(2)}`,
      icon: TrendingUp,
      cor: 'bg-purple-500',
      textoCor: 'text-purple-700',
      bgCor: 'bg-purple-50',
      descricao: 'Média por venda'
    },
    {
      titulo: 'Produtos Vendidos',
      valor: dados.produtosMaisVendidos.reduce((acc, prod) => acc + (prod.quantidade || 0), 0),
      icon: Package,
      cor: 'bg-pink-500',
      textoCor: 'text-pink-700',
      bgCor: 'bg-pink-50',
      descricao: 'Total de unidades'
    }
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {metricas.map((metrica, index) => (
          <div key={index} className={`${metrica.bgCor} rounded-xl p-4 shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{metrica.titulo}</p>
                <p className={`text-2xl font-bold mt-1 ${metrica.textoCor}`}>
                  {metrica.valor}
                </p>
                {metrica.descricao && (
                  <p className="text-xs text-gray-600 mt-1">{metrica.descricao}</p>
                )}
              </div>
              <div className={`${metrica.cor} p-3 rounded-lg`}>
                <metrica.icon size={24} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Distribuição por tipo de venda - OPCIONAL */}
      {(dados.tiposVenda && dados.tiposVenda.length > 0) && (
        <div className="mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Distribuição por Tipo de Venda</h3>
            <div className="space-y-3">
              {dados.tiposVenda.map((tipo: any, index: number) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      {tipo.tipo === 'comanda' ? (
                        <ShoppingCart size={18} className="text-blue-500 mr-2" />
                      ) : (
                        <Coffee size={18} className="text-orange-500 mr-2" />
                      )}
                      <span className="font-medium">
                        {tipo.tipo === 'comanda' ? 'Comandas' : 'Balcão'}
                      </span>
                    </div>
                    <span className="text-green-600 font-bold">
                      R$ {(tipo.total || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{tipo.quantidade || 0} vendas</span>
                    <span>
                      Ticket: R$ {(
                        (tipo.total || 0) / 
                        ((tipo.quantidade || 0) > 0 ? tipo.quantidade : 1)
                      ).toFixed(2)}
                    </span>
                    <span>
                      {dados.totalVendas > 0 
                        ? `${Math.round(((tipo.total || 0) / dados.totalVendas) * 100)}% do total`
                        : '0%'
                      }
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}