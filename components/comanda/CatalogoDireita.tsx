// components/comanda/CatalogoDireita.tsx - VERSÃO COM IMAGENS REAIS
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

// Componente para imagem com fallback
const ProdutoImagem = ({ src, alt }: { src?: string; alt: string }) => {
  if (!src || src === '/placeholder-product.jpg') {
    // Fallback para emoji baseado no nome
    const emoji = alt.includes('bebida') || alt.includes('refri') || alt.includes('água') || alt.includes('suco') ? '🥤' :
                  alt.includes('hambúrguer') || alt.includes('lanche') || alt.includes('pizza') ? '🍔' :
                  alt.includes('batata') || alt.includes('frit') ? '🍟' :
                  alt.includes('sobremesa') || alt.includes('sorvete') || alt.includes('bolo') ? '🍰' : '📦';
    
    return (
      <div className="w-16 h-16 bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
        <span className="text-2xl">{emoji}</span>
      </div>
    );
  }
  
  // Se for base64 (data:image...)
  if (src.startsWith('data:image')) {
    return (
      <div className="w-16 h-16 rounded-lg mb-2 overflow-hidden">
        <img 
          src={src} 
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Se der erro ao carregar, mostrar fallback
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).parentElement!.innerHTML = `
              <div class="w-full h-full bg-gray-100 flex items-center justify-center">
                <span class="text-2xl">📦</span>
              </div>
            `;
          }}
        />
      </div>
    );
  }
  
  // Se for URL normal
  return (
    <div className="w-16 h-16 rounded-lg mb-2 overflow-hidden">
      <img 
        src={src.startsWith('/') ? src : `/${src}`}
        alt={alt}
        className="w-full h-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
          (e.target as HTMLImageElement).parentElement!.innerHTML = `
            <div class="w-full h-full bg-gray-100 flex items-center justify-center">
              <span class="text-2xl">📦</span>
            </div>
          `;
        }}
      />
    </div>
  );
};

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
    <div className="space-y-4">
      {/* Barra de busca simples */}
      <div className="bg-white rounded-xl shadow-sm border p-3">
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 Buscar produto..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            value={busca}
            onChange={(e) => onBuscar(e.target.value)}
          />
          {busca && (
            <button
              onClick={() => onBuscar('')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Categorias - apenas quadradinhos com imagem */}
      <div className="bg-white rounded-xl shadow-sm border p-3">
        <div className="grid grid-cols-5 gap-2">
          {categorias.map((categoria) => (
            <button
              key={categoria.id}
              onClick={() => onSelecionarCategoria(categoria.id)}
              className={`flex flex-col items-center p-2 rounded-lg border transition-all ${
                categoriaAtiva === categoria.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              title={categoria.nome}
            >
              <div className="text-2xl mb-1">{categoria.icone}</div>
              <span className="text-xs text-gray-700 truncate w-full text-center">
                {categoria.nome}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Produtos - 3x3 COM IMAGENS REAIS */}
      <div className="bg-white rounded-xl shadow-sm border p-3">
        <div className="grid grid-cols-3 gap-3">
          {produtos.length === 0 ? (
            <div className="col-span-3 text-center py-8">
              <div className="text-gray-300 text-4xl mb-3">📦</div>
              <p className="text-gray-500">Nenhum produto encontrado</p>
            </div>
          ) : (
            produtos.map((produto) => (
              <button
                key={produto.id}
                onClick={() => onAdicionarProduto(produto.id)}
                className="group border border-gray-200 rounded-lg p-2 hover:border-blue-300 hover:shadow transition-all flex flex-col items-center"
              >
                {/* IMAGEM REAL DO PRODUTO */}
                <ProdutoImagem src={produto.imagem} alt={produto.nome} />
                
                {/* Nome do produto */}
                <span className="text-sm font-medium text-gray-800 text-center mb-1 truncate w-full">
                  {produto.nome}
                </span>
                
                {/* Preço */}
                <span className="text-lg font-bold text-blue-700">
                  R$ {produto.preco.toFixed(2)}
                </span>
                
                {/* Badge de categoria */}
                <span className="text-xs text-gray-500 mt-1 px-2 py-0.5 bg-gray-100 rounded">
                  {produto.categoria}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Contador de produtos */}
      <div className="pb-8">
        {produtos.length} produto{produtos.length !== 1 ? 's' : ''} disponível{produtos.length !== 1 ? 'is' : ''}
      </div>
    </div>
  );
}