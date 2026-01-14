// app/configuracao/categorias/page.tsx - VERSÃO COMPLETA COM IMAGEM/ÍCONE HÍBRIDO
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Tag, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  EyeOff,
  ArrowUpDown,
  Filter,
  Image as ImageIcon,
  Palette
} from 'lucide-react';

interface Categoria {
  _id: string;
  nome: string;
  descricao?: string;
  icone?: string;
  imagem?: string;
  usaImagem?: boolean;
  ordem: number;
  ativo: boolean;
  criadoEm: string;
}

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [mostrarInativas, setMostrarInativas] = useState(false);
  const [ordenacao, setOrdenacao] = useState<'nome' | 'ordem'>('ordem');
  const [direcao, setDirecao] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    carregarCategorias();
  }, [mostrarInativas]);

  const carregarCategorias = async () => {
  try {
    setCarregando(true);
    const query = new URLSearchParams();
    if (!mostrarInativas) query.append('ativas', 'true');
    
    const response = await fetch(`/api/categorias?${query}`);
    const data = await response.json();
    
    // APENAS ESTE LOG PARA VER O QUE VEM DA API
    console.log('DEBUG: Primeira categoria:', data.data[0]);
    
    if (data.success) {
      setCategorias(data.data);
    }
  } catch (error) {
    console.error('Erro ao carregar categorias:', error);
  } finally {
    setCarregando(false);
  }
};

  const toggleAtivo = async (categoria: Categoria) => {
    try {
      const response = await fetch(`/api/categorias/${categoria._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !categoria.ativo })
      });
      
      if (response.ok) {
        carregarCategorias();
      }
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
    }
  };

  const excluirCategoria = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir a categoria "${nome}"?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/categorias/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        carregarCategorias();
      } else {
        alert(data.error || 'Erro ao excluir categoria');
      }
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      alert('Erro ao excluir categoria');
    }
  };

  const categoriasOrdenadas = [...categorias].sort((a, b) => {
    if (ordenacao === 'nome') {
      return direcao === 'asc' 
        ? a.nome.localeCompare(b.nome)
        : b.nome.localeCompare(a.nome);
    } else {
      return direcao === 'asc' ? a.ordem - b.ordem : b.ordem - a.ordem;
    }
  });

  const categoriasFiltradas = categoriasOrdenadas.filter(categoria =>
    categoria.nome.toLowerCase().includes(busca.toLowerCase()) ||
    categoria.descricao?.toLowerCase().includes(busca.toLowerCase())
  );

  const toggleOrdenacao = (campo: 'nome' | 'ordem') => {
    if (ordenacao === campo) {
      setDirecao(direcao === 'asc' ? 'desc' : 'asc');
    } else {
      setOrdenacao(campo);
      setDirecao('asc');
    }
  };

  // 🔹 PARTE 4 - Componente para imagem/ícone da categoria
 const CategoriaImagem = ({ categoria }: { categoria: Categoria }) => {
  console.log('DEBUG Componente:', {
    nome: categoria.nome,
    usaImagem: categoria.usaImagem,
    temImagem: !!categoria.imagem
  });
  
  // Se usaImagem é true E tem imagem, mostra imagem
  if (categoria.usaImagem === true && categoria.imagem) {
    return (
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
        <img 
          src={categoria.imagem} 
          alt={categoria.nome}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }
  
  // Senão, mostra ícone
  return (
    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
      <div className="text-3xl">{categoria.icone || '📦'}</div>
    </div>
  );
};

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <div className="flex items-center mb-2">
            <Tag className="h-8 w-8 text-green-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
          </div>
          <p className="text-gray-600">
            Organize produtos por categorias
          </p>
        </div>
        <div className="mt-4 lg:mt-0">
          <Link
            href="/configuracao/categorias/novo"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nova Categoria
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar categorias..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => toggleOrdenacao('ordem')}
              className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <ArrowUpDown className="h-5 w-5 mr-2" />
              Ordem {ordenacao === 'ordem' && (direcao === 'asc' ? '↑' : '↓')}
            </button>
            
            <button
              onClick={() => setMostrarInativas(!mostrarInativas)}
              className={`flex items-center px-3 py-2 rounded-lg ${mostrarInativas 
                ? 'bg-gray-200 text-gray-800' 
                : 'bg-white border border-gray-300 text-gray-700'
              }`}
            >
              {mostrarInativas ? (
                <Eye className="h-5 w-5 mr-2" />
              ) : (
                <EyeOff className="h-5 w-5 mr-2" />
              )}
              Inativas
            </button>
            
            <button
              onClick={carregarCategorias}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <Filter className="h-5 w-5 mr-2" />
              Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* 🔹 PARTE 6 - Stats Atualizados */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-600">Total de Categorias</div>
          <div className="text-2xl font-bold mt-1">{categorias.length}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-600">Categorias Ativas</div>
          <div className="text-2xl font-bold mt-1 text-green-600">
            {categorias.filter(c => c.ativo).length}
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-600">Usam Imagem</div>
          <div className="text-2xl font-bold mt-1 text-blue-600">
            {categorias.filter(c => c.usaImagem).length}
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-600">Usam Ícone</div>
          <div className="text-2xl font-bold mt-1 text-purple-600">
            {categorias.filter(c => !c.usaImagem).length}
          </div>
        </div>
      </div>

      {/* Grid de Categorias */}
      {carregando ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : categoriasFiltradas.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma categoria encontrada</h3>
          <p className="text-gray-600 mb-6">
            {busca ? 'Tente outra busca' : 'Comece criando sua primeira categoria'}
          </p>
          <Link
            href="/configuracao/categorias/novo"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Criar Primeira Categoria
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoriasFiltradas.map((categoria) => (
            <div 
              key={categoria._id} 
              className={`bg-white rounded-xl border p-6 hover:shadow-md transition-shadow ${!categoria.ativo ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  {/* 🔹 PARTE 4 - Usando o componente CategoriaImagem */}
                  <CategoriaImagem categoria={categoria} />
                  <div className="ml-3">
                    <h3 className="font-bold text-gray-900">{categoria.nome}</h3>
                    <div className="flex items-center mt-1">
                      <span className="text-sm text-gray-500">Ordem: {categoria.ordem}</span>
                      <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${categoria.ativo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                      }`}>
                        {categoria.ativo ? 'Ativa' : 'Inativa'}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        {categoria.usaImagem ? (
                          <span className="flex items-center">
                            <ImageIcon className="h-3 w-3 mr-1" /> Imagem
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <Palette className="h-3 w-3 mr-1" /> Ícone
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Link
                    href={`/configuracao/categorias/editar/${categoria._id}`}
                    className="p-1 text-green-600 hover:text-green-800"
                    title="Editar"
                  >
                    <Edit className="h-5 w-5" />
                  </Link>
                  <button
                    onClick={() => toggleAtivo(categoria)}
                    className="p-1 text-gray-600 hover:text-gray-800"
                    title={categoria.ativo ? 'Desativar' : 'Ativar'}
                  >
                    {categoria.ativo ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    onClick={() => excluirCategoria(categoria._id, categoria.nome)}
                    className="p-1 text-red-600 hover:text-red-800"
                    title="Excluir"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {categoria.descricao && (
                <p className="text-gray-600 text-sm mb-4">{categoria.descricao}</p>
              )}
              
              <div className="text-xs text-gray-500">
                Criada em {new Date(categoria.criadoEm).toLocaleDateString('pt-BR')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}