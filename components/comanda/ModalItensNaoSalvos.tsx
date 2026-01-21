// components/comanda/ModalItensNaoSalvos.tsx
'use client';

import { Save, X, AlertTriangle } from 'lucide-react';

interface ModalItensNaoSalvosProps {
  aberto: boolean;
  quantidadeItensNaoSalvos: number;
  valorItensNaoSalvos: number;
  onCancelar: () => void;
  onSalvarEFechar: () => Promise<void> | void;
  onFecharSemSalvar: () => void;
  carregando?: boolean;
}

export default function ModalItensNaoSalvos({
  aberto,
  quantidadeItensNaoSalvos,
  valorItensNaoSalvos,
  onCancelar,
  onSalvarEFechar,
  onFecharSemSalvar,
  carregando = false
}: ModalItensNaoSalvosProps) {
  if (!aberto) return null;

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-start mb-6">
          <div className="bg-yellow-100 p-3 rounded-full mr-4">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">Itens não salvos</h3>
            <p className="text-gray-600 mt-1">
              Existem {quantidadeItensNaoSalvos} item{quantidadeItensNaoSalvos !== 1 ? 's' : ''} não salvo{quantidadeItensNaoSalvos !== 1 ? 's' : ''}!
            </p>
          </div>
        </div>

        {/* Detalhes */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {quantidadeItensNaoSalvos}
              </div>
              <div className="text-sm text-gray-600">Itens não salvos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {formatarMoeda(valorItensNaoSalvos)}
              </div>
              <div className="text-sm text-gray-600">Valor total</div>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-4 text-center">
            Estes itens serão perdidos se não forem salvos!
          </p>
        </div>

        {/* Opções */}
        <div className="space-y-3">
          <button
            onClick={onSalvarEFechar}
            disabled={carregando}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 font-medium flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {carregando ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                SALVAR E IR PARA PAGAMENTO
              </>
            )}
          </button>

          <button
            onClick={onFecharSemSalvar}
            className="w-full py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-medium"
          >
            <div className="flex items-center justify-center gap-2">
              <X className="h-5 w-5" />
              DESCARTAR ITENS E IR PARA PAGAMENTO
            </div>
            <p className="text-xs text-red-600 mt-1">
              {quantidadeItensNaoSalvos} item{quantidadeItensNaoSalvos !== 1 ? 's' : ''} serão perdidos!
            </p>
          </button>

          <button
            onClick={onCancelar}
            className="w-full py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
          >
            CANCELAR - VOLTAR À COMANDA
          </button>
        </div>
      </div>
    </div>
  );
}