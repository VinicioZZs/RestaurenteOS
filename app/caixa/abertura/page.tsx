// app/caixa/abertura/page.tsx - VERSÃO CORRIGIDA COM NOME DO USUÁRIO
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, ArrowLeft, AlertCircle, Calculator, Plus, Minus } from 'lucide-react';

// Tipos das notas/moedas
interface Denominação {
  valor: number;
  label: string;
  tipo: 'nota' | 'moeda';
}

export default function AberturaCaixaPage() {
  const router = useRouter();
  const [valorInicial, setValorInicial] = useState('');
  const [observacao, setObservacao] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [usuario, setUsuario] = useState('Operador');
  const [erro, setErro] = useState('');
  const [modoContagem, setModoContagem] = useState<'manual' | 'contador'>('manual');
  
  // Configuração das denominações
  const denominações: Denominação[] = [
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
  ];

  // Contador para cada denominação
  const [contador, setContador] = useState<Record<number, number>>(() => {
    const inicial: Record<number, number> = {};
    denominações.forEach(den => {
      inicial[den.valor] = 0;
    });
    return inicial;
  });

  // Função para obter nome do usuário do localStorage
  const getUsuarioNome = (): string => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return 'Operador';
      
      const user = JSON.parse(userStr);
      // Tenta todas as possibilidades
      return user?.nome || user?.name || user?.username || user?.email?.split('@')[0] || 'Operador';
    } catch (error) {
      console.error('Erro ao obter nome do usuário:', error);
      return 'Operador';
    }
  };

  useEffect(() => {
    // Obter nome do usuário diretamente do localStorage
    const nomeUsuario = getUsuarioNome();
    setUsuario(nomeUsuario);
    console.log('🔍 Nome do usuário obtido (abertura):', nomeUsuario);
  }, []);

  // Calcular total automaticamente
  useEffect(() => {
    if (modoContagem === 'contador') {
      const total = Object.entries(contador).reduce(
        (sum, [valor, quantidade]) => sum + (parseFloat(valor) * quantidade),
        0
      );
      setValorInicial(total.toFixed(2));
    }
  }, [contador, modoContagem]);

  const handleAbrirCaixa = async () => {
    if (!valorInicial || parseFloat(valorInicial) <= 0) {
      setErro('Informe um valor inicial válido');
      return;
    }

    try {
      setCarregando(true);
      setErro('');

      const response = await fetch('/api/caixa/abrir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valorInicial: parseFloat(valorInicial),
          usuario,
          observacao,
          contagemNotas: modoContagem === 'contador' ? contador : null
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/dashboard');
      } else {
        setErro(data.error || 'Erro ao abrir caixa');
      }
    } catch (error) {
      setErro('Erro de conexão');
      console.error(error);
    } finally {
      setCarregando(false);
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
    const reset: Record<number, number> = {};
    denominações.forEach(den => {
      reset[den.valor] = 0;
    });
    setContador(reset);
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  // Calcular subtotais por tipo
  const subtotalNotas = denominações
    .filter(d => d.tipo === 'nota')
    .reduce((sum, den) => sum + (den.valor * (contador[den.valor] || 0)), 0);

  const subtotalMoedas = denominações
    .filter(d => d.tipo === 'moeda')
    .reduce((sum, den) => sum + (den.valor * (contador[den.valor] || 0)), 0);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="flex items-center mb-8">
            <button
              onClick={() => router.back()}
              className="mr-4 text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Abertura de Caixa</h1>
              <p className="text-gray-600">Informe o valor inicial</p>
            </div>
          </div>

          {/* Modo de entrada */}
          <div className="mb-6">
            <div className="flex gap-4 mb-4">
              <button
                onClick={() => setModoContagem('manual')}
                className={`flex-1 py-3 rounded-lg font-medium ${modoContagem === 'manual' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Digitar Valor
              </button>
              <button
                onClick={() => setModoContagem('contador')}
                className={`flex-1 py-3 rounded-lg font-medium ${modoContagem === 'contador' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Contar Notas/Moedas
              </button>
            </div>
          </div>

          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                {erro}
              </div>
            </div>
          )}

          {modoContagem === 'manual' ? (
            // Modo Manual
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor Inicial *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={valorInicial}
                    onChange={(e) => setValorInicial(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0,00"
                    autoFocus
                  />
                </div>
              </div>
            </div>
          ) : (
            // Modo Contador
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <div className="flex items-center mb-4">
                  <Calculator className="h-6 w-6 text-blue-600 mr-3" />
                  <h3 className="text-lg font-bold text-gray-800">Resumo da Contagem</h3>
                </div>
                
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
                      {formatarMoeda(parseFloat(valorInicial) || 0)}
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
          <div className="space-y-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações
              </label>
              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Observações..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operador
              </label>
              <input
                type="text"
                value={usuario}
                readOnly
                className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Nome obtido do seu perfil de usuário
              </p>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Wallet className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800">
                    Após a abertura você será redirecionado para o dashboard.
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    <strong>Operador:</strong> {usuario}
                  </p>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={() => router.back()}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleAbrirCaixa}
                disabled={carregando || !valorInicial}
                className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
              >
                {carregando ? 'Abrindo...' : 'Abrir Caixa'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}