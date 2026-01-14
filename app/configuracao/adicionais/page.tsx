 
// app/configuracao/adicionais/page.tsx - PÁGINA PRINCIPAL
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  EyeOff,
  Filter,
  RefreshCw,
  Tag,
  DollarSign
} from 'lucide-react';

interface Adicional {
  _id: string;
  nome: string;
  descricao?: string;
  preco: number;
  categoria: string;
  gratuito: boolean; // ← NOVO CAMPO
  ativo: boolean;
  criadoEm: string;
}

export default function AdicionaisPage() {
  const [adicionais, setAdicionais] = useState<Adicional[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [categorias, setCategorias] = useState<string[]>([]);

  useEffect(() => {
    carregarAdicionais();
  }, [mostrarInativos]);

  const carregarAdicionais = async () => {
    try {
      setCarregando(true);
      setErroCarregamento(null);
      
      const query = new URLSearchParams();
      if (!mostrarInativos) query.append('ativos', 'true');
      
      const response = await fetch(`/api/adicionais?${query}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar adicionais');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setAdicionais(data.data);
        
        // Extrair categorias únicas
        const cats: string[] = Array.from(
          new Set(data.data.map((a: Adicional) => a.categoria))
        ) as string[];
        setCategorias(cats);
      }
    } catch (error) {
      console.error('Erro ao carregar adicionais:', error);
      setErroCarregamento('Não foi possível carregar os adicionais');
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

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const toggleAtivo = async (adicional: Adicional) => {
    const acao = adicional.ativo ? 'desativar' : 'ativar';
    
    if (!confirm(`Deseja ${acao} o adicional "${adicional.nome}"?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/adicionais/${adicional._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !adicional.ativo })
      });
      
      if (response.ok) {
        carregarAdicionais();
      } else {
        const data = await response.json();
        alert(data.error || `Erro ao ${acao} adicional`);
      }
    } catch (error) {
      console.error('Erro ao atualizar adicional:', error);
      alert(`Erro ao ${acao} adicional`);
    }
  };

  const excluirAdicional = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir o adicional "${nome}"?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/adicionais/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        carregarAdicionais();
      } else {
        alert(data.error || 'Erro ao excluir adicional');
      }
    } catch (error) {
      console.error('Erro ao excluir adicional:', error);
      alert('Erro ao excluir adicional');
    }
  };

  const adicionaisFiltrados = adicionais.filter(adicional => {
    const buscaMatch = 
      adicional.nome.toLowerCase().includes(busca.toLowerCase()) ||
      adicional.descricao?.toLowerCase().includes(busca.toLowerCase()) ||
      adicional.categoria.toLowerCase().includes(busca.toLowerCase());
    
    const categoriaMatch = filtroCategoria === 'todas' || 
      adicional.categoria === filtroCategoria;
    
    return buscaMatch && categoriaMatch;
  });

  const limparFiltros = () => {
    setBusca('');
    setFiltroCategoria('todas');
    setMostrarInativos(false);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <div className="flex items-center mb-2">
            <Plus className="h-8 w-8 text-purple-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Adicionais</h1>
          </div>
          <p className="text-gray-600">
            Gerencie opções extras para os produtos
          </p>
        </div>
        <div className="mt-4 lg:mt-0 flex items-center space-x-3">
          <button
            onClick={limparFiltros}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            aria-label="Limpar filtros"
          >
            Limpar Filtros
          </button>
          <button
            onClick={carregarAdicionais}
            disabled={carregando}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center"
            aria-label="Atualizar lista"
          >
            <RefreshCw className={`h-5 w-5 mr-2 ${carregando ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <Link
            href="/configuracao/adicionais/novo"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Novo Adicional
          </Link>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar adicionais por nome, descrição ou categoria..."
                aria-label="Buscar adicionais"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-[150px]"
              aria-label="Filtrar por categoria"
            >
              <option value="todas">Todas categorias</option>
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            
            <button
              onClick={() => setMostrarInativos(!mostrarInativos)}
              className={`flex items-center px-3 py-2 rounded-lg ${mostrarInativos 
                ? 'bg-gray-200 text-gray-800' 
                : 'bg-white border border-gray-300 text-gray-700'
              }`}
              aria-label={mostrarInativos ? "Ocultar inativos" : "Mostrar inativos"}
            >
              {mostrarInativos ? (
                <Eye className="h-5 w-5 mr-2" />
              ) : (
                <EyeOff className="h-5 w-5 mr-2" />
              )}
              Inativos
            </button>
          </div>
        </div>
        
        {/* Mensagem de erro */}
        {erroCarregamento && (
          <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {erroCarregamento}
          </div>
        )}
      </div>

      {/* Stats - adicione um novo card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
            <div className="text-sm text-gray-600">Total de Adicionais</div>
            <div className="text-2xl font-bold mt-1">{adicionais.length}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
            <div className="text-sm text-gray-600">Adicionais Ativos</div>
            <div className="text-2xl font-bold mt-1 text-green-600">
            {adicionais.filter(a => a.ativo).length}
            </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
            <div className="text-sm text-gray-600">Gratuitos</div>
            <div className="text-2xl font-bold mt-1 text-blue-600">
            {adicionais.filter(a => a.gratuito).length}
            </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
            <div className="text-sm text-gray-600">Com Preço</div>
            <div className="text-2xl font-bold mt-1 text-purple-600">
            {adicionais.filter(a => !a.gratuito).length}
            </div>
        </div>
        </div>


      {/* Tabela de Adicionais */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preço
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {carregando ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mb-4"></div>
                      <p className="text-gray-600">Carregando adicionais...</p>
                    </div>
                  </td>
                </tr>
              ) : adicionaisFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Plus className="h-12 w-12 text-gray-300 mb-4" />
                      <p className="text-gray-500 text-lg font-medium mb-2">
                        Nenhum adicional encontrado
                      </p>
                      <p className="text-gray-400">
                        {busca || filtroCategoria !== 'todas' || mostrarInativos
                          ? 'Tente ajustar seus filtros de busca'
                          : 'Comece adicionando seu primeiro adicional'
                        }
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                adicionaisFiltrados.map((adicional) => (
                  <tr key={adicional._id} className={`hover:bg-gray-50 ${!adicional.ativo ? 'opacity-70 bg-gray-50' : ''}`}>
                    <td className="px-6 py-4">
                    <div>
                        {/* NOME COM BADGE DE GRATUITO */}
                        <div className="font-medium text-gray-900 flex items-center">
                        {adicional.nome}
                        {adicional.gratuito && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full font-semibold">
                            Gratuito
                            </span>
                        )}
                        </div>
                        
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                        {adicional.descricao || 'Sem descrição'}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Criado em {formatarData(adicional.criadoEm)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Tag className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-900">{adicional.categoria}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">
                        {adicional.gratuito ? (
                        <span className="text-green-600">GRATUITO</span>
                        ) : (
                        formatarMoeda(adicional.preco)
                        )}
                    </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleAtivo(adicional)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium cursor-pointer ${
                          adicional.ativo
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                        aria-label={adicional.ativo ? "Desativar adicional" : "Ativar adicional"}
                      >
                        {adicional.ativo ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/configuracao/adicionais/editar/${adicional._id}`}
                          className="p-1.5 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded"
                          title="Editar"
                          aria-label={`Editar ${adicional.nome}`}
                        >
                          <Edit className="h-5 w-5" />
                        </Link>
                        <button
                          onClick={() => excluirAdicional(adicional._id, adicional.nome)}
                          className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          title="Excluir"
                          aria-label={`Excluir ${adicional.nome}`}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 text-sm text-gray-500">
        Mostrando {adicionaisFiltrados.length} de {adicionais.length} adicionais
        {busca && ` • Resultados para: "${busca}"`}
        {filtroCategoria !== 'todas' && ` • Categoria: ${filtroCategoria}`}
      </div>
    </div>
  );
}