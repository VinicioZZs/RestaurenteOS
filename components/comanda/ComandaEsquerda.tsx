// components/comanda/ComandaEsquerda.tsx - COM BOTÕES SEPARADOS
'use client';

import { useState } from 'react';
import ConfirmarRemocaoModal from './ConfirmarRemocaoModal';

interface ItemComanda {
  id: number;
  produtoId: string;
  quantidade: number;
  precoUnitario: number;
  observacao: string;
  isNew?: boolean;
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
  onApagarMesa: () => void; // ✅ NOVO
  onImprimirPrevia: () => void;
  onFecharConta: () => void;
  onVoltarDashboard: () => void;
  comandaId: string;
  onMostrarModalPagamento?: () => void;
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
  onApagarMesa, // ✅ NOVO
  onImprimirPrevia,
  onFecharConta,
  onVoltarDashboard,
  comandaId,
  onMostrarModalPagamento
}: ComandaEsquerdaProps) {
  const [editandoObservacao, setEditandoObservacao] = useState<number | null>(null);
  const [novaObservacao, setNovaObservacao] = useState('');
  const [tipoItemEditando, setTipoItemEditando] = useState<'salvo' | 'naoSalvo'>('salvo');
  
  // Estado para o modal de remoção
  const [modalRemocao, setModalRemocao] = useState<{
    isOpen: boolean;
    itemId: number | null;
    tipo: 'salvo' | 'naoSalvo' | null;
    produtoNome: string;
    quantidadeAtual: number;
    precoUnitario: number;
  }>({
    isOpen: false,
    itemId: null,
    tipo: null,
    produtoNome: '',
    quantidadeAtual: 0,
    precoUnitario: 0
  });

  // ✅ NOVO: Estado para modal de confirmação de apagar mesa
  const [modalApagarMesa, setModalApagarMesa] = useState(false);

  const todosItens = [...itensSalvos, ...itensNaoSalvos];

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

  // Abrir modal de remoção
  const abrirModalRemocao = (itemId: number, tipo: 'salvo' | 'naoSalvo', produtoNome: string, quantidadeAtual: number, precoUnitario: number) => {
    setModalRemocao({
      isOpen: true,
      itemId,
      tipo,
      produtoNome,
      quantidadeAtual,
      precoUnitario
    });
  };

  // Confirmar remoção (chamada pelo modal)
  const handleConfirmarRemocao = (quantidadeRemover: number) => {
    if (!modalRemocao.itemId || !modalRemocao.tipo) return;
    
    const itemId = modalRemocao.itemId;
    const tipo = modalRemocao.tipo;
    const quantidadeAtual = modalRemocao.quantidadeAtual;
    
    if (quantidadeRemover >= quantidadeAtual) {
      // Remover item completamente
      onRemoverItem(itemId, tipo);
    } else {
      // Apenas reduzir quantidade
      const novaQuantidade = quantidadeAtual - quantidadeRemover;
      onAtualizarQuantidade(itemId, novaQuantidade, tipo);
    }
    
    // Fechar modal
    setModalRemocao({
      isOpen: false,
      itemId: null,
      tipo: null,
      produtoNome: '',
      quantidadeAtual: 0,
      precoUnitario: 0
    });
  };

  // ✅ NOVO: Função para confirmar apagar mesa
  const confirmarApagarMesa = () => {
    onApagarMesa();
    setModalApagarMesa(false);
  };

  return (
    <>
      <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200">
        {/* Cabeçalho */}
        <div className="p-3 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-800">{mesa?.nome}</h2>
              <p className="text-xs text-gray-500">
                {todosItens.length} itens • R$ {totalComanda.toFixed(2)}
                {modificado && (
                  <span className="ml-2 text-yellow-600 font-medium">
                    ✏️ Não salvo
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* LISTA DE ITENS COM SCROLL */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-3">
            {todosItens.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-3xl mb-2">🛒</div>
                <p className="text-sm">Comanda vazia</p>
                <p className="text-xs text-gray-400 mt-1">Adicione produtos ao lado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todosItens.map((item, index) => {
                  const isNaoSalvo = index >= itensSalvos.length;
                  
                  return (
                    <div 
                      key={item.id}
                      className={`p-2 rounded-lg border ${
                        item.isNew || isNaoSalvo 
                          ? 'bg-yellow-50 border-yellow-200' 
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          {/* NOME DO PRODUTO COM TRUNCATE */}
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1 flex-1 min-w-0">
                              <button 
                                onClick={() => abrirModalRemocao(
                                  item.id, 
                                  isNaoSalvo ? 'naoSalvo' : 'salvo',
                                  item.produto.nome,
                                  item.quantidade,
                                  item.precoUnitario
                                )}
                                className="text-red-500 hover:text-red-700 text-sm flex-shrink-0"
                                title="Remover item"
                              >
                                ✕
                              </button>
                              <h3 className="font-medium text-gray-900 text-sm truncate" title={item.produto.nome}>
                                {item.produto.nome}
                              </h3>
                              {isNaoSalvo && (
                                <span className="text-xs bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded flex-shrink-0">
                                  NOVO
                                </span>
                              )}
                            </div>
                            
                            {/* QUANTIDADE E PREÇO */}
                            <div className="flex items-center gap-2 ml-2">
                              <div className="text-center min-w-[40px]">
                                <div className="text-xs text-gray-500">Qtd</div>
                                <div className="font-bold">{item.quantidade}x</div>
                              </div>
                              
                              <div className="text-right min-w-[80px]">
                                <div className="font-bold text-blue-600 text-sm">
                                  R$ {(item.quantidade * item.precoUnitario).toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Observação */}
                          {item.observacao ? (
                            <div className="mt-1 text-xs text-gray-600 flex items-start">
                              <span className="mr-1">📝</span>
                              <span className="truncate" title={item.observacao}>{item.observacao}</span>
                              <button
                                onClick={() => iniciarEdicaoObservacao(item.id, item.observacao, isNaoSalvo ? 'naoSalvo' : 'salvo')}
                                className="ml-1 text-xs text-blue-500 hover:text-blue-700 flex-shrink-0"
                              >
                                Editar
                              </button>
                            </div>
                          ) : editandoObservacao === item.id ? (
                            <div className="mt-1">
                              <input
                                type="text"
                                value={novaObservacao}
                                onChange={(e) => setNovaObservacao(e.target.value)}
                                className="w-full text-xs border rounded px-2 py-1"
                                placeholder="Observação..."
                                autoFocus
                              />
                              <div className="flex gap-1 mt-1">
                                <button
                                  onClick={salvarObservacao}
                                  className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded"
                                >
                                  Salvar
                                </button>
                                <button
                                  onClick={() => setEditandoObservacao(null)}
                                  className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => iniciarEdicaoObservacao(item.id, item.observacao, isNaoSalvo ? 'naoSalvo' : 'salvo')}
                              className="mt-1 text-xs text-gray-500 hover:text-gray-700"
                            >
                              + Observação
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Totais */}
        <div className="p-3 border-t bg-gray-50 flex-shrink-0">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Total:</span>
              <span className="text-lg font-bold text-blue-600">R$ {totalComanda.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Restante:</span>
              <span className="font-bold text-red-600">R$ {restantePagar.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Botões de Ação - AGORA COM 2 BOTÕES SEPARADOS */}
        <div className="p-3 border-t bg-white space-y-2 flex-shrink-0">
          {/* Botão FECHAR CONTA (chama o modal) */}
          <button
            onClick={onMostrarModalPagamento || onFecharConta}
            className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
            disabled={todosItens.length === 0}
          >
            💳 FECHAR CONTA
          </button>
          
          {/* ✅ NOVO: Grid com 2 botões - LIMPAR e APAGAR */}
          <div className="grid grid-cols-2 gap-2">
            {/* Botão LIMPAR COMANDA (remove apenas os itens) */}
            <button
              onClick={onLimparComanda}
              className="py-2 border border-amber-600 text-amber-600 font-medium rounded-lg hover:bg-amber-50 text-sm flex items-center justify-center gap-1"
              disabled={todosItens.length === 0}
            >
              <span>🗑️</span>
              <span>Limpar</span>
            </button>
            
            {/* Botão APAGAR MESA (fecha comanda completamente) */}
            <button
              onClick={() => setModalApagarMesa(true)}
              className="py-2 border border-red-600 text-red-600 font-medium rounded-lg hover:bg-red-50 text-sm flex items-center justify-center gap-1"
            >
              <span>❌</span>
              <span>Apagar</span>
            </button>
          </div>
          
          {/* Botões secundários */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onImprimirPrevia}
              className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-xs"
            >
              Imprimir
            </button>
            <button
              onClick={onVoltarDashboard}
              className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-xs"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Remoção de Item */}
      <ConfirmarRemocaoModal
        produtoNome={modalRemocao.produtoNome}
        quantidadeAtual={modalRemocao.quantidadeAtual}
        precoUnitario={modalRemocao.precoUnitario}
        isOpen={modalRemocao.isOpen}
        onClose={() => setModalRemocao(prev => ({ ...prev, isOpen: false }))}
        onConfirmar={handleConfirmarRemocao}
      />

      {/* ✅ NOVO: Modal de Confirmação para Apagar Mesa */}
      {modalApagarMesa && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="bg-red-100 p-3 rounded-full">
                  <span className="text-red-600 text-xl">⚠️</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Apagar Mesa</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Esta ação não pode ser desfeita
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700">Mesa:</span>
                    <span className="font-bold">{mesa?.nome}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700">Itens na comanda:</span>
                    <span className="font-medium">{todosItens.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Valor total:</span>
                    <span className="font-bold text-red-600">
                      R$ {totalComanda.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">
                    <span className="font-bold">Atenção:</span> Esta ação irá:
                  </p>
                  <ul className="text-sm text-red-600 mt-2 space-y-1">
                    <li className="flex items-start gap-1">
                      <span>•</span>
                      <span>Fechar a comanda completamente</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span>•</span>
                      <span>Remover a mesa do dashboard</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span>•</span>
                      <span>Perder todos os dados não salvos</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={confirmarApagarMesa}
                  className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"
                >
                  SIM, APAGAR MESA
                </button>
                
                <button
                  onClick={() => setModalApagarMesa(false)}
                  className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
            
            <div className="p-4 border-t bg-gray-50 rounded-b-2xl">
              <p className="text-xs text-gray-600 text-center">
                A mesa poderá ser recriada posteriormente
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
