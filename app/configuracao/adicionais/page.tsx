// app/configuracao/adicionais/page.tsx - COM PERMISSÕES
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
  DollarSign,
  Lock,
  Loader2
} from 'lucide-react';

interface Adicional {
  _id: string;
  nome: string;
  descricao?: string;
  preco: number;
  categoria: string;
  gratuito: boolean;
  ativo: boolean;
  criadoEm: string;
}

interface UsuarioLogado {
  role: string;
  permissoes: Record<string, boolean>;
}

export default function AdicionaisPage() {
  const [adicionais, setAdicionais] = useState<Adicional[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [carregandoPermissoes, setCarregandoPermissoes] = useState(true);
  const [busca, setBusca] = useState('');
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [categorias, setCategorias] = useState<string[]>([]);
  
  // ✅ NOVO: Estado para usuário logado
  const [usuarioLogado, setUsuarioLogado] = useState<UsuarioLogado | null>(null);

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

  useEffect(() => {
    if (usuarioLogado !== null) {
      carregarAdicionais();
    }
  }, [mostrarInativos, usuarioLogado]);

  // ✅ NOVO: Função de verificação de permissões
  const temPermissao = (permissao: string): boolean => {
    if (!usuarioLogado) return false;
    
    // Admin tem todas as permissões
    if (usuarioLogado.role === 'admin') return true;
    
    // Verifica permissão específica
    return usuarioLogado.permissoes[permissao] === true;
  };

  // ✅ NOVO: Verificar se pode gerenciar adicionais
  const podeGerenciarAdicionais = temPermissao('canManageAdicionais');

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

  // ✅ NOVO: Tela de carregamento de permissões
  if (carregandoPermissoes) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 text-purple-600 animate-spin mr-3" />
          <span className="text-gray-600">Carregando permissões...</span>
        </div>
      </div>
    );
  }

  // ✅ NOVO: Verificar se tem permissão para ver adicionais
  const podeVerAdicionais = temPermissao('canViewAdicionais') || podeGerenciarAdicionais;

  if (!podeVerAdicionais) {
    return (
      <div className="p-6">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="bg-red-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <Lock className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Acesso Negado</h2>
          <p className="text-gray-600 mb-6">
            Você não tem permissão para visualizar adicionais.
            {usuarioLogado && (
              <span className="block mt-2 text-sm text-gray-500">
                Função: {usuarioLogado.role.toUpperCase()}
              </span>
            )}
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Voltar para Dashboard
          </Link>
        </div>
      </div>
    );
  }

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
    // ✅ NOVO: Verificar permissão
    if (!podeGerenciarAdicionais) {
      alert('Você não tem permissão para gerenciar adicionais!');
      return;
    }

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
    // ✅ NOVO: Verificar permissão
    if (!podeGerenciarAdicionais) {
      alert('Você não tem permissão para excluir adicionais!');
      return;
    }

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

  // ✅ NOVO: Banner de permissões
  const renderizarBannerPermissoes = () => {
    return (
      <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <div className="flex items-start">
          <Plus className="h-5 w-5 text-purple-600 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-purple-800">
              Gerenciamento de Adicionais
            </h3>
            <div className="mt-1 text-sm text-purple-700">
              <p>
                {podeGerenciarAdicionais 
                  ? 'Você tem permissão completa para gerenciar adicionais.' 
                  : 'Você tem permissão apenas para visualizar adicionais.'
                }
              </p>
              {usuarioLogado && (
                <div className="flex items-center mt-2 space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    usuarioLogado.role === 'admin' ? 'bg-red-100 text-red-800' :
                    usuarioLogado.role === 'gerente' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {usuarioLogado.role.toUpperCase()}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    podeGerenciarAdicionais ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {podeGerenciarAdicionais ? 'Permissão Total' : 'Somente Visualização'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
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
          {/* ✅ NOVO: Badge de função */}
          {usuarioLogado && (
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              usuarioLogado.role === 'admin' ? 'bg-red-100 text-red-800' :
              usuarioLogado.role === 'gerente' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {usuarioLogado.role.toUpperCase()}
            </span>
          )}
          
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
          
          {/* ✅ NOVO: Botão condicional baseado em permissão */}
          {podeGerenciarAdicionais && (
            <Link
              href="/configuracao/adicionais/novo"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Novo Adicional
            </Link>
          )}
        </div>
      </div>

      {/* ✅ NOVO: Banner de permissões */}
      {renderizarBannerPermissoes()}

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

      {/* Stats */}
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
                      {podeGerenciarAdicionais && !busca && filtroCategoria === 'todas' && !mostrarInativos && (
                        <Link
                          href="/configuracao/adicionais/novo"
                          className="mt-4 inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
                        >
                          <Plus className="h-5 w-5 mr-2" />
                          Adicionar Primeiro Adicional
                        </Link>
                      )}
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
                      {/* ✅ NOVO: Botão condicional baseado em permissão */}
                      {podeGerenciarAdicionais ? (
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
                      ) : (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          adicional.ativo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {adicional.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4">
                      {/* ✅ NOVO: Botões condicionais baseados em permissão */}
                      {podeGerenciarAdicionais ? (
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
                      ) : (
                        <div className="text-xs text-gray-500 italic">
                          Somente visualização
                        </div>
                      )}
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
        {!podeGerenciarAdicionais && ` • Modo de visualização`}
      </div>
    </div>
  );
}