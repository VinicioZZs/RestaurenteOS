// components/comanda/ModalAdicionais.tsx - ATUALIZADO PARA SUPORTAR EDIÇÃO
'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Minus, Check, Edit2 } from 'lucide-react';

interface Adicional {
  _id: string;
  nome: string;
  descricao?: string;
  preco: number;
  categoria: string;
  gratuito: boolean;
}

interface Produto {
  id: string;
  nome: string;
  preco: number;
}

interface ModalAdicionaisProps {
  produto: Produto;
  onClose: () => void;
  onConfirmar: (produtoId: string, adicionaisSelecionados: Array<{
    adicionalId: string;
    quantidade: number;
    precoUnitario: number;
    nome: string;
  }>) => void;
  produtoId: string;
  // ✅ NOVOS PROPS PARA EDIÇÃO
  modoEdicao?: boolean;
  adicionaisExistentes?: Array<{
    adicionalId: string;
    quantidade: number;
    precoUnitario: number;
    nome: string;
  }>;
  itemId?: number; // ID do item na comanda para editar
}

export default function ModalAdicionais({
  produto,
  onClose,
  onConfirmar,
  produtoId,
  modoEdicao = false,
  adicionaisExistentes = [],
  itemId
}: ModalAdicionaisProps) {
  const [adicionaisDisponiveis, setAdicionaisDisponiveis] = useState<Adicional[]>([]);
  const [adicionaisSelecionados, setAdicionaisSelecionados] = useState<Record<string, number>>({});
  const [carregando, setCarregando] = useState(true);
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('todos');
  const [busca, setBusca] = useState('');

  useEffect(() => {
    carregarAdicionaisDoProduto();
  }, [produtoId]);

  // ✅ NOVO: Carregar adicionais existentes se for modo edição
  useEffect(() => {
    if (modoEdicao && adicionaisExistentes.length > 0) {
      const selecionados: Record<string, number> = {};
      adicionaisExistentes.forEach(adicional => {
        selecionados[adicional.adicionalId] = adicional.quantidade;
      });
      setAdicionaisSelecionados(selecionados);
    }
  }, [modoEdicao, adicionaisExistentes]);

  const carregarAdicionaisDoProduto = async () => {
    try {
      setCarregando(true);
      
      // Buscar os adicionais configurados para este produto
      const responseProduto = await fetch(`/api/produtos/${produtoId}`);
      
      if (responseProduto.ok) {
        const produtoData = await responseProduto.json();
        const produtoCompleto = produtoData.data;
        
        // Se o produto tiver adicionais específicos, buscar apenas esses
        if (produtoCompleto?.adicionais && produtoCompleto.adicionais.length > 0) {
          const response = await fetch(`/api/adicionais?ativos=true&ids=${produtoCompleto.adicionais.join(',')}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setAdicionaisDisponiveis(data.data);
            }
          }
        } else {
          // Carregar todos adicionais ativos
          const response = await fetch('/api/adicionais?ativos=true');
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setAdicionaisDisponiveis(data.data);
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar adicionais:', error);
    } finally {
      setCarregando(false);
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const adicionarAdicional = (adicionalId: string) => {
    setAdicionaisSelecionados(prev => ({
      ...prev,
      [adicionalId]: (prev[adicionalId] || 0) + 1
    }));
  };

  const removerAdicional = (adicionalId: string) => {
    setAdicionaisSelecionados(prev => {
      const current = prev[adicionalId] || 0;
      if (current <= 1) {
        const newState = { ...prev };
        delete newState[adicionalId];
        return newState;
      }
      return {
        ...prev,
        [adicionalId]: current - 1
      };
    });
  };

  const getQuantidadeAdicional = (adicionalId: string) => {
    return adicionaisSelecionados[adicionalId] || 0;
  };

  const getAdicionalCompleto = (id: string) => {
    return adicionaisDisponiveis.find(a => a._id === id);
  };

  const categoriasUnicas = Array.from(new Set(adicionaisDisponiveis.map(a => a.categoria)));

  const adicionaisFiltrados = adicionaisDisponiveis.filter(adicional => {
    const categoriaMatch = categoriaAtiva === 'todos' || adicional.categoria === categoriaAtiva;
    const buscaMatch = adicional.nome.toLowerCase().includes(busca.toLowerCase()) ||
                     adicional.descricao?.toLowerCase().includes(busca.toLowerCase());
    return categoriaMatch && buscaMatch;
  });

  const calcularTotalAdicionais = () => {
    return Object.entries(adicionaisSelecionados).reduce((total, [adicionalId, quantidade]) => {
      const adicional = getAdicionalCompleto(adicionalId);
      if (!adicional) return total;
      return total + (adicional.gratuito ? 0 : adicional.preco * quantidade);
    }, 0);
  };

  const calcularTotalFinal = () => {
    return produto.preco + calcularTotalAdicionais();
  };

  const handleConfirmar = () => {
    const adicionaisArray = Object.entries(adicionaisSelecionados).map(([adicionalId, quantidade]) => {
      const adicional = getAdicionalCompleto(adicionalId)!;
      return {
        adicionalId,
        quantidade,
        precoUnitario: adicional.gratuito ? 0 : adicional.preco,
        nome: adicional.nome
      };
    });

    onConfirmar(produtoId, adicionaisArray);
    onClose();
  };

  const totalAdicionais = Object.values(adicionaisSelecionados).reduce((a, b) => a + b, 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {modoEdicao ? (
                  <>
                    <Edit2 className="h-5 w-5 text-purple-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Editar Adicionais</h2>
                  </>
                ) : (
                  <h2 className="text-2xl font-bold text-gray-900">{produto.nome}</h2>
                )}
              </div>
              <p className="text-gray-600">
                {modoEdicao ? 'Atualize os adicionais deste item' : 'Personalize seu produto com adicionais'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Fechar"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Preço do produto */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-4">
            <div>
              <span className="text-gray-700 font-medium">Produto base:</span>
              <span className="text-lg font-bold ml-2">{formatarMoeda(produto.preco)}</span>
            </div>
            <div className="text-gray-600">
              {totalAdicionais > 0 ? (
                <span>{totalAdicionais} adicional(is) selecionado(s)</span>
              ) : (
                <span>Nenhum adicional selecionado</span>
              )}
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar adicionais..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  🔍
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCategoriaAtiva('todos')}
                className={`px-4 py-2 rounded-lg ${categoriaAtiva === 'todos' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Todos
              </button>
              {categoriasUnicas.map(categoria => (
                <button
                  key={categoria}
                  onClick={() => setCategoriaAtiva(categoria)}
                  className={`px-4 py-2 rounded-lg ${categoriaAtiva === categoria 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {categoria}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lista de Adicionais */}
        <div className="flex-1 overflow-y-auto p-6">
          {carregando ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : adicionaisFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4 text-6xl">🥗</div>
              <p className="text-gray-500 text-lg">Nenhum adicional disponível</p>
              <p className="text-gray-400">Este produto não possui adicionais configurados</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {adicionaisFiltrados.map(adicional => {
                const quantidade = getQuantidadeAdicional(adicional._id);
                const isSelecionado = quantidade > 0;

                return (
                  <div
                    key={adicional._id}
                    className={`border rounded-xl p-4 transition-all duration-200 ${
                      isSelecionado
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900">{adicional.nome}</h3>
                          {adicional.gratuito && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                              GRATUITO
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-2">
                          {adicional.descricao || 'Sem descrição'}
                        </p>
                        <div className="text-lg font-bold">
                          {adicional.gratuito ? (
                            <span className="text-green-600">Grátis</span>
                          ) : (
                            formatarMoeda(adicional.preco)
                          )}
                        </div>
                      </div>
                      
                      {isSelecionado && (
                        <div className="flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                          <Check className="h-4 w-4" />
                          <span className="font-bold">{quantidade}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 capitalize">
                        {adicional.categoria}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        {quantidade > 0 && (
                          <>
                            <button
                              onClick={() => removerAdicional(adicional._id)}
                              className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg"
                              aria-label="Remover"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="font-bold min-w-[20px] text-center">
                              {quantidade}
                            </span>
                          </>
                        )}
                        <button
                          onClick={() => adicionarAdicional(adicional._id)}
                          className={`px-4 py-1.5 rounded-lg font-medium ${
                            isSelecionado
                              ? 'bg-purple-600 text-white hover:bg-purple-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {quantidade > 0 ? '+' : 'Adicionar'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer com Total e Botões */}
        <div className="border-t p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-gray-600 mb-1">Total dos adicionais:</div>
              <div className="text-2xl font-bold text-purple-600">
                {formatarMoeda(calcularTotalAdicionais())}
              </div>
              {modoEdicao && (
                <div className="text-sm text-gray-500 mt-1">
                  Editando item #{itemId}
                </div>
              )}
            </div>
            
            <div className="text-right">
              <div className="text-gray-600 mb-1">Total a pagar:</div>
              <div className="text-3xl font-bold text-gray-900">
                {formatarMoeda(calcularTotalFinal())}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {formatarMoeda(produto.preco)} (produto) + {formatarMoeda(calcularTotalAdicionais())} (adicionais)
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmar}
                disabled={totalAdicionais === 0}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Check className="h-5 w-5" />
                {modoEdicao ? 'Atualizar' : 'Confirmar'} ({totalAdicionais} adicional{totalAdicionais !== 1 ? 'es' : ''})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}