// app/configuracao/usuarios/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, Search, Plus, Edit, Trash2, Mail,
  Filter, Eye, EyeOff, RefreshCw, AlertCircle,
  AlertTriangle, CheckCircle, XCircle  // ← ADICIONE ESTES
} from 'lucide-react';

import { roleTemplates } from '@/lib/models/user';

interface Usuario {
  _id: string;
  email: string;
  nome: string;
  role: 'admin' | 'gerente' | 'garcom' | 'caixa';
  ativo: boolean;
  criadoEm: string;
  ultimoLogin?: string;
  permissoes: any;
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioLogado, setUsuarioLogado] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroRole, setFiltroRole] = useState<string>('todos');
  const [mostrarInativas, setMostrarInativas] = useState(false);
  
  // ↓↓↓ ADICIONE ESTES ESTADOS ↓↓↓
  const [modalExclusao, setModalExclusao] = useState<{
    aberto: boolean;
    usuarioId: string;
    usuarioNome: string;
    usuarioEmail: string;
  }>({ aberto: false, usuarioId: '', usuarioNome: '', usuarioEmail: '' });

  const [modalStatus, setModalStatus] = useState<{
    aberto: boolean;
    tipo: 'sucesso' | 'erro' | 'info';
    titulo: string;
    mensagem: string;
  }>({ aberto: false, tipo: 'info', titulo: '', mensagem: '' });

  useEffect(() => {
    // Carrega usuário logado do localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUsuarioLogado(JSON.parse(userStr));
      } catch (e) {
        console.error('Erro ao carregar usuário logado:', e);
      }
    }
    
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    try {
      setCarregando(true);
      const response = await fetch('/api/usuarios');
      const data = await response.json();
      
      if (data.success) {
        setUsuarios(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setCarregando(false);
    }
  };

   const abrirModalExclusao = (usuario: Usuario) => {
    setModalExclusao({
      aberto: true,
      usuarioId: usuario._id,
      usuarioNome: usuario.nome,
      usuarioEmail: usuario.email
    });
  };

  const excluirUsuario = async () => {
    try {
      const response = await fetch(`/api/usuarios/${modalExclusao.usuarioId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setModalExclusao({ aberto: false, usuarioId: '', usuarioNome: '', usuarioEmail: '' });
        setModalStatus({
          aberto: true,
          tipo: 'sucesso',
          titulo: 'Sucesso!',
          mensagem: `Usuário "${modalExclusao.usuarioNome}" excluído com sucesso.`
        });
        carregarUsuarios();
      } else {
        setModalExclusao({ aberto: false, usuarioId: '', usuarioNome: '', usuarioEmail: '' });
        setModalStatus({
          aberto: true,
          tipo: 'erro',
          titulo: 'Erro',
          mensagem: data.error || 'Erro ao excluir usuário'
        });
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      setModalExclusao({ aberto: false, usuarioId: '', usuarioNome: '', usuarioEmail: '' });
      setModalStatus({
        aberto: true,
        tipo: 'erro',
        titulo: 'Erro',
        mensagem: 'Erro de conexão com o servidor'
      });
    }
  };
  

  const toggleAtivo = async (usuario: Usuario) => {
    if (!confirm(`Tem certeza que deseja ${usuario.ativo ? 'desativar' : 'ativar'} o usuário ${usuario.nome}?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/usuarios/${usuario._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !usuario.ativo })
      });
      
      if (response.ok) {
        carregarUsuarios();
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
    }
  };


  const usuariosFiltrados = usuarios.filter(usuario => {
    // Filtro por busca
    const passaBusca = 
      usuario.nome.toLowerCase().includes(busca.toLowerCase()) ||
      usuario.email.toLowerCase().includes(busca.toLowerCase()) ||
      usuario.role.toLowerCase().includes(busca.toLowerCase());
    
    // Filtro por role
    const passaRole = filtroRole === 'todos' || usuario.role === filtroRole;
    
    // Filtro por status
    const passaStatus = mostrarInativas ? true : usuario.ativo;
    
    return passaBusca && passaRole && passaStatus;
  });

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'gerente': return 'bg-blue-100 text-blue-800';
      case 'garcom': return 'bg-green-100 text-green-800';
      case 'caixa': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch(role) {
      case 'admin': return '👑';
      case 'gerente': return '👔';
      case 'garcom': return '🍽️';
      case 'caixa': return '💰';
      default: return '👤';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <div className="flex items-center mb-2">
            <Users className="h-8 w-8 text-purple-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          </div>
          <p className="text-gray-600">
            Gerencie usuários e permissões do sistema
          </p>
        </div>
        <div className="mt-4 lg:mt-0">
          {usuarioLogado?.permissoes?.canManageUsers && (
  <Link
    href="/configuracao/usuarios/novo"
    className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
  >
    <Plus className="h-5 w-5 mr-2" />
    Novo Usuário
  </Link>
)}
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
                placeholder="Buscar por nome, email ou função..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <select
              value={filtroRole}
              onChange={(e) => setFiltroRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700"
            >
              <option value="todos">Todas as funções</option>
              <option value="admin">Administrador</option>
              <option value="gerente">Gerente</option>
              <option value="garcom">Garçom</option>
              <option value="caixa">Caixa</option>
            </select>
            
            <button
            onClick={() => setMostrarInativas(!mostrarInativas)}  // ← CORRIGIDO
            className={`flex items-center px-3 py-2 rounded-lg ${mostrarInativas 
                ? 'bg-gray-200 text-gray-800' 
                : 'bg-white border border-gray-300 text-gray-700'
            }`}
            >
            {mostrarInativas ? (  // ← TAMBÉM CORRIGIR AQUI
                <Eye className="h-5 w-5 mr-2" />
            ) : (
                <EyeOff className="h-5 w-5 mr-2" />
            )}
            Inativas
            </button>
            
            <button
              onClick={carregarUsuarios}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
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
          <div className="text-sm text-gray-600">Total de Usuários</div>
          <div className="text-2xl font-bold mt-1">{usuarios.length}</div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-600">Usuários Ativos</div>
          <div className="text-2xl font-bold mt-1 text-green-600">
            {usuarios.filter(u => u.ativo).length}
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-600">Administradores</div>
          <div className="text-2xl font-bold mt-1 text-red-600">
            {usuarios.filter(u => u.role === 'admin').length}
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm text-gray-600">Último Cadastro</div>
          <div className="text-lg font-semibold mt-1">
            {usuarios.length > 0 
              ? new Date(usuarios[usuarios.length - 1].criadoEm).toLocaleDateString('pt-BR')
              : 'N/A'
            }
          </div>
        </div>
      </div>

      {/* Tabela de Usuários */}
      {carregando ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : usuariosFiltrados.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum usuário encontrado</h3>
          <p className="text-gray-600 mb-6">
            {busca ? 'Tente outra busca' : 'Comece criando seu primeiro usuário'}
          </p>
          <Link
            href="/configuracao/usuarios/novo"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Criar Primeiro Usuário
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Função
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Último Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usuariosFiltrados.map((usuario) => (
                  <tr key={usuario._id} className={!usuario.ativo ? 'opacity-60' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-800 mr-3 text-xl">
                          {getRoleIcon(usuario.role)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{usuario.nome}</div>
                          <div className="text-sm text-gray-500">
                            <Mail className="inline h-3 w-3 mr-1" />
                            {usuario.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(usuario.role)}`}>
                        {usuario.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${usuario.ativo 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                      }`}>
                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {usuario.ultimoLogin 
                        ? new Date(usuario.ultimoLogin).toLocaleString('pt-BR')
                        : 'Nunca logou'
                      }
                    </td>
                  <td className="px-6 py-4 text-sm font-medium">
  <div className="flex items-center space-x-2">
    {usuarioLogado?.permissoes?.canManageUsers ? (
      <>
        <Link
          href={`/configuracao/usuarios/editar/${usuario._id}`}
          className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors"
          title="Editar Usuário"
        >
          <Edit className="h-4 w-4" />
        </Link>
        
        <button
          onClick={() => toggleAtivo(usuario)}
          className={`p-2 rounded-lg transition-colors ${
            usuario.ativo 
              ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
              : 'bg-green-100 text-green-600 hover:bg-green-200'
          }`}
          title={usuario.ativo ? 'Desativar Usuário' : 'Ativar Usuário'}
        >
          {usuario.ativo ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
        
        {usuarioLogado?.email !== usuario.email && (
          <button
            onClick={() => abrirModalExclusao(usuario)}
            className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
            title="Excluir Usuário"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </>
    ) : (
      <span className="text-xs text-gray-400 italic px-2">
        Sem permissão
      </span>
    )}
  </div>
</td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

     {modalExclusao.aberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-fade-in">
            <div className="flex items-start mb-6">
              <div className="bg-red-100 p-3 rounded-full mr-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Confirmar Exclusão</h3>
                <p className="text-gray-600 mt-1">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-3">
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-red-100 text-red-600 mr-3">
                  👤
                </div>
                <div>
                  <p className="font-bold text-gray-900">{modalExclusao.usuarioNome}</p>
                  <p className="text-sm text-gray-600">{modalExclusao.usuarioEmail}</p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-red-700">
                  <XCircle className="h-4 w-4 mr-2" />
                  <span>Todos os dados serão permanentemente removidos</span>
                </div>
                <div className="flex items-center text-red-700">
                  <XCircle className="h-4 w-4 mr-2" />
                  <span>Histórico e registros serão perdidos</span>
                </div>
                <div className="flex items-center text-red-700">
                  <XCircle className="h-4 w-4 mr-2" />
                  <span>Não será possível recuperar esta conta</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setModalExclusao({ aberto: false, usuarioId: '', usuarioNome: '', usuarioEmail: '' })}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={excluirUsuario}
                className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center justify-center"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                Excluir Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE STATUS */}
      {modalStatus.aberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-fade-in">
            <div className={`p-4 rounded-full mb-6 mx-auto w-20 h-20 flex items-center justify-center ${
              modalStatus.tipo === 'sucesso' ? 'bg-green-100' :
              modalStatus.tipo === 'erro' ? 'bg-red-100' :
              'bg-blue-100'
            }`}>
              {modalStatus.tipo === 'sucesso' ? (
                <CheckCircle className="h-10 w-10 text-green-600" />
              ) : modalStatus.tipo === 'erro' ? (
                <XCircle className="h-10 w-10 text-red-600" />
              ) : (
                <AlertTriangle className="h-10 w-10 text-blue-600" />
              )}
            </div>
            
            <h3 className={`text-xl font-bold text-center mb-2 ${
              modalStatus.tipo === 'sucesso' ? 'text-green-800' :
              modalStatus.tipo === 'erro' ? 'text-red-800' :
              'text-blue-800'
            }`}>
              {modalStatus.titulo}
            </h3>
            
            <p className="text-gray-600 text-center mb-6">
              {modalStatus.mensagem}
            </p>
            
            <button
              onClick={() => setModalStatus({ aberto: false, tipo: 'info', titulo: '', mensagem: '' })}
              className={`w-full py-3 rounded-lg font-medium ${
                modalStatus.tipo === 'sucesso' ? 'bg-green-600 hover:bg-green-700 text-white' :
                modalStatus.tipo === 'erro' ? 'bg-red-600 hover:bg-red-700 text-white' :
                'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}  
    