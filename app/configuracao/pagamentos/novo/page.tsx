// app/configuracao/pagamentos/novo/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CreditCard, 
  ArrowLeft,
  Save,
  X,
  DollarSign,
  Smartphone,
  Wallet,
  Percent
} from 'lucide-react';

const tiposPagamento = [
  { id: 'dinheiro', nome: 'Dinheiro', icone: '💵', cor: '#10B981' },
  { id: 'cartao', nome: 'Cartão', icone: '💳', cor: '#3B82F6' },
  { id: 'pix', nome: 'PIX', icone: '📱', cor: '#32CD32' },
  { id: 'outros', nome: 'Outros', icone: '🔄', cor: '#8B5CF6' },
  { id: 'personalizado', nome: 'Personalizado', icone: '⚙️', cor: '#6366F1' },
];

const iconesDisponiveis = [
  '💳', '💵', '💰', '💎', '🏦', '📱', '💻', '🏪', '🛒', '🛍️',
  '💸', '🧾', '📄', '🔖', '🏷️', '📋', '📊', '📈', '💲', '💱',
  '🔵', '🟢', '🟡', '🟠', '🔴', '🟣', '⚫', '⚪', '🟤', '❇️',
  '✅', '✔️', '➕', '➖', '✖️', '➗', '🔄', '⏺️', '▶️', '⏸️',
];

const coresDisponiveis = [
  '#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6',
  '#6366F1', '#EC4899', '#14B8A6', '#84CC16', '#F97316',
];

export default function NovoMeioPagamentoPage() {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    tipo: 'personalizado',
    taxa: 0,
    ativo: true,
    permiteTroco: false,
    permiteDividir: true,
    icone: '💳',
    cor: '#3B82F6',
    ordem: 99,
    configs: {
      chavePix: '',
      banco: '',
      agencia: '',
      conta: '',
      bandeiras: [] as string[],
    }
  });

  const [erros, setErros] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('configs.')) {
      const configField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        configs: {
          ...prev.configs,
          [configField]: type === 'number' ? parseFloat(value) : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) : 
                type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                value
      }));
    }
    
    // Limpar erro do campo
    if (erros[name]) {
      setErros(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleTipoChange = (tipo: string) => {
    const tipoInfo = tiposPagamento.find(t => t.id === tipo);
    setFormData(prev => ({
      ...prev,
      tipo,
      icone: tipoInfo?.icone || '💳',
      cor: tipoInfo?.cor || '#3B82F6',
      ...(tipo === 'dinheiro' && { permiteTroco: true }),
      ...(tipo === 'pix' && { 
        permiteTroco: false,
        permiteDividir: false 
      }),
    }));
  };

  const validarForm = () => {
    const novosErros: Record<string, string> = {};
    
    if (!formData.nome.trim()) {
      novosErros.nome = 'Nome é obrigatório';
    }
    
    if (formData.taxa < 0 || formData.taxa > 100) {
      novosErros.taxa = 'Taxa deve ser entre 0% e 100%';
    }
    
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarForm()) return;
    
    setSalvando(true);
    
    try {
      const response = await fetch('/api/meios-pagamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Meio de pagamento criado com sucesso!');
        router.push('/configuracao/pagamentos');
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao criar meio de pagamento:', error);
      alert('Erro ao criar meio de pagamento');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center">
            <CreditCard className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Novo Meio de Pagamento</h1>
              <p className="text-gray-600">Configure uma nova forma de pagamento</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/configuracao/pagamentos')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <X className="h-4 w-4 inline mr-2" />
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={salvando}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {salvando ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 inline mr-2" />
                Salvar
              </>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações Básicas</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome *
              </label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  erros.nome ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: Cartão de Crédito, PIX, etc."
              />
              {erros.nome && (
                <p className="mt-1 text-sm text-red-600">{erros.nome}</p>
              )}
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo *
              </label>
              <select
                name="tipo"
                value={formData.tipo}
                onChange={(e) => handleTipoChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {tiposPagamento.map(tipo => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Descrição */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição (opcional)
              </label>
              <textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Pagamento via cartão de crédito parcelado..."
              />
            </div>

            {/* Taxa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Taxa (%)
              </label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="number"
                  name="taxa"
                  value={formData.taxa}
                  onChange={handleChange}
                  min="0"
                  max="100"
                  step="0.01"
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    erros.taxa ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {erros.taxa && (
                <p className="mt-1 text-sm text-red-600">{erros.taxa}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Taxa percentual aplicada sobre o valor total
              </p>
            </div>

            {/* Ordem */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ordem de Exibição
              </label>
              <input
                type="number"
                name="ordem"
                value={formData.ordem}
                onChange={handleChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Número menor aparece primeiro
              </p>
            </div>
          </div>
        </div>

        {/* Configurações Visuais */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Configurações Visuais</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ícone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ícone
              </label>
              <div className="grid grid-cols-10 gap-2 mb-4">
                {iconesDisponiveis.slice(0, 30).map(icone => (
                  <button
                    key={icone}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, icone }))}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl hover:bg-gray-100 ${
                      formData.icone === icone ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-gray-50'
                    }`}
                  >
                    {icone}
                  </button>
                ))}
              </div>
              <input
                type="text"
                name="icone"
                value={formData.icone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={2}
              />
            </div>

            {/* Cor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cor
              </label>
              <div className="grid grid-cols-10 gap-2 mb-4">
                {coresDisponiveis.map(cor => (
                  <button
                    key={cor}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, cor }))}
                    className={`w-8 h-8 rounded-full border ${
                      formData.cor === cor ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                    }`}
                    style={{ backgroundColor: cor }}
                    title={cor}
                  />
                ))}
              </div>
              <input
                type="color"
                name="cor"
                value={formData.cor}
                onChange={handleChange}
                className="w-full h-10 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Opções */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Opções</h2>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="ativo"
                name="ativo"
                checked={formData.ativo}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="ativo" className="ml-2 text-sm text-gray-700">
                Ativo (visível para uso nas comandas)
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="permiteTroco"
                name="permiteTroco"
                checked={formData.permiteTroco}
                onChange={handleCheckboxChange}
                disabled={formData.tipo === 'pix'}
                className={`h-4 w-4 text-blue-600 rounded focus:ring-blue-500 ${
                  formData.tipo === 'pix' ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              />
              <label htmlFor="permiteTroco" className="ml-2 text-sm text-gray-700">
                Permite troco
                {formData.tipo === 'pix' && (
                  <span className="text-gray-400 ml-1">(não disponível para PIX)</span>
                )}
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="permiteDividir"
                name="permiteDividir"
                checked={formData.permiteDividir}
                onChange={handleCheckboxChange}
                disabled={formData.tipo === 'pix'}
                className={`h-4 w-4 text-blue-600 rounded focus:ring-blue-500 ${
                  formData.tipo === 'pix' ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              />
              <label htmlFor="permiteDividir" className="ml-2 text-sm text-gray-700">
                Permite dividir conta entre clientes
                {formData.tipo === 'pix' && (
                  <span className="text-gray-400 ml-1">(não disponível para PIX)</span>
                )}
              </label>
            </div>
          </div>
        </div>

        {/* Configurações Específicas por Tipo */}
        {formData.tipo === 'pix' && (
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Configurações do PIX
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chave PIX
              </label>
              <input
                type="text"
                name="configs.chavePix"
                value={formData.configs.chavePix}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Chave PIX (CPF, CNPJ, telefone, email ou chave aleatória)"
              />
            </div>
          </div>
        )}

        {formData.tipo === 'cartao' && (
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Configurações do Cartão
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bandeiras Aceitas
              </label>
              <div className="flex flex-wrap gap-2">
                {['Visa', 'Mastercard', 'Elo', 'American Express', 'Hipercard', 'Diners'].map(bandeira => (
                  <label key={bandeira} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.configs.bandeiras.includes(bandeira)}
                      onChange={(e) => {
                        const novasBandeiras = e.target.checked
                          ? [...formData.configs.bandeiras, bandeira]
                          : formData.configs.bandeiras.filter(b => b !== bandeira);
                        setFormData(prev => ({
                          ...prev,
                          configs: { ...prev.configs, bandeiras: novasBandeiras }
                        }));
                      }}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{bandeira}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Botões */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <button
            type="button"
            onClick={() => router.push('/configuracao/pagamentos')}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {salvando ? 'Salvando...' : 'Criar Meio de Pagamento'}
          </button>
        </div>
      </form>
    </div>
  );
}