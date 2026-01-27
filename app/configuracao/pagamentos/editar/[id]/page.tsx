// app/configuracao/pagamentos/editar/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  CreditCard, 
  ArrowLeft,
  Save,
  X,
  Percent,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  DollarSign,
  Smartphone,
  Wallet
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
  '#8B0000', '#006400', '#4B0082', '#FF8C00', '#20B2AA',
];

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
  configs?: {
    chavePix?: string;
    banco?: string;
    agencia?: string;
    conta?: string;
    bandeiras?: string[];
  };
  criadoEm: string;
  atualizadoEm: string;
}

export default function EditarMeioPagamentoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [formData, setFormData] = useState<MeioPagamento | null>(null);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [sucesso, setSucesso] = useState<string>('');

  // Carregar dados do meio de pagamento
  useEffect(() => {
    carregarMeio();
  }, [id]);

  const carregarMeio = async () => {
    try {
      setCarregando(true);
      const response = await fetch(`/api/meios-pagamento/${id}`);
      const data = await response.json();
      
      if (data.success) {
        setFormData(data.data);
      } else {
        alert('Meio de pagamento não encontrado');
        router.push('/configuracao/pagamentos');
      }
    } catch (error) {
      console.error('Erro ao carregar meio de pagamento:', error);
      alert('Erro ao carregar dados');
      router.push('/configuracao/pagamentos');
    } finally {
      setCarregando(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (!formData) return;
    
    if (name.startsWith('configs.')) {
      const configField = name.split('.')[1];
      setFormData({
        ...formData,
        configs: {
          ...formData.configs,
          [configField]: type === 'number' ? parseFloat(value) : value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'number' ? parseFloat(value) : 
                type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
                value
      });
    }
    
    // Limpar erro do campo
    if (erros[name]) {
      setErros(prev => ({ ...prev, [name]: '' }));
    }
    
    // Limpar mensagem de sucesso
    if (sucesso) setSucesso('');
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    if (!formData) return;
    
    setFormData({
      ...formData,
      [name]: checked
    });
  };

  const handleTipoChange = (tipo: string) => {
    if (!formData) return;
    
    const tipoInfo = tiposPagamento.find(t => t.id === tipo);
    setFormData({
      ...formData,
      tipo: tipo as any,
      icone: tipoInfo?.icone || '💳',
      cor: tipoInfo?.cor || '#3B82F6',
      permiteTroco: tipo === 'dinheiro',
      permiteDividir: tipo !== 'pix',
      configs: {
        ...formData.configs,
        ...(tipo === 'pix' && { chavePix: formData.configs?.chavePix || '' }),
        ...(tipo === 'cartao' && { bandeiras: formData.configs?.bandeiras || [] }),
      }
    });
  };

  const handleBandeiraChange = (bandeira: string, checked: boolean) => {
    if (!formData) return;
    
    const bandeirasAtuais = formData.configs?.bandeiras || [];
    let novasBandeiras: string[];
    
    if (checked) {
      novasBandeiras = [...bandeirasAtuais, bandeira];
    } else {
      novasBandeiras = bandeirasAtuais.filter(b => b !== bandeira);
    }
    
    setFormData({
      ...formData,
      configs: {
        ...formData.configs,
        bandeiras: novasBandeiras
      }
    });
  };

  const validarForm = (): boolean => {
    if (!formData) return false;
    
    const novosErros: Record<string, string> = {};
    
    if (!formData.nome.trim()) {
      novosErros.nome = 'Nome é obrigatório';
    }
    
    if (formData.taxa < 0 || formData.taxa > 100) {
      novosErros.taxa = 'Taxa deve ser entre 0% e 100%';
    }
    
    if (formData.ordem < 1) {
      novosErros.ordem = 'Ordem deve ser maior que 0';
    }
    
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData || !validarForm()) return;
    
    setSalvando(true);
    
    try {
      const response = await fetch(`/api/meios-pagamento/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSucesso('Meio de pagamento atualizado com sucesso!');
        // Atualiza os dados locais
        setFormData(data.data);
        
        // Redireciona após 2 segundos
        setTimeout(() => {
          router.push('/configuracao/pagamentos');
        }, 2000);
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar meio de pagamento:', error);
      alert('Erro ao atualizar meio de pagamento');
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async () => {
    if (!formData) return;
    
    if (!window.confirm(`Tem certeza que deseja excluir o meio de pagamento "${formData.nome}"? Esta ação não pode ser desfeita.`)) {
      return;
    }
    
    setExcluindo(true);
    
    try {
      const response = await fetch(`/api/meios-pagamento/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Meio de pagamento excluído com sucesso!');
        router.push('/configuracao/pagamentos');
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao excluir meio de pagamento:', error);
      alert('Erro ao excluir meio de pagamento');
    } finally {
      setExcluindo(false);
    }
  };

  const toggleAtivo = async () => {
    if (!formData) return;
    
    setSalvando(true);
    
    try {
      const response = await fetch(`/api/meios-pagamento/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !formData.ativo })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setFormData(prev => prev ? { ...prev, ativo: !prev.ativo } : null);
        alert(`Meio de pagamento ${!formData.ativo ? 'ativado' : 'desativado'} com sucesso!`);
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      alert('Erro ao alterar status');
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando meio de pagamento...</p>
        </div>
      </div>
    );
  }

  if (!formData) {
    return null;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Mensagem de sucesso */}
      {sucesso && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <p className="text-green-800 font-medium">{sucesso}</p>
          </div>
          <p className="text-green-600 text-sm mt-1">Redirecionando em 2 segundos...</p>
        </div>
      )}

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
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mr-3"
              style={{ backgroundColor: `${formData.cor}20`, color: formData.cor }}
            >
              {formData.icone}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Editar Meio de Pagamento</h1>
              <p className="text-gray-600">Atualize as informações do meio de pagamento</p>
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
            onClick={toggleAtivo}
            disabled={salvando}
            className={`px-4 py-2 rounded-lg font-medium ${
              formData.ativo
                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                : 'bg-green-100 text-green-800 hover:bg-green-200'
            }`}
          >
            {salvando ? '...' : formData.ativo ? 'Desativar' : 'Ativar'}
          </button>
          <button
            onClick={handleExcluir}
            disabled={excluindo}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 disabled:opacity-50"
          >
            {excluindo ? 'Excluindo...' : 'Excluir'}
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
        {/* Informações Básicas */}
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
              <p className="mt-1 text-xs text-gray-500">
                {formData.tipo === 'dinheiro' && 'Aceita troco automaticamente'}
                {formData.tipo === 'pix' && 'Não aceita troco nem divisão'}
                {formData.tipo === 'personalizado' && 'Configurações personalizadas'}
              </p>
            </div>

            {/* Descrição */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição (opcional)
              </label>
              <textarea
                name="descricao"
                value={formData.descricao || ''}
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
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  erros.ordem ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {erros.ordem && (
                <p className="mt-1 text-sm text-red-600">{erros.ordem}</p>
              )}
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
              <div className="mb-4">
                <div className="grid grid-cols-8 gap-2 mb-2">
                  {iconesDisponiveis.slice(0, 24).map(icone => (
                    <button
                      key={icone}
                      type="button"
                      onClick={() => setFormData({ ...formData, icone })}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-gray-100 ${
                        formData.icone === icone ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-gray-50'
                      }`}
                      title={icone}
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
            </div>

            {/* Cor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cor
              </label>
              <div className="mb-4">
                <div className="grid grid-cols-8 gap-2 mb-2">
                  {coresDisponiveis.map(cor => (
                    <button
                      key={cor}
                      type="button"
                      onClick={() => setFormData({ ...formData, cor })}
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.cor === cor ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                      }`}
                      style={{ backgroundColor: cor }}
                      title={cor}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    name="cor"
                    value={formData.cor}
                    onChange={handleChange}
                    className="w-16 h-16 rounded-lg cursor-pointer"
                  />
                  <div>
                    <input
                      type="text"
                      value={formData.cor}
                      onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="#000000"
                    />
                    <p className="text-xs text-gray-500 mt-1">Código hexadecimal</p>
                  </div>
                </div>
              </div>
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
                Chave PIX (opcional)
              </label>
              <input
                type="text"
                name="configs.chavePix"
                value={formData.configs?.chavePix || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Chave PIX (CPF, CNPJ, telefone, email ou chave aleatória)"
              />
              <p className="mt-1 text-xs text-gray-500">
                Informe a chave PIX se quiser mostrar na comanda
              </p>
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
                Bandeiras Aceitas (opcional)
              </label>
              <div className="flex flex-wrap gap-3">
                {['Visa', 'Mastercard', 'Elo', 'American Express', 'Hipercard', 'Diners', 'Discover'].map(bandeira => (
                  <label key={bandeira} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={(formData.configs?.bandeiras || []).includes(bandeira)}
                      onChange={(e) => handleBandeiraChange(bandeira, e.target.checked)}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{bandeira}</span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Selecione as bandeiras aceitas pelo estabelecimento
              </p>
            </div>
          </div>
        )}

        {formData.tipo === 'personalizado' && (
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Configurações Personalizadas
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banco (opcional)
                </label>
                <input
                  type="text"
                  name="configs.banco"
                  value={formData.configs?.banco || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome do banco"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agência (opcional)
                </label>
                <input
                  type="text"
                  name="configs.agencia"
                  value={formData.configs?.agencia || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Número da agência"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conta (opcional)
                </label>
                <input
                  type="text"
                  name="configs.conta"
                  value={formData.configs?.conta || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Número da conta"
                />
              </div>
            </div>
          </div>
        )}

        {/* Informações do Sistema */}
        <div className="bg-gray-50 rounded-xl border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações do Sistema</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID do Meio
              </label>
              <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm font-mono">
                {formData._id}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Criado em
              </label>
              <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm">
                {new Date(formData.criadoEm).toLocaleDateString('pt-BR')}
                <span className="text-gray-500 ml-2">
                  {new Date(formData.criadoEm).toLocaleTimeString('pt-BR')}
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Última atualização
              </label>
              <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm">
                {new Date(formData.atualizadoEm).toLocaleDateString('pt-BR')}
                <span className="text-gray-500 ml-2">
                  {new Date(formData.atualizadoEm).toLocaleTimeString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-between gap-3 pt-6 border-t">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push('/configuracao/pagamentos')}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={toggleAtivo}
              disabled={salvando}
              className={`px-6 py-3 rounded-lg font-medium ${
                formData.ativo
                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                  : 'bg-green-100 text-green-800 hover:bg-green-200'
              }`}
            >
              {formData.ativo ? 'Desativar' : 'Ativar'}
            </button>
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleExcluir}
              disabled={excluindo || salvando}
              className="px-6 py-3 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 disabled:opacity-50"
            >
              {excluindo ? 'Excluindo...' : 'Excluir'}
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </form>

      {/* Preview */}
      <div className="mt-8 bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Prévia do Meio de Pagamento</h2>
        
        <div className="flex items-center justify-center">
          <div className={`p-6 rounded-xl border w-64 text-center ${!formData.ativo ? 'opacity-60' : ''}`}>
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mx-auto mb-4"
              style={{ backgroundColor: formData.cor, color: 'white' }}
            >
              {formData.icone}
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 mb-1">{formData.nome}</h3>
            
            {formData.descricao && (
              <p className="text-sm text-gray-600 mb-3">{formData.descricao}</p>
            )}
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Tipo:</span>
                <span className="font-medium">{tiposPagamento.find(t => t.id === formData.tipo)?.nome}</span>
              </div>
              
              {formData.taxa > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Taxa:</span>
                  <span className="font-medium text-yellow-600">{formData.taxa}%</span>
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${
                  formData.ativo ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formData.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              
              <div className="flex items-center justify-center gap-4 mt-3">
                {formData.permiteTroco && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                    Aceita troco
                  </span>
                )}
                {formData.permiteDividir && (
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                    Permite divisão
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}