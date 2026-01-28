// components/FiltrosPeriodo.tsx
'use client';

import { Calendar, Search } from 'lucide-react';

interface FiltrosPeriodoProps {
  periodo: string;
  dataInicio: string;
  dataFim: string;
  tipoVenda: string; // NOVO: filtro por tipo de venda
  onPeriodoChange: (periodo: string) => void;
  onDataInicioChange: (data: string) => void;
  onDataFimChange: (data: string) => void;
  onTipoVendaChange: (tipo: string) => void; // NOVO
  onBuscar: () => void;
}

export default function FiltrosPeriodo({
  periodo,
  dataInicio,
  dataFim,
  tipoVenda, // NOVO
  onPeriodoChange,
  onDataInicioChange,
  onDataFimChange,
  onTipoVendaChange, // NOVO
  onBuscar
}: FiltrosPeriodoProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Filtro por tipo de venda - NOVO */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Venda
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'todos', label: 'Todas as Vendas', color: 'bg-gray-100' },
            { value: 'comanda', label: 'Comandas', color: 'bg-blue-100' },
            { value: 'balcao', label: 'Balcão', color: 'bg-green-100' }
          ].map((opcao) => (
            <button
              key={opcao.value}
              onClick={() => onTipoVendaChange(opcao.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tipoVenda === opcao.value
                  ? 'bg-blue-500 text-white'
                  : `${opcao.color} text-gray-700 hover:opacity-90`
                }`}
            >
              {opcao.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'hoje', label: 'Hoje' },
            { value: 'ontem', label: 'Ontem' },
            { value: 'semana', label: 'Última Semana' },
            { value: 'mes', label: 'Último Mês' },
            { value: 'personalizado', label: 'Personalizado' }
          ].map((opcao) => (
            <button
              key={opcao.value}
              onClick={() => onPeriodoChange(opcao.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${periodo === opcao.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {opcao.label}
            </button>
          ))}
        </div>

        {periodo === 'personalizado' && (
          <div className="flex flex-col md:flex-row gap-3 flex-1">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-gray-500" />
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => onDataInicioChange(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              />
              <span className="text-gray-500">até</span>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => onDataFimChange(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={onBuscar}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center gap-2"
            >
              <Search size={18} />
              Buscar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}