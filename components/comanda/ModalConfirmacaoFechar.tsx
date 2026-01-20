// components/comanda/ModalConfirmacaoFechar.tsx
'use client';

interface ModalConfirmacaoFecharProps {
  aberto: boolean;
  quantidadeItensNaoSalvos: number;
  valorItensNaoSalvos: number;
  onCancelar: () => void;
  onSalvarEFechar: () => void;
  onFecharSemSalvar: () => void;
  onConfirmar?: () => void; // ← Opcional com "?"
}

export default function ModalConfirmacaoFechar({
  aberto,
  quantidadeItensNaoSalvos,
  valorItensNaoSalvos,
  onConfirmar,
  onCancelar,
  onSalvarEFechar,
  onFecharSemSalvar
}: ModalConfirmacaoFecharProps) {
  
  if (!aberto) return null;
  
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-6">
          <div className="flex items-start mb-6">
            <div className="bg-yellow-100 p-3 rounded-full mr-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-800">
                Itens não salvos na comanda!
              </h3>
              <p className="text-gray-600 mt-1">
                Você tem {quantidadeItensNaoSalvos} item{quantidadeItensNaoSalvos !== 1 ? 's' : ''} não salvo{quantidadeItensNaoSalvos !== 1 ? 's' : ''}.
              </p>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-yellow-800 font-medium">Itens não salvos:</span>
              <span className="font-bold">{quantidadeItensNaoSalvos} item{quantidadeItensNaoSalvos !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-yellow-800 font-medium">Valor total:</span>
              <span className="font-bold text-green-600">
                R$ {valorItensNaoSalvos.toFixed(2)}
              </span>
            </div>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-700 mb-2">O que você deseja fazer?</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="bg-blue-100 p-2 rounded-full">
                  <span className="text-blue-600">💾</span>
                </div>
                <div>
                  <p className="font-medium text-blue-800">Salvar e continuar fechando</p>
                  <p className="text-sm text-blue-600">Salva os itens e abre o pagamento</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="bg-red-100 p-2 rounded-full">
                  <span className="text-red-600">⚠️</span>
                </div>
                <div>
                  <p className="font-medium text-red-800">Fechar sem salvar</p>
                  <p className="text-sm text-red-600">Os itens não salvos serão perdidos</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="bg-gray-100 p-2 rounded-full">
                  <span className="text-gray-600">↩️</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">Cancelar</p>
                  <p className="text-sm text-gray-600">Volta para a comanda</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onCancelar}
              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
            >
              Cancelar
            </button>
            
            <button
              onClick={onFecharSemSalvar}
              className="flex-1 py-3 border border-red-500 text-red-600 rounded-xl hover:bg-red-50 font-medium"
            >
              Fechar sem salvar
            </button>
            
            <button
              onClick={onSalvarEFechar}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold"
            >
              Salvar e Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}