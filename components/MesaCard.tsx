// components/MesaCard.tsx
'use client';

interface MesaCardProps {
  mesa: {
    id: number;
    numero: string;
    status: 'livre' | 'ocupada' | 'reservada';
    clientes: number;
  };
  onClick: () => void;
}

export default function MesaCard({ mesa, onClick }: MesaCardProps) {
  const statusCores = {
    livre: 'bg-green-100 text-green-800 border-green-300',
    ocupada: 'bg-red-100 text-red-800 border-red-300',
    reservada: 'bg-yellow-100 text-yellow-800 border-yellow-300'
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl p-6 shadow-md border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
    >
      <div className="text-center">
        <div className="text-4xl font-bold text-gray-800 mb-2">
          {mesa.numero}
        </div>
        <div className={`inline-block px-4 py-1 rounded-full text-sm font-medium border ${statusCores[mesa.status]}`}>
          {mesa.status.charAt(0).toUpperCase() + mesa.status.slice(1)}
        </div>
      </div>
    </div>
  );
}