// app/configuracao/pagamentos/page.tsx - CORRIGIDO
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  CreditCard, 
  DollarSign, 
  Smartphone, 
  Wallet, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  ArrowUpDown,
  Search,
  Filter,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface MeioPagamento {
  _id: string;
  nome: string;
  descricao?: string;
  tipo: 'dinheiro' | 'cartao' | 'pix' | 'outros' | 'personalizado';
  taxa: number;
  ativo: boolean;
  permiteTroco: boolean;
  permiteDividir: boolean;
  icone: string;
  cor: string;
  ordem: number;
  criadoEm: string;
  atualizadoEm: string;
}

const tiposPagamento = [
  { id: 'dinheiro', nome: 'Dinheiro', icone: '💵', cor: '#10B981' },
  { id: 'cartao', nome: 'Cartão', icone: '💳', cor: '#3B82F6' },
  { id: 'pix', nome: 'PIX', icone: '📱', cor: '#32CD32' },
  { id: 'outros', nome: 'Outros', icone: '🔄', cor: '#8B5CF6' },
  { id: 'personalizado', nome: 'Personalizado', icone: '⚙️', cor: '#6366F1' },
];

export default function PagamentosPage() {
  const [meios, setMeios] = useState<MeioPagamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos');
  const [mostrarInativos, setMostrarInativos] = useState(false); // ✅ CORRIGIDO: mostrarInativos (no plural)
  const [ordenacao, setOrdenacao] = useState<'nome' | 'ordem'>('ordem');

  useEffect(() => {
    carregarMeios();
  }, []);

  const carregarMeios = async () => {
    try {
      setCarregando(true);
      const response = await fetch('/api/meios-pagamento');
      const data = await response.json();
      
      if (data.success) {
        setMeios(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar meios de pagamento:', error);
    } finally {
      setCarregando(false);
    }
  };

  const toggleAtivo = async (meio: MeioPagamento) => {
    try {
      const response = await fetch(`/api/meios-pagamento/${meio._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !meio.ativo })
      });
      
      if (response.ok) {
        carregarMeios();
      }
    } catch (error) {
      console.error('Erro ao atualizar meio de pagamento:', error);
    }
  };

  const excluirMeio = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir o meio de pagamento "${nome}"?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/meios-pagamento/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        carregarMeios();
      } else {
        alert(data.error || 'Erro ao excluir meio de pagamento');
      }
    } catch (error) {
      console.error('Erro ao excluir meio de pagamento:', error);
      alert('Erro ao excluir meio de pagamento');
    }
  };

  const getTipoNome = (tipo: string) => {
    const tipoEncontrado = tiposPagamento.find(t => t.id === tipo);
    return tipoEncontrado?.nome || 'Personalizado';
  };

  const getTipoIcone = (tipo: string) => {
    const tipoEncontrado = tiposPagamento.find(t => t.id === tipo);
    return tipoEncontrado?.icone || '💳';
  };

  const meiosFiltrados = meios.filter(meio => {
    // Filtro por busca
    const passaBusca = 
      meio.nome.toLowerCase().includes(busca.toLowerCase()) ||
      meio.descricao?.toLowerCase().includes(busca.toLowerCase());
    
    // Filtro por tipo
    const passaTipo = tipoFiltro === 'todos' || meio.tipo === tipoFiltro;
    
    // Filtro por status - ✅ CORRIGIDO: usar mostrarInativos
    const passaStatus = mostrarInativos ? true : meio.ativo;
    
    return passaBusca && passaTipo && passaStatus;
  }).sort((a, b) => {
    if (ordenacao === 'ordem') {
      return a.ordem - b.ordem;
    }
    return a.nome.localeCompare(b.nome);
  });

  // ✅ CORREÇÃO: Para resolver o erro do Set, convertemos para array primeiro
  const tiposUnicos = () => {
    const tiposSet = new Set(meios.map(m => m.tipo));
    return Array.from(tiposSet).length;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <div className="flex items-center mb-2">
            <CreditCard className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Meios de Pagamento</h1>
          </div>
          <p className="text-gray-600">
            Configure as formas de pagamento aceitas no seu restaurante
          </p>
        </div>
        <div className="mt-4 lg:mt-0">
          <Link
            href="/configuracao/pagamentos/novo"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Novo Meio de Pagamento
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
                placeholder="Buscar meios de pagamento..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={tipoFiltro}
              onChange={(e) => setTipoFiltro(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todos">Todos os tipos</option>
              {tiposPagamento.map(tipo => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nome}
                </option>
              ))}
            </select>
            
            <button
              onClick={() => setMostrarInativos(!mostrarInativos)} // ✅ CORRIGIDO
              className={`flex items-center px-3 py-2 rounded-lg ${
                mostrarInativos // ✅ CORRIGIDO
                  ? 'bg-gray-200 text-gray-800' 
                  : 'bg-white border border-gray-300 text-gray-700'
              }`}
            >
              {mostrarInativos ? ( // ✅ CORRIGIDO
                <Eye className="h-5 w-5 mr-2" />
              ) : (
                <EyeOff className="h-5 w-5 mr-2" />
              )}
              Inativos
            </button>
            
            <button
              onClick={() => setOrdenacao(ordenacao === 'ordem' ? 'nome' : 'ordem')}
              className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <ArrowUpDown className="h-5 w-5 mr-2" />
              {ordenacao === 'ordem' ? 'Ordem' : 'Nome'}
            </button>
            
            <button
              onClick={carregarMeios}
              className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <Filter className="h-5 w-5 mr-2" />
              Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-600">Total</div>
          <div className="text-2xl font-bold mt-1">{meios.length}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-600">Ativos</div>
          <div className="text-2xl font-bold mt-1 text-green-600">
            {meios.filter(m => m.ativo).length}
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-600">Com taxa</div>
          <div className="text-2xl font-bold mt-1">
            {meios.filter(m => m.taxa > 0).length}
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-600">Tipos</div>
          <div className="text-2xl font-bold mt-1">
            {tiposUnicos()} {/* ✅ CORRIGIDO: usando a função */}
          </div>
        </div>
      </div>

      {/* Resto do código permanece igual... */}
      {/* Grid de Meios de Pagamento */}
      {carregando ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : meiosFiltrados.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum meio de pagamento encontrado
          </h3>
          <p className="text-gray-600 mb-6">
            {busca || tipoFiltro !== 'todos' 
              ? 'Tente ajustar os filtros' 
              : 'Comece criando seu primeiro meio de pagamento'}
          </p>
          <Link
            href="/configuracao/pagamentos/novo"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Criar Primeiro Meio
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meiosFiltrados.map((meio) => (
            <div 
              key={meio._id} 
              className={`bg-white rounded-xl border p-5 hover:shadow-md transition-shadow ${
                !meio.ativo ? 'opacity-70' : ''
              }`}
              style={{ borderLeftColor: meio.cor, borderLeftWidth: '4px' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mr-3"
                    style={{ backgroundColor: `${meio.cor}20`, color: meio.cor }}
                  >
                    {meio.icone || getTipoIcone(meio.tipo)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{meio.nome}</h3>
                    <div className="flex items-center mt-1 space-x-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                        {getTipoNome(meio.tipo)}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        meio.ativo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {meio.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                      {meio.taxa > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                          Taxa: {meio.taxa}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Link
                    href={`/configuracao/pagamentos/editar/${meio._id}`}
                    className="p-1 text-blue-600 hover:text-blue-800"
                    title="Editar"
                  >
                    <Edit className="h-5 w-5" />
                  </Link>
                  <button
                    onClick={() => toggleAtivo(meio)}
                    className="p-1 text-gray-600 hover:text-gray-800"
                    title={meio.ativo ? 'Desativar' : 'Ativar'}
                  >
                    {meio.ativo ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    onClick={() => excluirMeio(meio._id, meio.nome)}
                    className="p-1 text-red-600 hover:text-red-800"
                    title="Excluir"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {meio.descricao && (
                <p className="text-gray-600 text-sm mb-3">{meio.descricao}</p>
              )}
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="flex items-center">
                  {meio.permiteTroco ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-400 mr-1" />
                  )}
                  <span className="text-xs text-gray-600">Troco</span>
                </div>
                <div className="flex items-center">
                  {meio.permiteDividir ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-400 mr-1" />
                  )}
                  <span className="text-xs text-gray-600">Dividir</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center text-xs text-gray-500 pt-3 border-t">
                <span>Ordem: {meio.ordem}</span>
                <span>
                  Atualizado: {new Date(meio.atualizadoEm).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}