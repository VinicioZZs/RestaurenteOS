// app/caixa/fechamento/page.tsx - VERSÃO COM MODAIS DE CONFIRMAÇÃO
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Wallet, ArrowLeft, AlertCircle, Calculator, Lock, 
  TrendingUp, TrendingDown, CheckCircle, Plus, Minus,
  AlertTriangle, XCircle
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';

// Tipos das notas/moedas
interface Denominação {
  valor: number;
  label: string;
  tipo: 'nota' | 'moeda';
}

export default function FechamentoCaixaPage() {
  const router = useRouter();
  const [valorFinal, setValorFinal] = useState('');
  const [observacao, setObservacao] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [erro, setErro] = useState('');
  const [usuario, setUsuario] = useState('');
  const [temPermissao, setTemPermissao] = useState(false);
  const [modoContagem, setModoContagem] = useState<'manual' | 'contador'>('manual');
  
  // Dados do caixa atual
  const [caixaAtual, setCaixaAtual] = useState<any>(null);
  const [resumoCalculado, setResumoCalculado] = useState<any>(null);

  // Modais
  const [modalConfirmacao, setModalConfirmacao] = useState<{
    aberto: boolean;
    valorFinal: number;
    observacao: string;
  }>({
    aberto: false,
    valorFinal: 0,
    observacao: ''
  });

  const [resultadoFechamento, setResultadoFechamento] = useState<{
    aberto: boolean;
    sucesso: boolean;
    diferenca: number;
    status: string;
    mensagem: string;
  }>({
    aberto: false,
    sucesso: false,
    diferenca: 0,
    status: '',
    mensagem: ''
  });

  // Configuração das denominações
  const [denominações, setDenominações] = useState<Denominação[]>([
    { valor: 200, label: 'R$ 200', tipo: 'nota' },
    { valor: 100, label: 'R$ 100', tipo: 'nota' },
    { valor: 50, label: 'R$ 50', tipo: 'nota' },
    { valor: 20, label: 'R$ 20', tipo: 'nota' },
    { valor: 10, label: 'R$ 10', tipo: 'nota' },
    { valor: 5, label: 'R$ 5', tipo: 'nota' },
    { valor: 2, label: 'R$ 2', tipo: 'nota' },
    { valor: 1, label: 'R$ 1', tipo: 'moeda' },
    { valor: 0.5, label: 'R$ 0,50', tipo: 'moeda' },
    { valor: 0.25, label: 'R$ 0,25', tipo: 'moeda' },
    { valor: 0.10, label: 'R$ 0,10', tipo: 'moeda' },
    { valor: 0.05, label: 'R$ 0,05', tipo: 'moeda' },
  ]);

  // Contador para cada denominação
  const [contador, setContador] = useState<Record<number, number>>(
    denominações.reduce((acc, den) => ({ ...acc, [den.valor]: 0 }), {})
  );

  const getUserName = (user: any): string => {
  if (!user) return 'Operador';
  
  // Tenta várias fontes de nome em ordem de prioridade
  const nameSources = [
    user.nome,              // Português
    user.name,              // Inglês
    user.username,          // username
    user.displayName,       // displayName
    user.email?.split('@')[0], // Parte do email antes do @
    user.email,             // Email completo
  ];
  
  // Encontra o primeiro nome válido
  const validName = nameSources.find(name => 
    name && typeof name === 'string' && name.trim() !== ''
  );
  
  // Formata o nome (primeira letra maiúscula)
  if (validName) {
    const trimmed = validName.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }
  
  return 'Operador';
};

  useEffect(() => {
  carregarCaixaAtual();
  const user = getCurrentUser();
  
   // Obter nome do usuário
  const userName = getUserName(user);
  setUsuario(userName);
  console.log('🔍 Nome do usuário:', userName);

  if (user) {
    // Verificar se existe a propriedade diretamente (ignorando TypeScript)
    const userAny = user as any;
    
    // OBTER NOME CORRETAMENTE (nome em português OU name em inglês)
    const userName = userAny?.nome || userAny?.name || 'Operador';
    setUsuario(userName);
    
    console.log('🔍 Nome do usuário encontrado:', userName);
    console.log('🔍 Usuário completo:', userAny);
  } else {
    setUsuario('Operador');
  }
  
  // VERIFICAÇÃO QUE FUNCIONA COM AMBAS AS ESTRUTURAS
  // Primeiro converte para any para acessar propriedades dinamicamente
  const userAny = user as any;
  
  // Tenta obter permissões de ambas as propriedades
  const permissoes = userAny?.permissoes || userAny?.permissions;
  console.log('Permissões encontradas:', permissoes);
  
  if (permissoes?.canProcessPayment) {
    console.log('✅ TEM permissão canProcessPayment!');
    setTemPermissao(true);
  } else {
    console.log('❌ NÃO TEM permissão canProcessPayment');
    setErro('Você não tem permissão para fechar o caixa. Apenas usuários com permissão podem realizar esta ação.');
    setCarregandoDados(false);
  }

  const handleBeforeUnload = () => {
    // Limpa algo se necessário
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}, []);


  // Calcular total automaticamente
  useEffect(() => {
    if (modoContagem === 'contador') {
      const total = Object.entries(contador).reduce(
        (sum, [valor, quantidade]) => sum + (parseFloat(valor) * quantidade),
        0
      );
      setValorFinal(total.toFixed(2));
    }
  }, [contador, modoContagem]);

  const carregarCaixaAtual = async () => {
    try {
      setCarregandoDados(true);
      const response = await fetch('/api/caixa/status');
      const data = await response.json();
      
      console.log('📊 Resposta da API /status:', data);
      
      if (data.success && data.data && data.data.status === 'aberto') {
        setCaixaAtual(data.data);
        calcularResumo(data.data);
        setErro(''); // Limpa qualquer erro anterior
      } else {
        setErro(data.error || 'Não há caixa aberto para fechar');
        setCaixaAtual(null);
      }
    } catch (error) {
      console.error('Erro ao carregar caixa:', error);
      setErro('Erro ao carregar dados do caixa');
      setCaixaAtual(null);
    } finally {
      setCarregandoDados(false);
    }
  };

  const calcularResumo = (caixa: any) => {
    const valorInicial = caixa.abertura.valorInicial || 0;
    const totalVendas = caixa.totalVendas || 0;
    const totalSaidas = caixa.totalSaidas || 0;
    
    const valorEsperado = valorInicial + totalVendas - totalSaidas;
    setResumoCalculado({
      valorInicial,
      totalVendas,
      totalSaidas,
      valorEsperado
    });
    
    // Sugerir valor final (igual ao esperado)
    if (modoContagem === 'manual') {
      setValorFinal(valorEsperado.toFixed(2));
    }
  };

  // Funções para o contador
  const incrementarContador = (valor: number) => {
    if (!temPermissao) return;
    setContador(prev => ({
      ...prev,
      [valor]: (prev[valor] || 0) + 1
    }));
  };

  const decrementarContador = (valor: number) => {
    if (!temPermissao || contador[valor] <= 0) return;
    setContador(prev => ({
      ...prev,
      [valor]: prev[valor] - 1
    }));
  };

  const resetarContador = () => {
    if (!temPermissao) return;
    const reset = denominações.reduce((acc, den) => ({ ...acc, [den.valor]: 0 }), {});
    setContador(reset);
  };

  // Funções para os modais
  const handleAbrirModalConfirmacao = () => {
    if (!temPermissao) {
      setErro('Você não tem permissão para fechar o caixa.');
      return;
    }

    if (!valorFinal || parseFloat(valorFinal) < 0) {
      setErro('Informe um valor final válido');
      return;
    }

    // Abre o modal em vez do confirm
    setModalConfirmacao({
      aberto: true,
      valorFinal: parseFloat(valorFinal),
      observacao: observacao
    });
  };

  const handleConfirmarFechamento = async () => {
    try {
      setCarregando(true);
      setErro('');
      setModalConfirmacao({ aberto: false, valorFinal: 0, observacao: '' });

      console.log('📤 Enviando fechamento:', { 
        valorFinal: modalConfirmacao.valorFinal, 
        usuario 
      });

      const response = await fetch('/api/caixa/fechar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valorFinal: modalConfirmacao.valorFinal,
          usuario,
          observacao: modalConfirmacao.observacao,
          contagemNotas: modoContagem === 'contador' ? contador : null
        }),
      });

      const data = await response.json();
      console.log('📥 Resposta do fechamento:', data);

      if (data.success) {
        setResultadoFechamento({
          aberto: true,
          sucesso: true,
          diferenca: data.data.resumo?.diferenca || 0,
          status: data.data.resumo?.statusDiferenca || 'ok',
          mensagem: 'Caixa fechado com sucesso!'
        });
      } else {
        setResultadoFechamento({
          aberto: true,
          sucesso: false,
          diferenca: 0,
          status: 'erro',
          mensagem: data.error || 'Erro ao fechar caixa'
        });
        setCarregando(false);
      }
    } catch (error) {
      console.error('❌ Erro no fechamento:', error);
      setResultadoFechamento({
        aberto: true,
        sucesso: false,
        diferenca: 0,
        status: 'erro',
        mensagem: 'Erro de conexão com o servidor'
      });
      setCarregando(false);
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor || 0);
  };

  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR');
  };

  // Calcular subtotais por tipo
  const subtotalNotas = denominações
    .filter(d => d.tipo === 'nota')
    .reduce((sum, den) => sum + (den.valor * (contador[den.valor] || 0)), 0);

  const subtotalMoedas = denominações
    .filter(d => d.tipo === 'moeda')
    .reduce((sum, den) => sum + (den.valor * (contador[den.valor] || 0)), 0);

  if (carregandoDados) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados do caixa...</p>
        </div>
      </div>
    );
  }

  // Tela de erro (sem permissão ou sem caixa aberto)
  if (erro && (!caixaAtual || !temPermissao)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center">
              <div className="inline-block p-4 bg-red-100 rounded-full mb-4">
                {!temPermissao ? <Lock className="h-12 w-12 text-red-600" /> : <AlertCircle className="h-12 w-12 text-red-600" />}
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                {!temPermissao ? 'Acesso Negado' : 'Erro'}
              </h2>
              <p className="text-gray-600 mb-6">{erro}</p>
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Voltar ao Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Voltar
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-full">
              <Wallet className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Fechamento de Caixa</h1>
              <p className="text-gray-600">
                Aberto em: {caixaAtual?.abertura ? formatarData(caixaAtual.abertura.data) : '---'}
              </p>
            </div>
          </div>
        </div>

        {/* Modo de entrada */}
        <div className="mb-6">
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => temPermissao && setModoContagem('manual')}
              className={`flex-1 py-3 rounded-xl font-medium ${!temPermissao 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : modoContagem === 'manual' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              disabled={!temPermissao}
            >
              Digitar Valor
            </button>
            <button
              onClick={() => temPermissao && setModoContagem('contador')}
              className={`flex-1 py-3 rounded-xl font-medium ${!temPermissao 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : modoContagem === 'contador' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              disabled={!temPermissao}
            >
              Contar Notas/Moedas
            </button>
          </div>
          
          {!temPermissao && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-center">
                <Lock className="h-5 w-5 text-yellow-600 mr-3" />
                <span className="text-yellow-800">
                  <strong>Apenas usuários com permissão "canProcessPayment" podem fechar o caixa.</strong>
                  Entre em contato com o administrador do sistema.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Grid de informações */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Coluna 1: Resumo do Caixa */}
          <div className="bg-white rounded-xl p-6 shadow border">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
              <Calculator className="h-5 w-5 mr-2 text-blue-600" />
              Resumo do Caixa
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Valor inicial:</span>
                <span className="font-bold text-gray-800">
                  {formatarMoeda(resumoCalculado?.valorInicial || 0)}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-gray-700">Total de vendas:</span>
                <span className="font-bold text-green-600">
                  + {formatarMoeda(resumoCalculado?.totalVendas || 0)}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                <span className="text-gray-700">Saídas/retiradas:</span>
                <span className="font-bold text-red-600">
                  - {formatarMoeda(resumoCalculado?.totalSaidas || 0)}
                </span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-gray-700 font-medium">Valor esperado:</span>
                <span className="text-xl font-bold text-blue-600">
                  {formatarMoeda(resumoCalculado?.valorEsperado || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Coluna 2: Contador ou Input Manual */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow border">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {modoContagem === 'manual' ? 'Valor Final' : 'Contagem de Notas/Moedas'}
            </h3>
            
            {erro && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  {erro}
                </div>
              </div>
            )}
            
            {modoContagem === 'manual' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor encontrado em caixa *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-xl">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={valorFinal}
                      onChange={(e) => temPermissao && setValorFinal(e.target.value)}
                      className={`w-full pl-14 pr-4 py-4 border rounded-xl focus:ring-2 text-2xl font-bold ${
                        !temPermissao 
                          ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' 
                          : 'bg-gray-50 border-gray-300 focus:ring-blue-500'
                      }`}
                      placeholder="0,00"
                      autoFocus={temPermissao}
                      disabled={!temPermissao}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Valor físico contado no caixa
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Contador de notas/moedas */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {denominações.map((den) => (
                    <div key={den.valor} className={`bg-gray-50 rounded-lg p-4 border ${
                      !temPermissao ? 'opacity-50' : ''
                    }`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-800">{den.label}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          den.tipo === 'nota' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {den.tipo === 'nota' ? 'Nota' : 'Moeda'}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => decrementarContador(den.valor)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                            !temPermissao 
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                              : 'bg-red-100 text-red-600 hover:bg-red-200'
                          }`}
                          type="button"
                          disabled={!temPermissao}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        
                        <div className="text-center flex flex-col items-center">
                          {/* Input para digitar quantidade */}
                          <input
                            type="number"
                            min="0"
                            value={contador[den.valor] || 0}
                            onChange={(e) => {
                              if (!temPermissao) return;
                              const novaQuantidade = parseInt(e.target.value) || 0;
                              setContador(prev => ({
                                ...prev,
                                [den.valor]: Math.max(0, novaQuantidade) // Não permite negativo
                              }));
                            }}
                            className={`w-16 text-center text-2xl font-bold border-b-2 focus:outline-none ${
                              !temPermissao
                                ? 'text-gray-400 bg-transparent border-gray-300 cursor-not-allowed'
                                : 'text-gray-800 bg-transparent border-gray-300 focus:border-blue-500'
                            }`}
                            disabled={!temPermissao}
                          />
                          <div className="text-sm text-gray-500 mt-1">
                            {formatarMoeda(den.valor * (contador[den.valor] || 0))}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => incrementarContador(den.valor)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                            !temPermissao 
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                              : 'bg-green-100 text-green-600 hover:bg-green-200'
                          }`}
                          type="button"
                          disabled={!temPermissao}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Resumo da contagem */}
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-white p-4 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Total em Notas</div>
                      <div className="text-xl font-bold text-green-600">
                        {formatarMoeda(subtotalNotas)}
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Total em Moedas</div>
                      <div className="text-xl font-bold text-yellow-600">
                        {formatarMoeda(subtotalMoedas)}
                      </div>
                    </div>
                    
                    <div className="bg-blue-100 p-4 rounded-lg">
                      <div className="text-sm text-gray-700 mb-1">Valor Total</div>
                      <div className="text-2xl font-bold text-blue-700">
                        {formatarMoeda(parseFloat(valorFinal) || 0)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={resetarContador}
                      className={`px-4 py-2 rounded-lg text-sm ${
                        !temPermissao
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                      disabled={!temPermissao}
                    >
                      Zerar Contador
                    </button>
                    <button
                      onClick={() => temPermissao && setModoContagem('manual')}
                      className={`px-4 py-2 rounded-lg text-sm ${
                        !temPermissao
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                      disabled={!temPermissao}
                    >
                      Digitar Valor Manualmente
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Campos comuns */}
            <div className="space-y-4 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  value={observacao}
                  onChange={(e) => temPermissao && setObservacao(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg ${
                    !temPermissao
                      ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                      : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
                  }`}
                  rows={3}
                  placeholder="Observações sobre o fechamento..."
                  disabled={!temPermissao}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operador Responsável
                </label>
                <input
                  type="text"
                  value={usuario}
                  readOnly
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Comparação */}
        {resumoCalculado && (
          <div className="bg-white rounded-xl p-6 shadow border mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Comparação</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm text-gray-600 mb-1">Valor Esperado</div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatarMoeda(resumoCalculado.valorEsperado)}
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Valor Informado</div>
                <div className="text-2xl font-bold text-gray-800">
                  {valorFinal ? formatarMoeda(parseFloat(valorFinal)) : 'R$ 0,00'}
                </div>
              </div>
              
              <div className={`p-4 rounded-lg border ${
                !valorFinal ? 'bg-gray-50 border-gray-200' :
                Math.abs(parseFloat(valorFinal) - resumoCalculado.valorEsperado) < 0.01 ? 
                  'bg-green-50 border-green-200' :
                parseFloat(valorFinal) > resumoCalculado.valorEsperado ?
                  'bg-blue-50 border-blue-200' :
                  'bg-red-50 border-red-200'
              }`}>
                <div className="text-sm text-gray-600 mb-1">Diferença</div>
                <div className={`text-2xl font-bold ${
                  !valorFinal ? 'text-gray-800' :
                  Math.abs(parseFloat(valorFinal) - resumoCalculado.valorEsperado) < 0.01 ? 
                    'text-green-600' :
                  parseFloat(valorFinal) > resumoCalculado.valorEsperado ?
                    'text-blue-600' :
                    'text-red-600'
                }`}>
                  {valorFinal ? (
                    <>
                      {parseFloat(valorFinal) >= resumoCalculado.valorEsperado ? '+' : '-'}
                      {formatarMoeda(Math.abs(parseFloat(valorFinal) - resumoCalculado.valorEsperado))}
                    </>
                  ) : 'R$ 0,00'}
                </div>
                <div className="text-sm mt-1">
                  {!valorFinal ? '---' :
                   Math.abs(parseFloat(valorFinal) - resumoCalculado.valorEsperado) < 0.01 ? 
                     <span className="text-green-600">✅ Caixa bateu</span> :
                   parseFloat(valorFinal) > resumoCalculado.valorEsperado ?
                     <span className="text-blue-600">💰 Sobra no caixa</span> :
                     <span className="text-red-600">⚠️ Faltou no caixa</span>
                  }
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleAbrirModalConfirmacao}
            disabled={carregando || !valorFinal || !temPermissao}
            className={`flex-1 py-3 text-white rounded-xl font-medium ${
              !temPermissao
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {carregando ? 'Fechando Caixa...' : 'Confirmar Fechamento'}
          </button>
        </div>

        {/* Avisos */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-800">
                <strong>Atenção:</strong> Após o fechamento, o caixa será bloqueado e não poderá receber novas vendas até ser reaberto.
                Certifique-se de contar o dinheiro cuidadosamente antes de confirmar.
              </p>
              {!temPermissao && (
                <p className="text-sm text-red-600 mt-2">
                  <strong>⚠️ Permissão necessária:</strong> Apenas usuários com a permissão podem fechar o caixa.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação */}
      {modalConfirmacao.aberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-start mb-6">
              <div className="bg-red-100 p-3 rounded-full mr-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">Confirmar Fechamento do Caixa</h3>
                <p className="text-gray-600 mt-1">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            
            {/* Resumo dos Valores */}
            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                  <Calculator className="h-5 w-5 mr-2 text-blue-600" />
                  Resumo do Fechamento
                </h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor Inicial:</span>
                    <span className="font-bold">{formatarMoeda(resumoCalculado?.valorInicial || 0)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Vendas:</span>
                    <span className="font-bold text-green-600">+ {formatarMoeda(resumoCalculado?.totalVendas || 0)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Saídas:</span>
                    <span className="font-bold text-red-600">- {formatarMoeda(resumoCalculado?.totalSaidas || 0)}</span>
                  </div>
                  
                  <div className="flex justify-between pt-2 border-t border-blue-200">
                    <span className="text-gray-700 font-bold">Valor Esperado:</span>
                    <span className="text-blue-600 font-bold">{formatarMoeda(resumoCalculado?.valorEsperado || 0)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-bold">Valor Informado:</span>
                    <span className="text-gray-800 font-bold">{formatarMoeda(modalConfirmacao.valorFinal)}</span>
                  </div>
                  
                  <div className={`flex justify-between pt-2 border-t ${
                    !modalConfirmacao.valorFinal ? 'border-gray-200' :
                    Math.abs(modalConfirmacao.valorFinal - (resumoCalculado?.valorEsperado || 0)) < 0.01 ? 
                      'border-green-200' :
                    modalConfirmacao.valorFinal > (resumoCalculado?.valorEsperado || 0) ?
                      'border-blue-200' :
                      'border-red-200'
                  }`}>
                    <span className="text-gray-700 font-bold">Diferença:</span>
                    <span className={`font-bold ${
                      !modalConfirmacao.valorFinal ? 'text-gray-800' :
                      Math.abs(modalConfirmacao.valorFinal - (resumoCalculado?.valorEsperado || 0)) < 0.01 ? 
                        'text-green-600' :
                      modalConfirmacao.valorFinal > (resumoCalculado?.valorEsperado || 0) ?
                        'text-blue-600' :
                        'text-red-600'
                    }`}>
                      {modalConfirmacao.valorFinal ? (
                        <>
                          {modalConfirmacao.valorFinal >= (resumoCalculado?.valorEsperado || 0) ? '+' : '-'}
                          {formatarMoeda(Math.abs(modalConfirmacao.valorFinal - (resumoCalculado?.valorEsperado || 0)))}
                        </>
                      ) : 'R$ 0,00'}
                    </span>
                  </div>
                  
                  <div className="text-sm mt-1">
                    {!modalConfirmacao.valorFinal ? '---' :
                     Math.abs(modalConfirmacao.valorFinal - (resumoCalculado?.valorEsperado || 0)) < 0.01 ? 
                       <span className="text-green-600">✅ Caixa bateu</span> :
                     modalConfirmacao.valorFinal > (resumoCalculado?.valorEsperado || 0) ?
                       <span className="text-blue-600">💰 Sobra no caixa</span> :
                       <span className="text-red-600">⚠️ Faltou no caixa</span>
                    }
                  </div>
                </div>
              </div>


              <div className="bg-gray-50 p-3 rounded-lg mb-4">
            <p className="text-sm text-gray-600 mb-1">Operador responsável:</p>
            <p className="font-medium text-gray-800">{usuario}</p>
            <p className="text-xs text-gray-500 mt-1">
              Aberto por: {caixaAtual?.abertura?.usuario || '---'}
            </p>
          </div>
              
              {modalConfirmacao.observacao && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Observação:</p>
                  <p className="text-gray-800">{modalConfirmacao.observacao}</p>
                </div>
              )}
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
                  <span className="text-sm text-yellow-800">
                    <strong>Atenção:</strong> Após confirmar, o caixa será bloqueado e não poderá receber novas vendas.
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setModalConfirmacao({ aberto: false, valorFinal: 0, observacao: '' })}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarFechamento}
                className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center justify-center"
              >
                <Lock className="h-5 w-5 mr-2" />
                Confirmar Fechamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Resultado */}
      {resultadoFechamento.aberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl">
            <div className={`p-4 rounded-full mb-6 mx-auto w-20 h-20 flex items-center justify-center ${
              resultadoFechamento.sucesso
                ? resultadoFechamento.status === 'ok' ? 'bg-green-100' :
                  resultadoFechamento.status === 'sobra' ? 'bg-blue-100' :
                  'bg-yellow-100'
                : 'bg-red-100'
            }`}>
              {resultadoFechamento.sucesso ? (
                resultadoFechamento.status === 'ok' ? (
                  <CheckCircle className="h-10 w-10 text-green-600" />
                ) : resultadoFechamento.status === 'sobra' ? (
                  <span className="text-3xl">💰</span>
                ) : (
                  <AlertTriangle className="h-10 w-10 text-yellow-600" />
                )
              ) : (
                <XCircle className="h-10 w-10 text-red-600" />
              )}
            </div>
            
            <h3 className={`text-xl font-bold text-center mb-2 ${
              resultadoFechamento.sucesso
                ? resultadoFechamento.status === 'ok' ? 'text-green-800' :
                  resultadoFechamento.status === 'sobra' ? 'text-blue-800' :
                  'text-yellow-800'
                : 'text-red-800'
            }`}>
              {resultadoFechamento.sucesso ? 'Sucesso!' : 'Erro'}
            </h3>
            
            <p className="text-gray-600 text-center mb-4">
              {resultadoFechamento.mensagem}
            </p>
            
            {resultadoFechamento.sucesso && resultadoFechamento.diferenca !== undefined && (
              <div className={`p-4 rounded-lg mb-4 text-center ${
                resultadoFechamento.status === 'ok' ? 'bg-green-50 border border-green-200' :
                resultadoFechamento.status === 'sobra' ? 'bg-blue-50 border border-blue-200' :
                'bg-yellow-50 border border-yellow-200'
              }`}>
                <p className="text-sm text-gray-600 mb-1">Diferença:</p>
                <p className={`text-2xl font-bold ${
                  resultadoFechamento.status === 'ok' ? 'text-green-600' :
                  resultadoFechamento.status === 'sobra' ? 'text-blue-600' :
                  'text-red-600'
                }`}>
                  {resultadoFechamento.diferenca >= 0 ? '+' : ''}{formatarMoeda(resultadoFechamento.diferenca)}
                </p>
                <p className="text-sm mt-1">
                  {resultadoFechamento.status === 'ok' ? '✅ Caixa bateu perfeitamente!' :
                   resultadoFechamento.status === 'sobra' ? '💰 Sobra no caixa' :
                   '⚠️ Faltou no caixa'}
                </p>
              </div>
            )}
            
            <button
              onClick={() => {
                setResultadoFechamento({ aberto: false, sucesso: false, diferenca: 0, status: '', mensagem: '' });
                if (resultadoFechamento.sucesso) {
                  setTimeout(() => {
                    router.push('/dashboard');
                  }, 300);
                }
              }}
              className={`w-full py-3 rounded-lg font-medium ${
                resultadoFechamento.sucesso
                  ? resultadoFechamento.status === 'ok' ? 'bg-green-600 hover:bg-green-700' :
                    resultadoFechamento.status === 'sobra' ? 'bg-blue-600 hover:bg-blue-700' :
                    'bg-yellow-600 hover:bg-yellow-700'
                  : 'bg-red-600 hover:bg-red-700'
              } text-white`}
            >
              {resultadoFechamento.sucesso ? 'Ir para Dashboard' : 'Fechar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}