'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';

interface TopProdutosProps {
  produtos: any[];
}

export default function TopProdutos({ produtos }: TopProdutosProps) {
  if (!produtos || produtos.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        Nenhum produto vendido no período
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Produto
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Categoria
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Quantidade
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Média
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {produtos.map((produto, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-bold">
                      {index + 1}
                    </span>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {produto.nome}
                    </div>
                    <div className="text-xs text-gray-500">
                      ID: {produto.id?.toString().substring(0, 8)}...
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                  {produto.categoria}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center">
                  <span className="font-bold text-gray-900">
                    {produto.quantidade}
                  </span>
                  {index < 3 && (
                    <TrendingUp size={16} className="ml-2 text-green-500" />
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="font-bold text-green-600">
                  R$ {produto.total.toFixed(2)}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="text-gray-600">
                  R$ {(produto.total / produto.quantidade).toFixed(2)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}