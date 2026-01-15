// components/comanda/CatalogoDireita.tsx - VERSÃO PDV PROFISSIONAL CORRIGIDA
'use client';

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
} 

interface CatalogoDireitaProps {
  produtos: Produto[];
  categorias: Categoria[];
  categoriaAtiva: string;
  busca: string;
  onSelecionarCategoria: (categoriaId: string) => void;
  onBuscar: (texto: string) => void;
  onAdicionarProduto: (produtoId: string) => void; 
}

export default function CatalogoDireita({
  produtos,
  categorias,
  categoriaAtiva,
  busca,
  onSelecionarCategoria,
  onBuscar,
  onAdicionarProduto
}: CatalogoDireitaProps) {
  
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
      
      {/* Categorias FIXAS no topo da área de produtos */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {categorias.map((categoria) => (
            <button
              key={categoria.id}
              onClick={() => onSelecionarCategoria(categoria.id)}
              className={`flex-shrink-0 flex flex-col items-center ${categoriaAtiva === categoria.id ? 'scale-105' : ''}`}
            >
              {/* Ícone circular PEQUENO */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-1 ${
                categoriaAtiva === categoria.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
                <span className="text-lg">{categoria.icone}</span>
              </div>
              
              {/* Nome da categoria */}
              <span className={`text-xs font-medium ${
                categoriaAtiva === categoria.id
                  ? 'text-blue-600'
                  : 'text-gray-600'
              }`}>
                {categoria.nome}
              </span>
            </button>
          ))}
        </div>
      </div>
      
      {/* ÁREA DE PRODUTOS COM SCROLL (adicionei esta div) */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Grid de Produtos - LIMPO E RESPONSIVO */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {produtos.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">Nenhum produto encontrado</p>
              <p className="text-sm text-gray-400 mt-1">
                {busca ? `Busca: "${busca}"` : `Categoria: ${categorias.find(c => c.id === categoriaAtiva)?.nome || 'Selecionada'}`}
              </p>
            </div>
          ) : (
            produtos.map((produto) => (
              <button
                key={produto.id}
                onClick={() => onAdicionarProduto(produto.id)}
                className="group bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 overflow-hidden transition-all duration-200 hover:scale-[1.02] flex flex-col"
              >
                {/* Imagem ocupando mais espaço */}
                <div className="relative h-32 overflow-hidden bg-gray-100">
                  <img
                    src={produto.imagem || '/placeholder-product.jpg'}
                    alt={produto.nome}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                    }}
                  />
                  {/* Badge de preço flutuante */}
                  <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-lg font-bold text-sm shadow-lg">
                    R$ {produto.preco.toFixed(2)}
                  </div>
                </div>
                
                {/* Informações compactas */}
                <div className="p-2 flex flex-col flex-1">
                  <span className="text-sm font-medium text-gray-800 line-clamp-2">
                    {produto.nome}
                  </span>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {produto.categoria}
                    </span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      +
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
      
      {/* Status Bar (opcional) */}
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
      </div>
    </div>
  );
}