// components/comanda/ItensComanda.tsx
'use client';

interface ItemComanda {
  id: number;
  produtoId: number;
  quantidade: number;
  precoUnitario: number;
  produto: {
    nome: string;
    categoria: string;
  };
}

interface ItensComandaProps {
  itens: ItemComanda[];
  onRemover: (id: number) => void;
  onAtualizarQuantidade: (id: number, quantidade: number) => void;
}

export default function ItensComanda({ itens, onRemover, onAtualizarQuantidade }: ItensComandaProps) {
  if (itens.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Comanda Vazia</h3>
        <p className="text-gray-500">Adicione produtos para começar o pedido</p>
      </div>
    );
  }

  const totalComanda = itens.reduce((total, item) => 
    total + (item.precoUnitario * item.quantidade), 0
  );

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden mb-6">
      <div className="px-6 py-4 border-b">
        <h2 className="text-xl font-bold text-gray-800">Itens da Comanda</h2>
      </div>
      
      <div className="divide-y">
        {itens.map((item) => {
          const subtotal = item.precoUnitario * item.quantidade;
          
          return (
            <div key={item.id} className="p-6 hover:bg-gray-50 transition">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onAtualizarQuantidade(item.id, item.quantidade - 1)}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                      >
                        <span className="text-gray-600 font-bold">-</span>
                      </button>
                      
                      <span className="text-xl font-bold min-w-[40px] text-center">
                        {item.quantidade}x
                      </span>
                      
                      <button
                        onClick={() => onAtualizarQuantidade(item.id, item.quantidade + 1)}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                      >
                        <span className="text-gray-600 font-bold">+</span>
                      </button>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-gray-800 text-lg">
                        {item.produto.nome}
                      </h3>
                      <p className="text-gray-500 text-sm">
                        {item.produto.categoria}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-gray-600">Unitário</p>
                    <p className="font-semibold">
                      R$ {item.precoUnitario.toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-gray-600">Subtotal</p>
                    <p className="text-xl font-bold text-gray-800">
                      R$ {subtotal.toFixed(2)}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => onRemover(item.id)}
                    className="text-red-500 hover:text-red-700 p-2"
                    title="Remover item"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Total */}
      <div className="px-6 py-4 bg-gray-50 border-t">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-600">Total de itens: {itens.length}</p>
            <p className="text-gray-600">
              Quantidade total: {itens.reduce((sum, item) => sum + item.quantidade, 0)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-600 text-sm">TOTAL DA COMANDA</p>
            <p className="text-3xl font-bold text-gray-800">
              R$ {totalComanda.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}