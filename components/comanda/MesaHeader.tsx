// components/comanda/MesaHeader.tsx
'use client';

interface MesaHeaderProps {
  mesa: {
    numero: string;
    nome: string;
    status: string;
    capacidade: number;
  };
  total: number;
  onFecharConta: () => void;
}

export default function MesaHeader({ mesa, total, onFecharConta }: MesaHeaderProps) {
  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-3xl font-bold text-gray-800">
              {mesa.nome}
            </h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              mesa.status === 'ocupada' 
                ? 'bg-red-100 text-red-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {mesa.status === 'ocupada' ? 'Ocupada' : 'Livre'}
            </span>
          </div>
          
          <p className="text-gray-600">
            Capacidade: {mesa.capacidade} pessoas
          </p>
        </div>
        
        <div className="text-right">
          <p className="text-gray-600 mb-1">Total da Comanda</p>
          <p className="text-4xl font-bold text-gray-800">
            R$ {total.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}