// app/caixa/abertura/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CashRegister, ArrowLeft, AlertCircle } from 'lucide-react';

export default function AberturaCaixaPage() {
  const router = useRouter();
  const [valorInicial, setValorInicial] = useState('');
  const [observacao, setObservacao] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [usuario, setUsuario] = useState('');
  const [erro, setErro] = useState('');

  // Carregar usuário atual
  useEffect(() => {
    const usuarioSalvo = localStorage.getItem('usuario_nome') || 'Operador';
    setUsuario(usuarioSalvo);
  }, []);

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
          observacao
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Caixa aberto com sucesso!');
        router.push('/dashboard');
      } else {
        setErro(data.error || 'Erro ao abrir caixa');
      }
    } catch (error) {
      setErro('Erro de conexão com o servidor');
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
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
              <p className="text-gray-600">Informe o valor inicial do caixa</p>
            </div>
          </div>

          {/* Formulário */}
          <div className="space-y-6">
            {erro && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  {erro}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Inicial em Caixa *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={valorInicial}
                  onChange={(e) => setValorInicial(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xl"
                  placeholder="0,00"
                  autoFocus
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Valor em dinheiro disponível no início do turno
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observações (opcional)
              </label>
              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Ex: Troco inicial, observações importantes..."
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

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <CashRegister className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800">
                    Após a abertura do caixa, você será redirecionado para o dashboard de comandas.
                    Todas as vendas serão registradas automaticamente.
                  </p>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={() => router.back()}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleAbrirCaixa}
                disabled={carregando || !valorInicial}
                className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {carregando ? 'Abrindo Caixa...' : 'Confirmar Abertura'}
              </button>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>Data: {new Date().toLocaleDateString('pt-BR')}</p>
          <p className="mt-1">Certifique-se de contar o dinheiro cuidadosamente</p>
        </div>
      </div>
    </div>
  );
}