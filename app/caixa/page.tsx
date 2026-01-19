// app/caixa/page.tsx - Tela principal do caixa
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CashRegister, 
  Lock, 
  Unlock, 
  History, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  User
} from 'lucide-react';

interface CaixaStatus {
  status: 'aberto' | 'fechado';
  abertura?: {
    data: string;
    valorInicial: number;
    usuario: string;
    observacao: string;
  };
  fechamento?: {
    data: string;
    valorFinal: number;
    usuario: string;
    valorEsperado: number;
    diferenca: number;
    statusDiferenca: string;
  };
  totalVendas: number;
  totalEntradas: number;
  totalSaidas: number;
  saldoAtual: number;
}

interface Movimentacao {
  _id: string;
  data: string;
  tipo: 'entrada' | 'saida';
  descricao: string;
  valor: number;
  formaPagamento?: string;
  comandaId?: string;
  mesaId?: string;
}

export default function CaixaPage() {
  const router = useRouter();
  const [caixaStatus, setCaixaStatus] = useState<CaixaStatus | null>(null);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [usuarioPermissao, setUsuarioPermissao] = useState(false);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);

  // Carregar status do caixa
  useEffect(() => {
    carregarCaixa();
    verificarPermissao();
  }, []);

  const carregarCaixa = async () => {
    try {
      setCarregando(true);
      const response = await fetch('/api/caixa/status');
      const data = await response.json();
      
      if (data.success) {
        setCaixaStatus(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar caixa:', error);
    } finally {
      setCarregando(false);
    }
  };

  const carregarMovimentacoes = async () => {
    try {
      const response = await fetch('/api/caixa/movimentacoes?limite=50');
      const data = await response.json();
      
      if (data.success) {
        setMovimentacoes(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error);
    }
  };

  const verificarPermissao = async () => {
    try {
      // Simulação - depois integrar com sistema de usuários
      const perfil = localStorage.getItem('usuario_perfil');
      setUsuarioPermissao(perfil === 'admin' || perfil === 'gerente' || perfil === 'caixa');
    } catch (error) {
      console.error('Erro ao verificar permissão:', error);
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR');
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando informações do caixa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <CashRegister className="h-8 w-8" />
              Controle de Caixa
            </h1>
            <p className="text-gray-600 mt-2">
              Sistema integrado de abertura e fechamento de caixa
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            {usuarioPermissao ? (
              <div className="flex gap-3">
                <button
                  onClick={() => setMostrarHistorico(!mostrarHistorico)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2"
                >
                  <History className="h-4 w-4" />
                  Histórico
                </button>
                {caixaStatus?.status === 'fechado' ? (
                  <button
                    onClick={() => router.push('/caixa/abertura')}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
                  >
                    <Unlock className="h-4 w-4" />
                    Abrir Caixa
                  </button>
                ) : (
                  <button
                    onClick={() => router.push('/caixa/fechamento')}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-2"
                  >
                    <Lock className="h-4 w-4" />
                    Fechar Caixa
                  </button>
                )}
              </div>
            ) : (
              <div className="px-4 py-2 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg">
                <p className="text-sm">Você não tem permissão para abrir/fechar caixa</p>
              </div>
            )}
          </div>
        </div>

        {/* Status do Caixa */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card Status */}
          <div className={`bg-white rounded-xl p-6 shadow-lg border-2 ${caixaStatus?.status === 'aberto' ? 'border-green-500' : 'border-gray-300'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-full ${caixaStatus?.status === 'aberto' ? 'bg-green-100' : 'bg-gray-100'}`}>
                {caixaStatus?.status === 'aberto' ? (
                  <Unlock className="h-6 w-6 text-green-600" />
                ) : (
                  <Lock className="h-6 w-6 text-gray-600" />
                )}
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${caixaStatus?.status === 'aberto' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {caixaStatus?.status === 'aberto' ? 'ABERTO' : 'FECHADO'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-800">Status do Caixa</h3>
            {caixaStatus?.status === 'aberto' && caixaStatus?.abertura && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  Aberto em: {formatarData(caixaStatus.abertura.data)}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <User className="h-4 w-4 mr-2" />
                  Por: {caixaStatus.abertura.usuario}
                </div>
              </div>
            )}
          </div>

          {/* Card Saldo Atual */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-full bg-blue-100">
                <CashRegister className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-800">Saldo em Caixa</h3>
            <div className="mt-2">
              <div className="text-3xl font-bold text-blue-600">
                {formatarMoeda(caixaStatus?.saldoAtual || 0)}
              </div>
              <p className="text-sm text-gray-600 mt-1">Valor atual disponível</p>
            </div>
          </div>

          {/* Card Total Vendas */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-full bg-green-100">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-800">Total Vendas</h3>
            <div className="mt-2">
              <div className="text-3xl font-bold text-green-600">
                {formatarMoeda(caixaStatus?.totalVendas || 0)}
              </div>
              <p className="text-sm text-gray-600 mt-1">Período atual</p>
            </div>
          </div>

          {/* Card Ações Rápidas */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 shadow-lg">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-full bg-white/20">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-white">Ações Rápidas</h3>
            <div className="mt-4 space-y-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100"
                disabled={caixaStatus?.status !== 'aberto'}
              >
                {caixaStatus?.status === 'aberto' ? 'Acessar Comandas' : 'Caixa Fechado'}
              </button>
              
              {caixaStatus?.status === 'aberto' && (
                <button
                  onClick={() => router.push('/caixa/movimentacao')}
                  className="w-full py-2 border border-white text-white rounded-lg font-medium hover:bg-white/10"
                >
                  Nova Movimentação
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Histórico (expandível) */}
        {mostrarHistorico && (
          <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Movimentações
              </h3>
              <button
                onClick={carregarMovimentacoes}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Atualizar
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data/Hora</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Forma Pgto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {movimentacoes.map((mov) => (
                    <tr key={mov._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatarData(mov.data)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          mov.tipo === 'entrada' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {mov.tipo === 'entrada' ? 'ENTRADA' : 'SAÍDA'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {mov.descricao}
                        {mov.mesaId && (
                          <span className="text-xs text-gray-500 ml-2">
                            Mesa {mov.mesaId}
                          </span>
                        )}
                      </td>
                      <td className={`px-4 py-3 text-sm font-medium ${
                        mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {mov.tipo === 'entrada' ? '+' : '-'}{formatarMoeda(mov.valor)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {mov.formaPagamento || '---'}
                      </td>
                    </tr>
                  ))}
                  
                  {movimentacoes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        Nenhuma movimentação registrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Informações do Último Fechamento */}
        {caixaStatus?.status === 'fechado' && caixaStatus?.fechamento && (
          <div className="bg-white rounded-xl p-6 shadow-lg mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Último Fechamento</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                caixaStatus.fechamento.statusDiferenca === 'ok' 
                  ? 'bg-green-100 text-green-800'
                  : caixaStatus.fechamento.diferenca > 0
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {caixaStatus.fechamento.statusDiferenca === 'ok' 
                  ? 'CAIXA BATEU'
                  : caixaStatus.fechamento.diferenca > 0
                  ? 'SOBRA'
                  : 'FALTA'}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Valor Esperado</div>
                <div className="text-2xl font-bold text-gray-800">
                  {formatarMoeda(caixaStatus.fechamento.valorEsperado)}
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Valor Encontrado</div>
                <div className="text-2xl font-bold text-gray-800">
                  {formatarMoeda(caixaStatus.fechamento.valorFinal)}
                </div>
              </div>
              
              <div className={`p-4 rounded-lg ${
                caixaStatus.fechamento.diferenca === 0
                  ? 'bg-green-50'
                  : caixaStatus.fechamento.diferenca > 0
                  ? 'bg-blue-50'
                  : 'bg-red-50'
              }`}>
                <div className="text-sm text-gray-600 mb-1">Diferença</div>
                <div className={`text-2xl font-bold ${
                  caixaStatus.fechamento.diferenca === 0
                    ? 'text-green-600'
                    : caixaStatus.fechamento.diferenca > 0
                    ? 'text-blue-600'
                    : 'text-red-600'
                }`}>
                  {caixaStatus.fechamento.diferenca >= 0 ? '+' : ''}
                  {formatarMoeda(caixaStatus.fechamento.diferenca)}
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              <p>Fechado em: {formatarData(caixaStatus.fechamento.data)} por {caixaStatus.fechamento.usuario}</p>
            </div>
          </div>
        )}

        {/* Avisos Importantes */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-6">
          <div className="flex items-start">
            <AlertTriangle className="h-6 w-6 text-orange-500 mr-3 mt-1" />
            <div>
              <h4 className="font-bold text-gray-800 mb-2">Importante</h4>
              <ul className="text-gray-700 space-y-1">
                <li>• O caixa deve ser aberto todas as manhãs antes do início das operações</li>
                <li>• Todas as movimentações são registradas automaticamente</li>
                <li>• O fechamento do caixa gera um relatório completo</li>
                <li>• Somente usuários autorizados podem abrir/fechar o caixa</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}