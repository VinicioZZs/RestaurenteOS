// app/configuracao/adicionais/editar/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Plus, 
  Save, 
  X,
  ArrowLeft,
  DollarSign,
  Tag,
  AlertCircle,
  Loader2,
  Trash2
} from 'lucide-react';

const categoriasPredefinidas = [
  'Molho',
  'Queijo',
  'Acompanhamento',
  'Vegetal',
  'Proteína',
  'Tempero',
  'Bebida',
  'Sobremesa',
  'Adicional'
];

interface AdicionalData {
  _id: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria: string;
  ativo: boolean;
}

export default function EditarAdicionalPage() {
  const router = useRouter();
  const params = useParams();
  const adicionalId = params.id as string;
  
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  
  const [formData, setFormData] = useState<AdicionalData>({
    _id: '',
    nome: '',
    descricao: '',
    preco: 0,
    categoria: 'Adicional',
    ativo: true
  });

  useEffect(() => {
    if (adicionalId) {
      carregarDados();
    }
  }, [adicionalId]);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      setErro('');
      
      const response = await fetch(`/api/adicionais/${adicionalId}`);
      const data = await response.json();
      
      if (data.success) {
        const adicional = data.data;
        setFormData({
          _id: adicional._id,
          nome: adicional.nome,
          descricao: adicional.descricao || '',
          preco: adicional.preco,
          categoria: adicional.categoria || 'Adicional',
          ativo: adicional.ativo !== undefined ? adicional.ativo : true
        });
      } else {
        setErro(data.error || 'Adicional não encontrado');
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setErro('Erro ao carregar dados do adicional');
    } finally {
      setCarregando(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? 0 : parseFloat(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setEnviando(true);

    // Validações
    if (!formData.nome.trim()) {
      setErro('Nome do adicional é obrigatório');
      setEnviando(false);
      return;
    }

    if (!formData.preco || formData.preco <= 0) {
      setErro('Preço deve ser maior que zero');
      setEnviando(false);
      return;
    }

    try {
      const response = await fetch(`/api/adicionais/${adicionalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setSucesso('Adicional atualizado com sucesso!');
        setTimeout(() => carregarDados(), 1000);
      } else {
        setErro(data.error || 'Erro ao atualizar adicional');
      }
    } catch (error) {
      console.error('Erro:', error);
      setErro('Erro ao conectar com o servidor');
    } finally {
      setEnviando(false);
    }
  };

  const handleExcluir = async () => {
    if (!confirm('Tem certeza que deseja excluir este adicional?')) {
      return;
    }
    
    setExcluindo(true);
    setErro('');
    
    try {
      const response = await fetch(`/api/adicionais/${adicionalId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        router.push('/configuracao/adicionais');
        router.refresh();
      } else {
        setErro(data.error || 'Erro ao excluir adicional');
      }
    } catch (error) {
      console.error('Erro:', error);
      setErro('Erro ao conectar com o servidor');
    } finally {
      setExcluindo(false);
    }
  };

  if (carregando) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 text-purple-600 animate-spin mr-3" />
          <span className="text-gray-600">Carregando adicional...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div className="flex items-center mb-4 md:mb-0">
          <Link
            href="/configuracao/adicionais"
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Adicional</h1>
            <p className="text-gray-600">Editando: {formData.nome}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExcluir}
            disabled={excluindo}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 flex items-center"
          >
            {excluindo ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Trash2 className="h-5 w-5 mr-2" />
            )}
            Excluir
          </button>
        </div>
      </div>

      {/* Mensagens de status */}
      {sucesso && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          <div className="flex items-center">
            <div className="h-5 w-5 bg-green-600 rounded-full flex items-center justify-center mr-2">
              <span className="text-white text-xs">✓</span>
            </div>
            {sucesso}
          </div>
        </div>
      )}

      {erro && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {erro}
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card do formulário */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* Nome */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Adicional *
              </label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
                placeholder="Ex: Queijo Extra, Bacon, Molho Especial"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Descrição */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                rows={3}
                placeholder="Descreva este adicional..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Preço e Categoria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preço Adicional *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700">R$</span>
                  <input
                    type="number"
                    name="preco"
                    value={formData.preco || ''}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Valor extra quando adicionado ao produto
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <select
                    name="categoria"
                    value={formData.categoria}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white appearance-none"
                  >
                    {categoriasPredefinidas.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center mb-6">
              <input
                type="checkbox"
                id="ativo"
                name="ativo"
                checked={formData.ativo}
                onChange={handleChange}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="ativo" className="ml-2 text-sm text-gray-700">
                Adicional ativo (disponível para seleção)
              </label>
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-between space-x-4">
            <Link
              href="/configuracao/adicionais"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 flex items-center"
            >
              <X className="h-5 w-5 mr-2" />
              Cancelar
            </Link>
            
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => carregarDados()}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 flex items-center"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Reverter Alterações
              </button>
              
              <button
                type="submit"
                disabled={enviando || !formData.nome || !formData.preco}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center"
              >
                {enviando ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}