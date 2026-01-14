// app/configuracao/produtos/novo/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Package, 
  Save, 
  X,
  ArrowLeft,
  DollarSign,
  Tag,
  BarChart3,
  Upload,
  Scale,
  Box,
  Hash,
  Percent,
  AlertCircle
} from 'lucide-react';

interface Categoria {
  _id: string;
  nome: string;
  icone?: string;
}

interface Adicional {
  _id: string;
  nome: string;
  preco: number;
}

const unidadesMedida = [
  'unidade',
  'kg',
  'g',
  'litro',
  'ml',
  'caixa',
  'pacote',
  'fardo'
];

export default function NovoProdutoPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [adicionais, setAdicionais] = useState<Adicional[]>([]);
  const [imagemPreview, setImagemPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    // Informações básicas
    nome: '',
    codigo: '',
    descricao: '',
    categoria: '',
    
    // Preços
    precoVenda: '',
    precoCusto: '',
    
    // Estoque
    estoqueAtual: '0',
    estoqueMinimo: '0',
    controlarEstoque: false,
    
    // Unidade e medidas
    unidadeMedida: 'unidade',
    peso: '',
    volume: '',
    
    // Imagem
    imagem: '',
    
    // Adicionais
    adicionaisSelecionados: [] as string[],
    
    // Tags
    tags: '',
    
    // Status
    ativo: true
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      // Carregar categorias
      const resCategorias = await fetch('/api/categorias?ativas=true');
      const dataCategorias = await resCategorias.json();
      if (dataCategorias.success) {
        setCategorias(dataCategorias.data);
        if (dataCategorias.data.length > 0 && !formData.categoria) {
          setFormData(prev => ({ ...prev, categoria: dataCategorias.data[0]._id }));
        }
      }
      
      // Carregar adicionais
      const resAdicionais = await fetch('/api/adicionais?ativos=true');
      const dataAdicionais = await resAdicionais.json();
      if (dataAdicionais.success) {
        setAdicionais(dataAdicionais.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleAdicionalToggle = (adicionalId: string) => {
    setFormData(prev => ({
      ...prev,
      adicionaisSelecionados: prev.adicionaisSelecionados.includes(adicionalId)
        ? prev.adicionaisSelecionados.filter(id => id !== adicionalId)
        : [...prev.adicionaisSelecionados, adicionalId]
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação básica
    if (!file.type.startsWith('image/')) {
      setErro('Por favor, selecione uma imagem válida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      setErro('A imagem deve ter menos de 5MB');
      return;
    }

    setUploading(true);
    
    try {
      // Em produção, você faria upload para um serviço como Cloudinary, AWS S3, etc.
      // Aqui vamos usar uma URL base64 temporária para demonstração
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagemPreview(base64String);
        setFormData(prev => ({ ...prev, imagem: base64String }));
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erro no upload:', error);
      setErro('Erro ao fazer upload da imagem');
      setUploading(false);
    }
  };

  const calcularMargem = () => {
    const venda = parseFloat(formData.precoVenda) || 0;
    const custo = parseFloat(formData.precoCusto) || 0;
    
    if (custo <= 0) return 0;
    
    const lucro = venda - custo;
    return (lucro / custo) * 100;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setEnviando(true);

     // DEBUG: Veja o que está sendo enviado
  console.log('Dados sendo enviados:', {
    ...formData,
    precoVenda: parseFloat(formData.precoVenda),
    precoCusto: formData.precoCusto ? parseFloat(formData.precoCusto) : undefined,
  });


    // Validações
    if (!formData.nome.trim()) {
      setErro('Nome do produto é obrigatório');
      setEnviando(false);
      return;
    }

    if (!formData.precoVenda || parseFloat(formData.precoVenda) <= 0) {
      setErro('Preço de venda deve ser maior que zero');
      setEnviando(false);
      return;
    }

    if (formData.controlarEstoque) {
      const estoqueAtual = parseInt(formData.estoqueAtual);
      const estoqueMinimo = parseInt(formData.estoqueMinimo);
      
      if (estoqueAtual < 0) {
        setErro('Estoque atual não pode ser negativo');
        setEnviando(false);
        return;
      }
      
      if (estoqueMinimo < 0) {
        setErro('Estoque mínimo não pode ser negativo');
        setEnviando(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          precoVenda: parseFloat(formData.precoVenda),
          precoCusto: formData.precoCusto ? parseFloat(formData.precoCusto) : undefined,
          estoqueAtual: parseInt(formData.estoqueAtual),
          estoqueMinimo: parseInt(formData.estoqueMinimo),
          peso: formData.peso ? parseFloat(formData.peso) : undefined,
          volume: formData.volume ? parseFloat(formData.volume) : undefined,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          adicionais: formData.adicionaisSelecionados
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push('/configuracao/produtos');
        router.refresh();
      } else {
        setErro(data.error || 'Erro ao criar produto');
      }
    } catch (error) {
      setErro('Erro ao conectar com o servidor');
      console.error(error);
    } finally {
      setEnviando(false);
    }
  };

  const margem = calcularMargem();
  const margemCor = margem >= 50 ? 'text-green-600' : margem >= 30 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Link
            href="/configuracao/produtos"
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Novo Produto</h1>
            <p className="text-gray-600">Adicione um novo produto ao cardápio</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Card 1: Informações Básicas */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <Package className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900">Informações Básicas</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Produto *
              </label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
                placeholder="Ex: Hamburguer Artesanal"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Código */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código (SKU)
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleChange}
                  placeholder="Ex: PROD-001"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria *
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none"
                >
                  <option value="">Selecione uma categoria</option>
                  {categorias.map((cat) => (
                    <option key={cat._id} value={cat.nome}>
                      {cat.icone ? `${cat.icone} ` : ''}{cat.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Unidade de Medida */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unidade de Medida
              </label>
              <div className="relative">
                <Scale className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <select
                  name="unidadeMedida"
                  value={formData.unidadeMedida}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white appearance-none"
                >
                  {unidadesMedida.map((unidade) => (
                    <option key={unidade} value={unidade}>
                      {unidade}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Descrição */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição
              </label>
              <textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                rows={3}
                placeholder="Descreva o produto, ingredientes, etc..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Tags */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (separadas por vírgula)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="Ex: vegano, lanche, popular, promocao"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Preços e Estoque */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <DollarSign className="h-6 w-6 text-green-600 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900">Preços e Estoque</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Preço de Venda */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preço de Venda *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700">R$</span>
                <input
                  type="number"
                  name="precoVenda"
                  value={formData.precoVenda}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Preço de Custo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preço de Custo
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-700">R$</span>
                <input
                  type="number"
                  name="precoCusto"
                  value={formData.precoCusto}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              {formData.precoCusto && (
                <div className="mt-2">
                  <span className={`text-sm font-medium ${margemCor}`}>
                    <Percent className="inline h-4 w-4 mr-1" />
                    Margem: {margem.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>

            {/* Estoque Atual */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estoque Atual
              </label>
              <input
                type="number"
                name="estoqueAtual"
                value={formData.estoqueAtual}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Estoque Mínimo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estoque Mínimo
              </label>
              <input
                type="number"
                name="estoqueMinimo"
                value={formData.estoqueMinimo}
                onChange={handleChange}
                min="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Controle de Estoque */}
          <div className="mt-6 flex items-center">
            <input
              type="checkbox"
              id="controlarEstoque"
              name="controlarEstoque"
              checked={formData.controlarEstoque}
              onChange={(e) => setFormData(prev => ({ ...prev, controlarEstoque: e.target.checked }))}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="controlarEstoque" className="ml-2 text-sm text-gray-700">
              Controlar estoque deste produto
            </label>
          </div>

          {/* Alerta de estoque baixo */}
          {formData.controlarEstoque && 
           parseInt(formData.estoqueAtual) <= parseInt(formData.estoqueMinimo) && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="text-sm text-yellow-800 font-medium">
                  Atenção: Estoque atual está no nível mínimo ou abaixo!
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Card 3: Medidas */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <Scale className="h-6 w-6 text-purple-600 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900">Medidas</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Peso */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Peso (kg)
              </label>
              <div className="relative">
                <Scale className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="number"
                  name="peso"
                  value={formData.peso}
                  onChange={handleChange}
                  min="0"
                  step="0.001"
                  placeholder="0,000"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Volume */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Volume (litros)
              </label>
              <div className="relative">
                <Box className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="number"
                  name="volume"
                  value={formData.volume}
                  onChange={handleChange}
                  min="0"
                  step="0.001"
                  placeholder="0,000"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Imagem */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center mb-6">
            <Upload className="h-6 w-6 text-orange-600 mr-3" />
            <h2 className="text-lg font-semibold text-gray-900">Imagem do Produto</h2>
          </div>
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Upload */}
            <div className="flex-1">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  Clique ou arraste uma imagem aqui
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  PNG, JPG, GIF até 5MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading ? 'Enviando...' : 'Selecionar Imagem'}
                </button>
              </div>
            </div>

            {/* Preview */}
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700 mb-3">Prévia:</p>
              <div className="h-48 w-48 bg-gray-100 rounded-xl border border-gray-200 overflow-hidden flex items-center justify-center">
                {imagemPreview ? (
                  <img 
                    src={imagemPreview} 
                    alt="Preview" 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Package className="h-16 w-16 text-gray-400" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card 5: Adicionais */}
        {adicionais.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <BarChart3 className="h-6 w-6 text-pink-600 mr-3" />
              <h2 className="text-lg font-semibold text-gray-900">Adicionais</h2>
            </div>
            
            <p className="text-gray-600 mb-4">
              Selecione os adicionais disponíveis para este produto
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adicionais.map((adicional) => (
                <div
                  key={adicional._id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    formData.adicionaisSelecionados.includes(adicional._id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleAdicionalToggle(adicional._id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{adicional.nome}</div>
                      <div className="text-sm text-gray-500">
                        + R$ {adicional.preco.toFixed(2)}
                      </div>
                    </div>
                    <div className={`h-5 w-5 rounded-full border-2 ${
                      formData.adicionaisSelecionados.includes(adicional._id)
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {formData.adicionaisSelecionados.includes(adicional._id) && (
                        <div className="h-full w-full flex items-center justify-center">
                          <div className="h-2 w-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Card 6: Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BarChart3 className="h-6 w-6 text-gray-600 mr-3" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Status do Produto</h2>
                <p className="text-sm text-gray-600">Defina se o produto está disponível para venda</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="ativo"
                name="ativo"
                checked={formData.ativo}
                onChange={(e) => setFormData(prev => ({ ...prev, ativo: e.target.checked }))}
                className="h-6 w-11 rounded-full appearance-none bg-gray-200 checked:bg-green-600 transition-colors relative"
              />
              <label htmlFor="ativo" className="ml-3 text-sm font-medium text-gray-900">
                {formData.ativo ? 'Produto Ativo' : 'Produto Inativo'}
              </label>
            </div>
          </div>
        </div>

        {/* Erro */}
        {erro && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {erro}
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex justify-end space-x-4">
          <Link
            href="/configuracao/produtos"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 flex items-center"
          >
            <X className="h-5 w-5 mr-2" />
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={enviando || !formData.nome || !formData.precoVenda || !formData.categoria}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center"
          >
            {enviando ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Criando...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Criar Produto
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}