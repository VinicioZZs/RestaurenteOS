// components/comanda/ComandaEsquerda.tsx - COM PERMISSÕES
'use client';

import { useState, useEffect } from 'react';
import ConfirmarRemocaoModal from './ConfirmarRemocaoModal';

interface ItemComanda {
  id: number;
  produtoId: string;
  quantidade: number;
  precoUnitario: number;
  observacao: string;
  isNew?: boolean;
  nome?: string;          
  produtoNome?: string;   
  produto: {
    nome: string;
    categoria: string;
  };
}

interface UsuarioLogado {
  _id: string;
  email: string;
  nome: string;
  role: string;
  permissoes: {
    canRemoveItem?: boolean;
    canClearComanda?: boolean;
    canDeleteComanda?: boolean;
    canCloseComanda?: boolean;
    canGiveDiscount?: boolean;
    canCancelPayment?: boolean;
    canProcessPayment?: boolean;
    [key: string]: boolean | undefined;
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
  onApagarMesa: () => void;
  onImprimirPrevia: () => void;
  onFecharConta: () => void;
  onVoltarDashboard: () => void;
  comandaId: string;
  onMostrarModalPagamento?: () => void;
  onEditarAdicionais?: (itemId: number, produtoId: string, produto: any, observacao: string) => void;
  // NOVO: Função para dar desconto
  onDarDesconto?: () => void;
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
  onApagarMesa,
  onImprimirPrevia,
  onFecharConta,
  onVoltarDashboard,
  onEditarAdicionais,
  comandaId,
  onMostrarModalPagamento,
  onDarDesconto
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

  // ✅ Estado para modal de confirmação de apagar mesa
  const [modalApagarMesa, setModalApagarMesa] = useState(false);
  
  // ✅ NOVO: Estado para o usuário logado e permissões
  const [usuarioLogado, setUsuarioLogado] = useState<UsuarioLogado | null>(null);
  const [carregandoPermissoes, setCarregandoPermissoes] = useState(true);

  const todosItens = [...itensSalvos, ...itensNaoSalvos];

  // ✅ NOVO: Carregar usuário logado
  useEffect(() => {
    const carregarUsuario = () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          setUsuarioLogado(user);
        }
      } catch (error) {
        console.error('Erro ao carregar usuário:', error);
      } finally {
        setCarregandoPermissoes(false);
      }
    };

    carregarUsuario();
  }, []);

  // ✅ NOVO: Funções de verificação de permissões
  const temPermissao = (permissao: string): boolean => {
    if (!usuarioLogado) return false;
    
    // Admin tem todas as permissões
    if (usuarioLogado.role === 'admin') return true;
    
    // Verifica permissão específica
    return usuarioLogado.permissoes[permissao] === true;
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

  // Abrir modal de remoção (com verificação de permissão)
  const abrirModalRemocao = (itemId: number, tipo: 'salvo' | 'naoSalvo', produtoNome: string, quantidadeAtual: number, precoUnitario: number) => {
  console.log('🔍 Tentando abrir modal de remoção:', {
    itemId,
    tipo,
    temPermissao: temPermissao('canRemoveItem'),
    usuarioLogado,
    isNew: tipo === 'naoSalvo' ? 'SIM (não salvo)' : 'NÃO (salvo)'
  });
  
  // Para itens NÃO SALVOS (isNew=true), permitir remover SEM verificação de permissão
  if (tipo === 'naoSalvo') {
    console.log('✅ Item não salvo - permitindo remoção sem verificação');
    setModalRemocao({
      isOpen: true,
      itemId,
      tipo,
      produtoNome,
      quantidadeAtual,
      precoUnitario
    });
    return;
  }
  
  // Para itens SALVOS, verificar permissão
  if (!temPermissao('canRemoveItem')) {
    alert('Você não tem permissão para remover itens!');
    return;
  }
  
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

  // ✅ Função para confirmar apagar mesa (com verificação)
  const confirmarApagarMesa = () => {
    if (!temPermissao('canDeleteComanda')) {
      alert('Você não tem permissão para apagar mesas!');
      setModalApagarMesa(false);
      return;
    }
    
    onApagarMesa();
    setModalApagarMesa(false);
  };

  // ✅ Função para limpar comanda (com verificação)
  const handleLimparComanda = () => {
    if (!temPermissao('canClearComanda')) {
      alert('Você não tem permissão para limpar comandas!');
      return;
    }
    
    if (window.confirm(`Tem certeza que deseja limpar a ${mesa?.nome}? Todos os itens serão removidos.`)) {
      onLimparComanda();
    }
  };

  // ✅ Função para fechar conta (com verificação)
  const handleFecharConta = () => {
    if (!temPermissao('canCloseComanda')) {
      alert('Você não tem permissão para fechar contas!');
      return;
    }
    
    onFecharConta();
  };

  // ✅ Função para dar desconto (se disponível)
  const handleDarDesconto = () => {
    if (!temPermissao('canGiveDiscount')) {
      alert('Você não tem permissão para dar descontos!');
      return;
    }
    
    if (onDarDesconto) {
      onDarDesconto();
    } else {
      alert('Funcionalidade de desconto não implementada ainda.');
    }
  };

  // ✅ Renderização condicional baseada em permissões
  const renderizarBotaoRemover = (item: any, isNaoSalvo: boolean) => {
  // Se for item NÃO SALVO, sempre mostrar botão de remover
  if (isNaoSalvo) {
    return (
      <button 
        onClick={() => abrirModalRemocao(
          item.id, 
          'naoSalvo',
          item.produto.nome,
          item.quantidade,
          item.precoUnitario
        )}
        className="text-red-500 hover:text-red-700 text-sm flex-shrink-0"
        title="Remover item (não salvo)"
      >
        ✕
      </button>
    );
  }
  
  // Se for item SALVO, verificar permissão
  if (!temPermissao('canRemoveItem')) {
    return (
      <span 
        className="text-gray-400 text-sm flex-shrink-0 cursor-not-allowed"
        title="Sem permissão para remover itens salvos"
      >
        ✕
      </span>
    );
  }
  
  return (
    <button 
      onClick={() => abrirModalRemocao(
        item.id, 
        'salvo',
        item.produto.nome,
        item.quantidade,
        item.precoUnitario
      )}
      className="text-red-500 hover:text-red-700 text-sm flex-shrink-0"
      title="Remover item"
    >
      ✕
    </button>
  );
};

  if (carregandoPermissoes) {
    return (
      <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Carregando permissões...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200">
        {/* Cabeçalho */}
        <div className="p-3 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                {mesa?.nome}
              </h2>
              <p className="text-xs text-gray-500">
                {todosItens.length} itens • R$ {totalComanda.toFixed(2)}
                {modificado && (
                  <span className="ml-2 text-yellow-600 font-medium">
                    ✏️ Não salvo
                  </span>
                )}
                {/* ✅ Mostrar permissões ativas */}
                {usuarioLogado && (
                  <span className="ml-2 text-xs text-purple-600">
                    {usuarioLogado.role.toUpperCase()}
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
                              {/* ✅ Botão remover com permissão */}
                              {renderizarBotaoRemover(item, isNaoSalvo)}
                              <h3 className="font-medium text-gray-900 text-sm truncate" title={item.produto?.nome || item.nome || item.produtoNome || 'Produto'}>
                                {item.produto?.nome || item.nome || item.produtoNome || 'Produto'}
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
                            <div className="mt-1 text-xs text-gray-600 flex items-start justify-between">
                              <div className="flex items-start flex-1">
                                <span className="mr-1">📝</span>
                                <span className="truncate" title={item.observacao}>{item.observacao}</span>
                              </div>
                              <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                <button
                                  onClick={() => {
                                    if (onEditarAdicionais) {
                                      onEditarAdicionais(
                                        item.id, 
                                        item.produtoId, 
                                        item.produto, 
                                        item.observacao
                                      );
                                    }
                                  }}
                                  className="text-xs text-purple-600 hover:text-purple-800 hover:bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200"
                                  title="Editar adicionais"
                                >
                                  ✏️ Editar
                                </button>
                                <button
                                  onClick={() => iniciarEdicaoObservacao(item.id, item.observacao, isNaoSalvo ? 'naoSalvo' : 'salvo')}
                                  className="text-xs text-blue-500 hover:text-blue-700 px-1.5 py-0.5 rounded border border-blue-200"
                                  title="Editar observação"
                                >
                                  📝
                                </button>
                              </div>
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
          <div className="p-3 border-t bg-gradient-to-r from-gray-50 to-gray-100 flex-shrink-0">
          <div className="flex gap-3">
            {/* Total */}
            <div className="flex-1 bg-white p-3 rounded-lg border border-gray-200 text-center">
              <div className="text-xs text-gray-500 mb-1">Total</div>
              <div className="text-lg font-bold text-blue-600">R$ {totalComanda.toFixed(2)}</div>
            </div>
            
            {/* Restante */}
            <div className="flex-1 bg-white p-3 rounded-lg border border-gray-200 text-center">
              <div className="text-xs text-gray-500 mb-1">Restante</div>
              <div className={`text-lg font-bold ${
                restantePagar > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                R$ {restantePagar.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="p-4 border-t bg-white space-y-3 flex-shrink-0">
          {/* Botão FECHAR CONTA (com permissão) */}
          <button
            onClick={handleFecharConta}
            className={`w-full py-4 font-bold rounded-xl text-lg shadow-lg ${
              temPermissao('canCloseComanda')
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={todosItens.length === 0 || !temPermissao('canCloseComanda')}
          >
            💳 FECHAR CONTA
          </button>
          
          {/* Grid com botões */}
          <div className="grid grid-cols-2 gap-3">
            {/* Botão LIMPAR (com permissão) */}
            <button
              onClick={handleLimparComanda}
              className={`py-3.5 border-2 rounded-xl text-base flex items-center justify-center gap-2 shadow-sm ${
                temPermissao('canClearComanda')
                  ? 'border-amber-500 bg-amber-50 text-amber-700 hover:bg-amber-100'
                  : 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              disabled={todosItens.length === 0 || !temPermissao('canClearComanda')}
            >
              <span>🗑️</span>
              <span>Limpar {mesa?.nome.split(' ')[0]}</span> 
            </button>
            
            {/* Botão APAGAR (com permissão) */}
            <button
              onClick={() => {
                if (!temPermissao('canDeleteComanda')) {
                  alert('Você não tem permissão para apagar mesas!');
                  return;
                }
                setModalApagarMesa(true);
              }}
              className={`py-3.5 border-2 rounded-xl text-base flex items-center justify-center gap-2 shadow-sm ${
                temPermissao('canDeleteComanda')
                  ? 'border-red-500 bg-red-50 text-red-700 hover:bg-red-100'
                  : 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              disabled={!temPermissao('canDeleteComanda')}
            >
              <span>❌</span>
              <span>Apagar {mesa?.nome.split(' ')[0]}</span>
            </button>
          </div>
          
          {/* Botões secundários */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onImprimirPrevia}
              className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium text-sm flex items-center justify-center gap-2"
            >
              <span>🖨️</span>
              <span>Imprimir</span>
            </button>
            <button
              onClick={onVoltarDashboard}
              className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium text-sm flex items-center justify-center gap-2"
            >
              <span>←</span>
              <span>Voltar</span>
            </button>
          </div>
          
          {/* ✅ Aviso de permissões */}
          {usuarioLogado && !usuarioLogado.permissoes.canRemoveItem && 
           !usuarioLogado.permissoes.canClearComanda && 
           !usuarioLogado.permissoes.canDeleteComanda && 
           !usuarioLogado.permissoes.canCloseComanda && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-700 text-center">
                ⚠️ Você tem permissões limitadas para esta comanda
              </p>
            </div>
          )}
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

      {/* Modal de Confirmação para Apagar Mesa */}
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