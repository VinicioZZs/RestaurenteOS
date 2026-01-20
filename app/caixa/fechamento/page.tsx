// app/caixa/fechamento/page.tsx - VERSÃO COM CONTADOR DE NOTAS
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, ArrowLeft, AlertCircle, Calculator, TrendingUp, TrendingDown, CheckCircle, Plus, Minus } from 'lucide-react';
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
  const [modoContagem, setModoContagem] = useState<'manual' | 'contador'>('manual');
  
  // Dados do caixa atual
  const [caixaAtual, setCaixaAtual] = useState<any>(null);
  const [resumoCalculado, setResumoCalculado] = useState<any>(null);

  // Configuração das denominações
  const [denominações, setDenominações] = useState<Denominação[]>([
    { valor: 200, label: 'R$ 200', tipo: 'nota' },
    { valor: 100, label: 'R$ 100', tipo: 'nota' },
    { valor: 50, label: 'R$ 50', tipo: 'nota' },
    { valor: 20, label: 'R$ 20', tipo: 'nota' },
    { valor: 10, label: 'R$ 10', tipo: 'nota' },
    { valor: 5, label: 'R$ 5', tipo: 'nota' },
    { valor: 2, label: 'R$ 2', tipo: 'moeda' },
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

  useEffect(() => {
    carregarCaixaAtual();
    const user = getCurrentUser();
    setUsuario(user?.name || 'Operador');
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
      
      if (data.success && data.data.status === 'aberto') {
        setCaixaAtual(data.data);
        calcularResumo(data.data);
      } else {
        setErro('Não há caixa aberto para fechar');
      }
    } catch (error) {
      console.error('Erro ao carregar caixa:', error);
      setErro('Erro ao carregar dados do caixa');
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
    setContador(prev => ({
      ...prev,
      [valor]: (prev[valor] || 0) + 1
    }));
  };

  const decrementarContador = (valor: number) => {
    if (contador[valor] > 0) {
      setContador(prev => ({
        ...prev,
        [valor]: prev[valor] - 1
      }));
    }
  };

  const resetarContador = () => {
    const reset = denominações.reduce((acc, den) => ({ ...acc, [den.valor]: 0 }), {});
    setContador(reset);
  };

  const handleFecharCaixa = async () => {
    if (!valorFinal || parseFloat(valorFinal) < 0) {
      setErro('Informe um valor final válido');
      return;
    }

    if (!confirm('Tem certeza que deseja fechar o caixa? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setCarregando(true);
      setErro('');

      const response = await fetch('/api/caixa/fechar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valorFinal: parseFloat(valorFinal),
          usuario,
          observacao,
          contagemNotas: modoContagem === 'contador' ? contador : null
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Caixa fechado com sucesso!\n\nDiferença: R$ ${data.data.resumo?.diferenca.toFixed(2)}\nStatus: ${data.data.resumo?.statusDiferenca === 'ok' ? '✅ Bateu' : data.data.resumo?.statusDiferenca === 'sobra' ? '💰 Sobra' : '⚠️ Faltou'}`);
        router.push('/dashboard');
      } else {
        setErro(data.error || 'Erro ao fechar caixa');
      }
    } catch (error) {
      setErro('Erro de conexão com o servidor');
      console.error(error);
    } finally {
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

  if (erro && !caixaAtual) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center">
              <div className="inline-block p-4 bg-red-100 rounded-full mb-4">
                <AlertCircle className="h-12 w-12 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-3">Erro</h2>
              <p className="text-gray-600 mb-6">{erro}</p>
              <button
                onClick={() => router.push('/caixa')}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Voltar ao Caixa
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
              onClick={() => setModoContagem('manual')}
              className={`flex-1 py-3 rounded-xl font-medium ${modoContagem === 'manual' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Digitar Valor
            </button>
            <button
              onClick={() => setModoContagem('contador')}
              className={`flex-1 py-3 rounded-xl font-medium ${modoContagem === 'contador' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Contar Notas/Moedas
            </button>
          </div>
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
                      onChange={(e) => setValorFinal(e.target.value)}
                      className="w-full pl-14 pr-4 py-4 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-2xl font-bold"
                      placeholder="0,00"
                      autoFocus
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
                    <div key={den.valor} className="bg-gray-50 rounded-lg p-4 border">
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
    className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors"
    type="button"
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
        const novaQuantidade = parseInt(e.target.value) || 0;
        setContador(prev => ({
          ...prev,
          [den.valor]: Math.max(0, novaQuantidade) // Não permite negativo
        }));
      }}
      className="w-16 text-center text-2xl font-bold text-gray-800 bg-transparent border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none"
    />
    <div className="text-sm text-gray-500 mt-1">
      {formatarMoeda(den.valor * (contador[den.valor] || 0))}
    </div>
  </div>
  
  <button
    onClick={() => incrementarContador(den.valor)}
    className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center hover:bg-green-200 transition-colors"
    type="button"
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
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                    >
                      Zerar Contador
                    </button>
                    <button
                      onClick={() => setModoContagem('manual')}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
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
                  onChange={(e) => setObservacao(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Observações sobre o fechamento..."
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
            onClick={() => router.push('/caixa')}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleFecharCaixa}
            disabled={carregando || !valorFinal}
            className="flex-1 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}