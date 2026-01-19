// components/comanda/CatalogoDireita.tsx - VERSÃO COM IMAGENS/ÍCONES DINÂMICOS
'use client';

import { useState } from 'react';

interface Produto {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  imagem?: string;
}

interface Categoria {
  id: string;
  nome: string;
  icone: string;
  imagem?: string;
  usaImagem?: boolean;
}

interface CatalogoDireitaProps {
  produtos: Produto[];
  categorias: Categoria[];
  categoriaAtiva: string;
  busca: string;
  onSelecionarCategoria: (categoriaId: string) => void;
  onBuscar: (texto: string) => void;
  onAdicionarProduto: (produtoId: string) => void;
  encontrarCategoriaPorNome?: (nome: string) => Categoria | undefined; // Nova prop
}

export default function CatalogoDireita({
  produtos,
  categorias,
  categoriaAtiva,
  busca,
  onSelecionarCategoria,
  onBuscar,
  onAdicionarProduto,
  encontrarCategoriaPorNome // Nova prop
}: CatalogoDireitaProps) {
  const [imagemErro, setImagemErro] = useState<Record<string, boolean>>({});

  // Componente para imagem/ícone da categoria - CORRIGIDO
  const CategoriaIcone = ({ categoria }: { categoria: Categoria }) => {
    // Se usaImagem é true E tem imagem E imagem não deu erro
    if (categoria.usaImagem === true && categoria.imagem && !imagemErro[categoria.id]) {
      return (
        <div className={`relative w-20 h-20 rounded-full flex-shrink-0 group overflow-hidden border-4 ${
          categoriaAtiva === categoria.id
            ? 'border-blue-400 bg-gradient-to-br from-blue-500 to-blue-600 shadow-xl'
            : 'border-transparent hover:border-gray-300'
        } transition-all duration-200`}>
          <img 
            src={categoria.imagem} 
            alt={categoria.nome}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            onError={() => setImagemErro(prev => ({ ...prev, [categoria.id]: true }))}
          />
          {/* Overlay para melhor contraste */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
        </div>
      );
    }
    
    // Se não usa imagem, ou usaImagem é false, ou imagem deu erro - mostra ícone
    return (
      <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 ${
        categoriaAtiva === categoria.id
          ? 'border-blue-400 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl'
          : 'border-transparent bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 hover:from-gray-200 hover:to-gray-300'
      } transition-all duration-200`}>
        <span className="text-3xl">
          {categoria.icone || '📦'}
        </span>
      </div>
    );
  };

  // Função para obter a cor da badge da categoria baseada no produto
  const getCategoriaColor = (nomeCategoria: string) => {
    const categoria = encontrarCategoriaPorNome ? 
      encontrarCategoriaPorNome(nomeCategoria) : 
      categorias.find(c => c.nome.toLowerCase() === nomeCategoria.toLowerCase());
    
    // Se encontrou a categoria e ela está ativa
    if (categoria && categoriaAtiva === categoria.id) {
      return 'bg-blue-100 text-blue-700';
    }
    
    // Cores padrão para categorias não encontradas
    const coresPadrao: Record<string, string> = {
      'bebidas': 'bg-green-100 text-green-700',
      'lanches': 'bg-orange-100 text-orange-700',
      'acompanhamentos': 'bg-yellow-100 text-yellow-700',
      'sobremesas': 'bg-pink-100 text-pink-700',
      'entradas': 'bg-purple-100 text-purple-700',
      'pratos principais': 'bg-red-100 text-red-700',
      'bebidas alcoólicas': 'bg-indigo-100 text-indigo-700'
    };
    
    const chave = nomeCategoria.toLowerCase();
    return coresPadrao[chave] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg border border-gray-200">
      {/* Barra de busca FIXA no topo */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 Buscar produto..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            value={busca}
            onChange={(e) => onBuscar(e.target.value)}
          />
          {busca && (
            <button
              onClick={() => onBuscar('')}
              className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      
      {/* Categorias MAIORES (agora temos espaço) */}
      <div className="px-4 py-4 border-b border-gray-200 bg-white"> 
        <div className="flex space-x-4 overflow-x-auto pb-3"> 
          {categorias.map((categoria) => (
            <button
              key={categoria.id}
              onClick={() => onSelecionarCategoria(categoria.id)}
              className={`flex-shrink-0 flex flex-col items-center space-y-2 pb-1`} 
            >
              {/* Ícone/Imagem da categoria usando o componente corrigido */}
              <CategoriaIcone categoria={categoria} />
              
              {/* Nome com mais espaço */}
              <span className={`text-sm font-medium whitespace-nowrap px-2 ${
                categoriaAtiva === categoria.id
                  ? 'text-blue-700 font-bold bg-blue-50 rounded-full'
                  : 'text-gray-700'
              }`}>
                {categoria.nome}
              </span>
              
            </button>
          ))}
        </div>
      </div>
      
      {/* ÁREA DE PRODUTOS COM SCROLL */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* ✅ AUMENTEI PARA 7 COLUNAS E MAIS ESPAÇO */}
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-4">
          {produtos.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-5xl text-gray-300 mb-4">🛒</div>
              <p className="text-gray-500">Nenhum produto encontrado</p>
              <p className="text-sm text-gray-400 mt-1">
                {busca ? `Busca: "${busca}"` : `Categoria: ${categorias.find(c => c.id === categoriaAtiva)?.nome || 'Selecionada'}`}
              </p>
            </div>
          ) : (
            produtos.map((produto) => {
              // Encontrar a categoria real do produto para obter as cores
              const categoriaProduto = encontrarCategoriaPorNome ? 
                encontrarCategoriaPorNome(produto.categoria) : 
                categorias.find(c => c.nome.toLowerCase() === produto.categoria.toLowerCase());
              
              return (
                <button
                  key={produto.id}
                  onClick={() => onAdicionarProduto(produto.id)}
                  className="group bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-lg overflow-hidden transition-all duration-200 hover:scale-[1.02] active:scale-95 flex flex-col"
                >
                  {/* ✅ Imagem MAIOR */}
                  <div className="relative h-40 bg-gradient-to-br from-gray-50 to-gray-100">
                    <img
                      src={produto.imagem || '/placeholder-product.jpg'}
                      alt={produto.nome}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                      }}
                    />
                    
                    {/* ✅ Badge de preço maior */}
                    <div className="absolute bottom-3 right-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold px-3 py-2 rounded-lg shadow-lg text-sm">
                      R$ {produto.preco.toFixed(2)}
                    </div>
                    
                    {/* Overlay sutil */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  
                  {/* ✅ Informações com mais espaço */}
                  <div className="p-4 flex-1">
                    <span className="font-semibold text-gray-800 text-sm line-clamp-2 text-left block leading-tight mb-2">
                      {produto.nome}
                    </span>
                    <div className="flex justify-between items-center">
                      {/* Badge da categoria com cores dinâmicas */}
                      <span className={`text-xs ${getCategoriaColor(produto.categoria)} px-2 py-1 rounded font-medium`}>
                        {produto.categoria}
                      </span>
                      <span className="text-sm bg-blue-100 text-blue-700 font-medium px-3 py-1 rounded-lg">
                        +
                      </span>
                    </div>
                    
                    {/* Indicador visual da categoria (se encontrada) */}
                    {categoriaProduto && (
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <span className="mr-1">
                          {categoriaProduto.usaImagem ? '🖼️' : categoriaProduto.icone}
                        </span>
                        <span className="truncate">
                          {categoriaProduto.nome}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="border-t border-gray-200 p-3 bg-gray-50">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">
            {produtos.length} {produtos.length === 1 ? 'produto' : 'produtos'}
          </span>
          <span className="text-gray-500">
            {categoriaAtiva === 'todos' ? 'Todas categorias' : 
             categorias.find(c => c.id === categoriaAtiva)?.nome}
          </span>
        </div>
        {/* Adicionando info sobre tipos de visualização */}
        <div className="flex justify-center mt-1">
          <span className="text-xs text-gray-400">
            {categorias.filter(c => c.usaImagem).length} com imagens • 
            {categorias.filter(c => !c.usaImagem).length} com ícones
          </span>
        </div>
      </div>
    </div>
  );
}