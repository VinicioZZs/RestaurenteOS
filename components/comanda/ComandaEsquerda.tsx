  // components/comanda/ComandaEsquerda.tsx - RETURN COMPLETO
  'use client';

  import { useState } from 'react';
  import PagamentoModal from '@/components/pagamento/PagamentoModal'; // <-- NOVO IMPORT


  // ========== ADICIONE ESTA INTERFACE ==========
  interface ItemComanda {
    id: number;
    produtoId: number;
    quantidade: number;
    precoUnitario: number;
    observacao: string;
    produto: {
      nome: string;
      categoria: string;
    };
  }

 interface ComandaEsquerdaProps {
  mesa: any;
  itensSalvos: ItemComanda[];
  itensNaoSalvos: ItemComanda[];
  totalComanda: number;
  totalPago: number;
  restantePagar: number;
  modificado: boolean;
  onRemoverItem: (itemId: number, tipo: 'salvo' | 'naoSalvo') => void;
  onAtualizarQuantidade: (itemId: number, novaQuantidade: number, tipo: 'salvo' | 'naoSalvo') => void;
  onAtualizarObservacao: (itemId: number, observacao: string, tipo: 'salvo' | 'naoSalvo') => void;
  onSalvarItens: () => void;
  onDescartarAlteracoes: () => void;
  onLimparComanda: () => void;
  onImprimirPrevia: () => void;
  onFecharConta: () => void;
  onVoltarDashboard: () => void;
  comandaId: string;
}

  export default function ComandaEsquerda({
    mesa,
    itensSalvos,
    itensNaoSalvos,
    totalComanda,
    totalPago,
    restantePagar,
    modificado,
    onRemoverItem,
    onAtualizarQuantidade,
    onAtualizarObservacao,
    onSalvarItens,
    onDescartarAlteracoes,
    onLimparComanda,
    onImprimirPrevia,
    onFecharConta,
    onVoltarDashboard,
    comandaId

  }: ComandaEsquerdaProps) {
    const [mostrarPagamento, setMostrarPagamento] = useState(false); // <-- ADICIONA AQUI
    const [editandoObservacao, setEditandoObservacao] = useState<number | null>(null);
    const [novaObservacao, setNovaObservacao] = useState('');
    const [tipoItemEditando, setTipoItemEditando] = useState<'salvo' | 'naoSalvo'>('salvo');

    const handleAtualizarComanda = async (comandaId: string, dados: any) => {
  try {
    console.log('💾 Salvando pagamento parcial no MongoDB...', { comandaId });
    
    // Chama a API que FUNCIONA (versão super simples)
    const response = await fetch('/api/comandas/pagamento-parcial', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comandaId,
        mesaId: mesa?.id || mesa?.numero,
        mesaNumero: mesa?.numero,
        mesaNome: mesa?.nome,
        dados,
      }),
    });

    const resultado = await response.json();
    
    if (!response.ok || !resultado.success) {
      throw new Error(resultado.message || 'Erro ao salvar no servidor');
    }
    
    console.log('✅ Pagamento salvo com sucesso:', resultado);
    return resultado;
    
  } catch (error: any) {
    console.error('❌ Erro ao salvar pagamento parcial:', error);
    
    // Mostra erro específico
    alert(`❌ Erro ao salvar no servidor:\n${error.message}\n\nVerifique se o MongoDB está rodando.`);
    
    // Rejeita a promise para que o PagamentoModal saiba que falhou
    throw error;
  }
};

    const iniciarEdicaoObservacao = (itemId: number, observacaoAtual: string, tipo: 'salvo' | 'naoSalvo') => {
      setEditandoObservacao(itemId);
      setNovaObservacao(observacaoAtual);
      setTipoItemEditando(tipo);
    };

    const salvarObservacao = () => {
      if (editandoObservacao !== null) {
        onAtualizarObservacao(editandoObservacao, novaObservacao, tipoItemEditando);
        setEditandoObservacao(null);
        setNovaObservacao('');
      }
    };

    // Calcular total de itens
    const totalItens = [...itensSalvos, ...itensNaoSalvos].reduce((sum, item) => sum + item.quantidade, 0);

      return (
    <div className="h-full flex flex-col">
      {/* Cabeçalho compacto */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{mesa?.nome}</h2>
            <p className="text-sm text-gray-500">Total: R$ {totalComanda.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-blue-700">
              R$ {restantePagar.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500">a pagar</p>
          </div>
        </div>
      </div>

      {/* Lista de Itens (COM SCROLL INTERNO) */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Itens da Comanda</h3>
            <span className="text-sm text-gray-500">
              {[...itensSalvos, ...itensNaoSalvos].reduce((sum, item) => sum + item.quantidade, 0)} un.
            </span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 scrollbar-custom">
          {[...itensSalvos, ...itensNaoSalvos].length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-3">🛒</div>
              <p>Comanda vazia</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...itensSalvos, ...itensNaoSalvos].map((item, index) => {
                const isNaoSalvo = index >= itensSalvos.length;
                const subtotal = item.precoUnitario * item.quantidade;
                
                return (
                  <div 
                    key={item.id} 
                    className={`border rounded-lg p-3 ${isNaoSalvo ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'}`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{item.produto.nome}</h4>
                          {isNaoSalvo && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                              PENDENTE
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{item.produto.categoria}</p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex items-center">
                          <button
                            onClick={() => onAtualizarQuantidade(item.id, item.quantidade - 1, isNaoSalvo ? 'naoSalvo' : 'salvo')}
                            className="w-7 h-7 border rounded-l hover:bg-gray-100"
                          >
                            -
                          </button>
                          <span className="w-10 text-center font-bold">
                            {item.quantidade}x
                          </span>
                          <button
                            onClick={() => onAtualizarQuantidade(item.id, item.quantidade + 1, isNaoSalvo ? 'naoSalvo' : 'salvo')}
                            className="w-7 h-7 border rounded-r hover:bg-gray-100"
                          >
                            +
                          </button>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-bold">R$ {subtotal.toFixed(2)}</p>
                        </div>
                        
                        <button
                          onClick={() => onRemoverItem(item.id, isNaoSalvo ? 'naoSalvo' : 'salvo')}
                          className="text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    
                    {/* Observação (se houver) */}
                    {item.observacao && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-sm text-gray-600">📝 {item.observacao}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Botões de ação fixos na base */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <button
          onClick={onImprimirPrevia}
          className="py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 text-sm"
        >
          Prévia
        </button>
        
        <button
          onClick={onLimparComanda}
          className="py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 text-sm"
          disabled={[...itensSalvos, ...itensNaoSalvos].length === 0}
        >
          Limpar
        </button>
        
        <button
        onClick={() => setMostrarPagamento(true)} // <-- botão de fechar conta lp seu maldito
          className="py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium text-sm"
          disabled={[...itensSalvos, ...itensNaoSalvos].length === 0 || modificado}
        >
          Fechar
        </button>
      </div>
      
      <button
        onClick={onVoltarDashboard}
        className="mt-3 text-center text-gray-600 hover:text-gray-900 text-sm w-full"
      >
        ← Voltar para mesas
      </button>

      {/* MODAL DE PAGAMENTO - ADICIONA NO FINAL */}
      {mostrarPagamento && (
  <PagamentoModal
    mesa={{
      numero: mesa?.numero || mesa?.id,
      nome: mesa?.nome || `Mesa ${mesa?.numero}`
    }}
    itens={[...itensSalvos, ...itensNaoSalvos]}
    total={totalComanda - totalPago} // Total restante a pagar
    onClose={() => setMostrarPagamento(false)}
    onConfirmar={(data) => {
      console.log('💳 Pagamento FINAL confirmado:', data);
      setMostrarPagamento(false);
      
      // Aqui você pode chamar uma função para finalizar a comanda
      // Exemplo: fetch('/api/comandas/finalizar', { method: 'POST', body: JSON.stringify(data) })
    }}
    onAtualizarComanda={handleAtualizarComanda} // ← ESTA É A FUNÇÃO IMPORTANTE
    comandaId={`mesa-${mesa?.numero || mesa?.id}-${Date.now()}`} // ← Gera um ID único
    mesaId={mesa?.id || mesa?.numero}
  />
)}
    </div>
  );
}
  