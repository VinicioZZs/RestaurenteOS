// omponents/comanda/ConfirmarRemocaoModal.tsx
'use client';

import { useState, useEffect } from 'react';

interface ConfirmarRemocaoModalProps {
  produtoNome: string;
  quantidadeAtual: number;
  precoUnitario: number;
  isOpen: boolean;
  onClose: () => void;
  onConfirmar: (quantidadeRemover: number) => void;
}

export default function ConfirmarRemocaoModal({
  produtoNome,
  quantidadeAtual,
  precoUnitario,
  isOpen,
  onClose,
  onConfirmar
}: ConfirmarRemocaoModalProps) {
  const [quantidadeRemover, setQuantidadeRemover] = useState(1);
  
  // Resetar quantidade quando modal abrir
  useEffect(() => {
    if (isOpen) {
      setQuantidadeRemover(1);
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  const subtotal = precoUnitario * quantidadeRemover;
  const valorTotalAtual = precoUnitario * quantidadeAtual;
  const valorRestante = precoUnitario * (quantidadeAtual - quantidadeRemover);
  
  const handleConfirmar = () => {
    if (quantidadeRemover > 0 && quantidadeRemover <= quantidadeAtual) {
      onConfirmar(quantidadeRemover);
      onClose();
    }
  };
  
  const handleRemoverTudo = () => {
    onConfirmar(quantidadeAtual);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Remover Produto</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>
        
        {/* Conteúdo */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-2">
              {produtoNome}
            </h3>
            <div className="flex justify-between text-sm text-gray-600 mb-4">
              <span>Quantidade atual: <span className="font-bold">{quantidadeAtual}x</span></span>
              <span>R$ {valorTotalAtual.toFixed(2)}</span>
            </div>
            
            {/* Seletor de quantidade */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Quantidade para remover:
              </label>
              
              <div className="flex items-center justify-center gap-4 mb-4">
                <button
                  onClick={() => setQuantidadeRemover(prev => Math.max(1, prev - 1))}
                  className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={quantidadeRemover <= 1}
                >
                  -
                </button>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-800">{quantidadeRemover}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    de {quantidadeAtual} disponíveis
                  </div>
                </div>
                
                <button
                  onClick={() => setQuantidadeRemover(prev => Math.min(quantidadeAtual, prev + 1))}
                  className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={quantidadeRemover >= quantidadeAtual}
                >
                  +
                </button>
              </div>
              
              {/* Slider para quantidades maiores */}
              {quantidadeAtual > 5 && (
                <div className="mt-4">
                  <input
                    type="range"
                    min="1"
                    max={quantidadeAtual}
                    value={quantidadeRemover}
                    onChange={(e) => setQuantidadeRemover(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>1</span>
                    <span>{Math.floor(quantidadeAtual / 2)}</span>
                    <span>{quantidadeAtual}</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Resumo financeiro */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor a remover:</span>
                  <span className="font-bold text-red-600">
                    -R$ {subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ficará na comanda:</span>
                  <span className="font-bold text-green-600">
                    {quantidadeAtual - quantidadeRemover}x • R$ {valorRestante.toFixed(2)}
                  </span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-medium">Diferença:</span>
                    <span className="font-bold text-blue-600">
                      R$ {(valorTotalAtual - valorRestante).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Botões de ação */}
          <div className="space-y-3">
            <button
              onClick={handleConfirmar}
              className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
            >
              Remover {quantidadeRemover}x ({quantidadeRemover === quantidadeAtual ? 'TUDO' : 'APENAS ESTES'})
            </button>
            
            {quantidadeRemover < quantidadeAtual && (
              <button
                onClick={handleRemoverTudo}
                className="w-full py-3 border-2 border-red-600 text-red-600 font-medium rounded-lg hover:bg-red-50"
              >
                ⚠️ Remover TODOS ({quantidadeAtual}x)
              </button>
            )}
            
            <button
              onClick={onClose}
              className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
        
        {/* Rodapé informativo */}
        <div className="p-4 border-t bg-gray-50 rounded-b-2xl">
          <p className="text-xs text-gray-600 text-center">
            Esta ação não pode ser desfeita automaticamente
          </p>
        </div>
      </div>
    </div>
  );
}
