// components/comanda/CatalogoDireita.tsx - VERSÃO COM TODAS CATEGORIAS SUBINDO
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
  encontrarCategoriaPorNome?: (nome: string) => Categoria | undefined;
}

export default function CatalogoDireita({
  produtos,
  categorias,
  categoriaAtiva,
  busca,
  onSelecionarCategoria,
  onBuscar,
  onAdicionarProduto,
  encontrarCategoriaPorNome
}: CatalogoDireitaProps) {
  const [imagemErro, setImagemErro] = useState<Record<string, boolean>>({});
  const [categoriaHover, setCategoriaHover] = useState<string | null>(null);

  // Função para truncar texto (só para badges e status)
  const truncarTexto = (texto: string, limite: number = 12): string => {
    if (!texto) return '';
    
    if (texto.length <= limite) {
      return texto;
    }
    
    const textoTruncado = texto.substring(0, limite);
    const ultimoEspaco = textoTruncado.lastIndexOf(' ');
    
    if (ultimoEspaco > 0) {
      return texto.substring(0, ultimoEspaco) + '...';
    }
    
    return texto.substring(0, limite) + '...';
  };

  // 🔥 TODAS AS CATEGORIAS AGORA MOSTRAM NOME COMPLETO NO HOVER
  // Versão normal (sempre truncada para layout)
  const formatarNomeCategoriaNormal = (nome: string): string => {
    const nomesPadronizados: Record<string, string> = {
      'bebidas': 'Bebidas',
      'bebida': 'Bebidas',
      'lanches': 'Lanches',
      'lanche': 'Lanches',
      'hamburgueres': 'Lanches',
      'acompanhamentos': 'Acomp.',
      'acompanhamento': 'Acomp.',
      'sobremesas': 'Sobremesas',
      'sobremesa': 'Sobremesas',
      'entradas': 'Entradas',
      'entrada': 'Entradas',
      'pratos principais': 'Principais',
      'prato principal': 'Principais',
      'pratos': 'Principais',
      'bebidas alcoólicas': 'B. Alc.',
      'drinks': 'Drinks',
      'vinhos': 'Vinhos',
      'cervejas': 'Cervejas',
      'porções': 'Porções',
      'porcao': 'Porções',
      'massas': 'Massas',
      'massa': 'Massas',
      'saladas': 'Saladas',
      'salada': 'Saladas',
      'sucos': 'Sucos',
      'suco': 'Sucos',
      'refrigerantes': 'Refris',
      'refrigerante': 'Refris',
      'todos': 'Todos'
    };

    const chave = nome.toLowerCase();
    if (nomesPadronizados[chave]) {
      return nomesPadronizados[chave];
    }

    return truncarTexto(nome, 12);
  };

  // Componente para imagem/ícone da categoria
  const CategoriaIcone = ({ categoria }: { categoria: Categoria }) => {
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
        </div>
      );
    }
    
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

  // Função para obter a cor da badge
  const getCategoriaColor = (nomeCategoria: string) => {
    const categoria = encontrarCategoriaPorNome ? 
      encontrarCategoriaPorNome(nomeCategoria) : 
      categorias.find(c => c.nome.toLowerCase() === nomeCategoria.toLowerCase());
    
    if (categoria && categoriaAtiva === categoria.id) {
      return 'bg-blue-100 text-blue-700';
    }
    
    const coresPadrao: Record<string, string> = {
      'bebidas': 'bg-green-100 text-green-700',
      'lanches': 'bg-orange-100 text-orange-700',
      'acompanhamentos': 'bg-yellow-100 text-yellow-700',
      'sobremesas': 'bg-pink-100 text-pink-700',
      'entradas': 'bg-purple-100 text-purple-700',
      'pratos principais': 'bg-red-100 text-red-700',
      'bebidas alcoólicas': 'bg-indigo-100 text-indigo-700',
      'todos': 'bg-gray-100 text-gray-700'
    };
    
    const chave = nomeCategoria.toLowerCase();
    return coresPadrao[chave] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-lg border border-gray-200">
      {/* Barra de busca */}
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
      
      {/* 🔥 CATEGORIAS - TODAS COM EFEITO DE EXPANSÃO */}
      <div className="px-4 py-4 border-b border-gray-200 bg-white"> 
        <div className="flex space-x-3 overflow-x-auto pb-3">
          {categorias.map((categoria) => {
            const nomeNormal = formatarNomeCategoriaNormal(categoria.nome);
            const nomeCompleto = categoria.nome;
            const isHovered = categoriaHover === categoria.id;
            const isAtiva = categoriaAtiva === categoria.id;
            
            return (
              <div 
                key={categoria.id}
                className="flex-shrink-0"
                onMouseEnter={() => setCategoriaHover(categoria.id)}
                onMouseLeave={() => setCategoriaHover(null)}
              >
                <button
                  onClick={() => onSelecionarCategoria(categoria.id)}
                  className="relative flex flex-col items-center space-y-2 pb-1 w-full group/categoria"
                >
                  {/* Ícone/Imagem da categoria */}
                  <div className="relative z-10 transition-transform duration-300 group-hover/categoria:scale-105">
                    <CategoriaIcone categoria={categoria} />
                  </div>
                  
                  {/* Container do nome com altura fixa */}
                  <div className="relative h-8 flex items-center justify-center w-full">
                    {/* Fundo fixo para manter altura e posição */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      {/* Nome normal (sempre visível quando não está em hover) */}
                      <div className={`
                        text-sm font-medium whitespace-nowrap rounded-full px-3 py-1
                        transition-all duration-300
                        ${isAtiva
                          ? 'text-blue-700 font-bold bg-blue-50'
                          : 'text-gray-700'}
                        ${isHovered ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
                      `}>
                        {nomeNormal}
                      </div>
                    </div>
                    
                    {/* 🔥 NOME COMPLETO NO HOVER - SEMPRE, PARA TODAS CATEGORIAS */}
                    <div className={`
                      absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full
                      text-sm font-medium whitespace-nowrap rounded-full px-4 py-2 min-w-max
                      transition-all duration-300 ease-out z-20
                      ${isHovered 
                        ? 'opacity-100 scale-100 shadow-lg' 
                        : 'opacity-0 scale-95 pointer-events-none'}
                      ${isAtiva
                        ? 'text-blue-700 font-bold bg-blue-50 border border-blue-200'
                        : 'text-gray-800 bg-white border border-gray-200 shadow-md'}
                    `}>
                      {/* Nome completo - MESMO QUE SEJA IGUAL AO NORMAL */}
                      <span className="relative z-20">{nomeCompleto}</span>
                      
                      {/* Seta indicadora - CENTRALIZADA */}
                      <div className={`
                        absolute top-full left-1/2 transform -translate-x-1/2
                        w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px]
                        transition-all duration-300
                        ${isHovered ? 'opacity-100' : 'opacity-0'}
                        ${isAtiva
                          ? 'border-t-blue-50'
                          : 'border-t-white'}
                      `}></div>
                      
                      {/* Borda da seta (para combinar com a borda do container) */}
                      <div className={`
                        absolute top-full left-1/2 transform -translate-x-1/2 -mt-[1px]
                        w-0 h-0 border-l-[9px] border-r-[9px] border-t-[9px]
                        transition-all duration-300
                        ${isHovered ? 'opacity-100' : 'opacity-0'}
                        ${isAtiva
                          ? 'border-t-blue-200'
                          : 'border-t-gray-200'}
                      `}></div>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ÁREA DE PRODUTOS */}
      <div className="flex-1 overflow-y-auto p-4">
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
              const categoriaProduto = encontrarCategoriaPorNome ? 
                encontrarCategoriaPorNome(produto.categoria) : 
                categorias.find(c => c.nome.toLowerCase() === produto.categoria.toLowerCase());
              
              return (
                <button
                  key={produto.id}
                  onClick={() => onAdicionarProduto(produto.id)}
                  className="group bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-lg overflow-hidden transition-all duration-200 hover:scale-[1.02] active:scale-95 flex flex-col"
                >
                  <div className="relative h-40 bg-gradient-to-br from-gray-50 to-gray-100">
                    <img
                      src={produto.imagem || '/placeholder-product.jpg'}
                      alt={produto.nome}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                      }}
                    />
                    
                    <div className="absolute bottom-3 right-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold px-3 py-2 rounded-lg shadow-lg text-sm">
                      R$ {produto.preco.toFixed(2)}
                    </div>
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  
                  <div className="p-4 flex-1">
                    <span 
                      className="font-semibold text-gray-800 text-sm line-clamp-2 text-left block leading-tight mb-2"
                      title={produto.nome.length > 50 ? produto.nome : undefined}
                    >
                      {truncarTexto(produto.nome, 50)}
                    </span>
                    
                    <div className="flex justify-between items-center">
                      <span 
                        className={`text-xs ${getCategoriaColor(produto.categoria)} px-2 py-1 rounded font-medium`}
                        title={produto.categoria}
                      >
                        {truncarTexto(produto.categoria, 8)}
                      </span>
                      <span className="text-sm bg-blue-100 text-blue-700 font-medium px-3 py-1 rounded-lg">
                        +
                      </span>
                    </div>
                    
                    {categoriaProduto && (
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <span className="mr-1">
                          {categoriaProduto.usaImagem ? '🖼️' : categoriaProduto.icone}
                        </span>
                        <span className="truncate" title={categoriaProduto.nome}>
                          {truncarTexto(categoriaProduto.nome, 15)}
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
          <span className="text-gray-500 max-w-[50%] truncate" title={
            categoriaAtiva === 'todos' ? 'Todas categorias' : 
            categorias.find(c => c.id === categoriaAtiva)?.nome
          }>
            {categoriaAtiva === 'todos' ? 'Todas categorias' : 
             truncarTexto(categorias.find(c => c.id === categoriaAtiva)?.nome || 'Selecionada', 20)}
          </span>
        </div>
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