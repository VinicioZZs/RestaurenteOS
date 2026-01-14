// components/comanda/AdicionarProdutoModal.tsx - VERSÃO CORRIGIDA
'use client';

import { useState } from 'react';

interface Produto {
  id: number;
  nome: string;
  preco: number;
  categoria: string;
  imagem?: string;
}

interface AdicionarProdutoModalProps {
  produtos: Produto[];
  onAdicionar: (produtoId: number) => void;
  onClose: () => void;
}

export default function AdicionarProdutoModal({ produtos, onAdicionar, onClose }: AdicionarProdutoModalProps) {
  const [categoriaAtiva, setCategoriaAtiva] = useState('todos');
  const [busca, setBusca] = useState('');

  // Extrair categorias únicas - FORMA CORRETA
  const categoriasUnicas: string[] = [];
  produtos.forEach(p => {
    if (!categoriasUnicas.includes(p.categoria)) {
      categoriasUnicas.push(p.categoria);
    }
  });
  const categorias = ['todos', ...categoriasUnicas];

  // Filtrar produtos
  const produtosFiltrados = produtos.filter(produto => {
    const passaCategoria = categoriaAtiva === 'todos' || produto.categoria === categoriaAtiva;
    const passaBusca = produto.nome.toLowerCase().includes(busca.toLowerCase());
    return passaCategoria && passaBusca;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Adicionar Produto</h2>
            <p className="text-gray-600">Selecione os produtos para adicionar à comanda</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Filtros */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex gap-4 mb-4">
            {/* Barra de busca */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar produto..."
                className="w-full px-4 py-2 border rounded-lg"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>

          {/* Categorias */}
          <div className="flex flex-wrap gap-2">
            {categorias.map((categoria) => (
              <button
                key={categoria}
                onClick={() => setCategoriaAtiva(categoria)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  categoriaAtiva === categoria
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {categoria === 'todos' ? 'Todos' : categoria}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Produtos */}
        <div className="flex-1 overflow-y-auto p-6">
          {produtosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhum produto encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {produtosFiltrados.map((produto) => (
                <div
                  key={produto.id}
                  className="border rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => onAdicionar(produto.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 group-hover:text-blue-600">
                        {produto.nome}
                      </h3>
                      <p className="text-gray-500 text-sm capitalize">
                        {produto.categoria}
                      </p>
                    </div>
                    <span className="text-lg font-bold text-gray-800">
                      R$ {produto.preco.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">
                      Clique para adicionar
                    </span>
                    <button className="text-blue-600 hover:text-blue-800 font-medium">
                      + Adicionar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <div className="text-sm text-gray-600">
              {produtosFiltrados.length} produtos encontrados
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}