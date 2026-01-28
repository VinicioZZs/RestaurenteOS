'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Search, Filter } from 'lucide-react';

interface RelatorioVendasProps {
  comandas: any[];
}

export default function RelatorioVendas({ comandas }: RelatorioVendasProps) {
  const [filtro, setFiltro] = useState('');
  const [comandaExpandida, setComandaExpandida] = useState<string | null>(null);
  const [ordenacao, setOrdenacao] = useState({ campo: 'fechadoEm', direcao: 'desc' });

  const comandasFiltradas = comandas
    .filter(comanda => {
      if (!filtro) return true;
      const filtroLower = filtro.toLowerCase();
      return (
        comanda.numeroMesa?.toLowerCase().includes(filtroLower) ||
        comanda.nomeMesa?.toLowerCase().includes(filtroLower) ||
        comanda.total.toString().includes(filtro)
      );
    })
    .sort((a, b) => {
      const valorA = a[ordenacao.campo];
      const valorB = b[ordenacao.campo];
      
      if (ordenacao.direcao === 'asc') {
        return valorA < valorB ? -1 : 1;
      }
      return valorA > valorB ? -1 : 1;
    });

  const ordenar = (campo: string) => {
    setOrdenacao(prev => ({
      campo,
      direcao: prev.campo === campo && prev.direcao === 'desc' ? 'asc' : 'desc'
    }));
  };

  const totalGeral = comandasFiltradas.reduce((acc, comanda) => acc + (comanda.total || 0), 0);

  if (comandasFiltradas.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Nenhuma comanda encontrada
      </div>
    );
  }

  return (
    <div>
      {/* Filtro */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Filtrar por mesa, nome ou valor..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-hidden border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                onClick={() => ordenar('fechadoEm')}
              >
                <div className="flex items-center gap-1">
                  Data/Hora
                  {ordenacao.campo === 'fechadoEm' && (
                    ordenacao.direcao === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                onClick={() => ordenar('numeroMesa')}
              >
                <div className="flex items-center gap-1">
                  Mesa
                  {ordenacao.campo === 'numeroMesa' && (
                    ordenacao.direcao === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                onClick={() => ordenar('total')}
              >
                <div className="flex items-center gap-1">
                  Total
                  {ordenacao.campo === 'total' && (
                    ordenacao.direcao === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                  )}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Itens
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Ações
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                 Tipo
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {comandasFiltradas.map((comanda) => (
              <>
                <tr key={comanda._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900">
                      {new Date(comanda.fechadoEm).toLocaleDateString('pt-BR')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(comanda.fechadoEm).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">
                      {comanda.numeroMesa}
                    </div>
                    <div className="text-xs text-gray-500">
                      {comanda.nomeMesa}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-green-600">
                      R$ {comanda.total?.toFixed(2) || '0.00'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs bg-gray-100 rounded-full">
                      {comanda.itens?.length || 0} itens
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setComandaExpandida(
                        comandaExpandida === comanda._id ? null : comanda._id
                      )}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      {comandaExpandida === comanda._id ? 'Ocultar' : 'Ver itens'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    comanda.tipo === 'balcao' 
                      ? 'bg-orange-100 text-orange-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {comanda.tipo === 'balcao' ? 'BALCÃO' : 'COMANDA'}
                  </span>
                </td>
                </tr>
                
                {comandaExpandida === comanda._id && (
                  <tr>
                    <td colSpan={5} className="px-4 py-3 bg-gray-50">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-700 mb-2">Itens da Comanda</h4>
                        <div className="space-y-2">
                          {comanda.itens?.map((item: any, index: number) => (
                            <div key={index} className="flex justify-between items-center border-b pb-2">
                              <div>
                                <div className="font-medium">{item.nome}</div>
                                <div className="text-sm text-gray-600">
                                  {item.categoria} • {item.observacao || 'Sem observação'}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">
                                  {item.quantidade}x R$ {item.precoUnitario?.toFixed(2)}
                                </div>
                                <div className="text-green-600 font-bold">
                                  R$ {(item.quantidade * item.precoUnitario).toFixed(2)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        {comanda.pagamentos?.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <h4 className="font-medium text-gray-700 mb-2">Pagamentos</h4>
                            <div className="flex flex-wrap gap-2">
                              {comanda.pagamentos.map((pagamento: any, index: number) => (
                                <div key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                  {pagamento.forma}: R$ {pagamento.valor?.toFixed(2)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={2} className="px-4 py-3">
                <div className="font-bold text-gray-700">
                  Total Geral ({comandasFiltradas.length} comandas)
                </div>
              </td>
              <td colSpan={3} className="px-4 py-3 text-right">
                <div className="text-2xl font-bold text-green-600">
                  R$ {totalGeral.toFixed(2)}
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}