// app/configuracao/produtos/editar/[id]/page.tsx - VERSÃO CORRIGIDA
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
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
  AlertCircle,
  Trash2,
  Loader2
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

interface ProdutoData {
  _id: string;
  nome: string;
  descricao: string;
  codigo: string;
  precoVenda: number;
  precoCusto: number;
  categoria: string;
  imagem: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  controlarEstoque: boolean;
  adicionais: string[];
  unidadeMedida: string;
  peso: number;
  volume: number;
  ativo: boolean;
  tags: string[];
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

export default function EditarProdutoPage() {
  const router = useRouter();
  const params = useParams();
  const produtoId = params.id as string;
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [adicionais, setAdicionais] = useState<Adicional[]>([]);
  const [imagemPreview, setImagemPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState<ProdutoData>({
    _id: '',
    nome: '',
    descricao: '',
    codigo: '',
    precoVenda: 0,
    precoCusto: 0,
    categoria: '',
    imagem: '',
    estoqueAtual: 0,
    estoqueMinimo: 0,
    controlarEstoque: false,
    adicionais: [],
    unidadeMedida: 'unidade',
    peso: 0,
    volume: 0,
    ativo: true,
    tags: []
  });

  useEffect(() => {
    if (produtoId) {
      carregarDados();
    }
  }, [produtoId]);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      setErro('');
      
      console.log('Carregando dados para produto ID:', produtoId);
      
      // Carregar categorias
      const resCategorias = await fetch('/api/categorias?ativas=true');
      const dataCategorias = await resCategorias.json();
      
      if (dataCategorias.success) {
        setCategorias(dataCategorias.data);
      } else {
        console.error('Erro ao carregar categorias:', dataCategorias.error);
      }
      
      // Carregar adicionais
      const resAdicionais = await fetch('/api/adicionais?ativos=true');
      const dataAdicionais = await resAdicionais.json();
      
      if (dataAdicionais.success) {
        setAdicionais(dataAdicionais.data);
      } else {
        console.error('Erro ao carregar adicionais:', dataAdicionais.error);
      }
      
      // Carregar produto usando a API correta
      const resProduto = await fetch(`/api/produtos/${produtoId}`);
      
      if (!resProduto.ok) {
        throw new Error(`Erro ${resProduto.status}: ${resProduto.statusText}`);
      }
      
      const dataProduto = await resProduto.json();
      console.log('Dados do produto recebidos:', dataProduto);
      
      if (dataProduto.success) {
        const produto = dataProduto.data;
        
        console.log('Produto formatado:', {
          ...produto,
          tags: produto.tags || [],
          adicionais: produto.adicionais || []
        });
        
        // Converter tags de array para string (se necessário)
        let tagsArray: string[] = [];
        if (Array.isArray(produto.tags)) {
          tagsArray = produto.tags;
        } else if (typeof produto.tags === 'string') {
         tagsArray = produto.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag);
        }
        
        // Garantir que adicionais seja um array
        const adicionaisArray = Array.isArray(produto.adicionais) 
          ? produto.adicionais 
          : [];
        
        setFormData({
          _id: produto._id || '',
          nome: produto.nome || '',
          descricao: produto.descricao || '',
          codigo: produto.codigo || '',
          precoVenda: produto.precoVenda || produto.preco || 0,
          precoCusto: produto.precoCusto || 0,
          categoria: produto.categoria || '',
          imagem: produto.imagem || '',
          estoqueAtual: produto.estoqueAtual || 0,
          estoqueMinimo: produto.estoqueMinimo || 0,
          controlarEstoque: produto.controlarEstoque || false,
          adicionais: adicionaisArray,
          unidadeMedida: produto.unidadeMedida || 'unidade',
          peso: produto.peso || 0,
          volume: produto.volume || 0,
          ativo: produto.ativo !== undefined ? produto.ativo : true,
          tags: tagsArray
        });
        
        if (produto.imagem) {
          setImagemPreview(produto.imagem);
        }
      } else {
        setErro(dataProduto.error || 'Produto não encontrado');
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      setErro(`Erro ao carregar dados do produto: ${error.message || 'Erro desconhecido'}`);
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

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tagsString = e.target.value;
    const tagsArray = tagsString
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    setFormData(prev => ({
      ...prev,
      tags: tagsArray
    }));
  };

  const handleAdicionalToggle = (adicionalId: string) => {
    setFormData(prev => {
      const adicionaisAtualizados = prev.adicionais.includes(adicionalId)
        ? prev.adicionais.filter(id => id !== adicionalId)
        : [...prev.adicionais, adicionalId];
      
      return {
        ...prev,
        adicionais: adicionaisAtualizados
      };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErro('Por favor, selecione uma imagem válida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErro('A imagem deve ter menos de 5MB');
      return;
    }

    setUploading(true);
    
    try {
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
    const venda = formData.precoVenda || 0;
    const custo = formData.precoCusto || 0;
    
    if (custo <= 0) return 0;
    
    const lucro = venda - custo;
    return (lucro / custo) * 100;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setEnviando(true);

    console.log('Enviando dados:', formData);

    // Validações
    if (!formData.nome.trim()) {
      setErro('Nome do produto é obrigatório');
      setEnviando(false);
      return;
    }

    if (!formData.precoVenda || formData.precoVenda <= 0) {
      setErro('Preço de venda deve ser maior que zero');
      setEnviando(false);
      return;
    }

    if (!formData.categoria) {
      setErro('Categoria é obrigatória');
      setEnviando(false);
      return;
    }

    if (formData.controlarEstoque) {
      if (formData.estoqueAtual < 0) {
        setErro('Estoque atual não pode ser negativo');
        setEnviando(false);
        return;
      }
      
      if (formData.estoqueMinimo < 0) {
        setErro('Estoque mínimo não pode ser negativo');
        setEnviando(false);
        return;
      }
    }

    try {
      // Garantir que os dados estejam no formato correto
      const dadosParaEnviar = {
        nome: formData.nome.trim(),
        descricao: formData.descricao?.trim() || '',
        codigo: formData.codigo?.trim() || '',
        precoVenda: formData.precoVenda,
        precoCusto: formData.precoCusto || 0,
        categoria: formData.categoria,
        imagem: formData.imagem || '',
        estoqueAtual: formData.estoqueAtual || 0,
        estoqueMinimo: formData.estoqueMinimo || 0,
        controlarEstoque: formData.controlarEstoque || false,
        adicionais: formData.adicionais || [],
        unidadeMedida: formData.unidadeMedida || 'unidade',
        peso: formData.peso || 0,
        volume: formData.volume || 0,
        ativo: formData.ativo,
        tags: formData.tags || []
      };

      console.log('Dados a serem enviados para API:', dadosParaEnviar);

      const response = await fetch(`/api/produtos/${produtoId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(dadosParaEnviar),
      });

      console.log('Resposta da API:', {
        status: response.status,
        statusText: response.statusText
      });

      const data = await response.json();
      console.log('Dados da resposta:', data);

      if (data.success) {
        setSucesso('Produto atualizado com sucesso!');
        // Recarregar dados para garantir consistência
        setTimeout(() => carregarDados(), 1000);
        router.push('/configuracao/produtos');
        router.refresh();
      } else {
        setErro(data.error || 'Erro ao atualizar produto');
      }
    } catch (error: any) {
      console.error('Erro ao enviar:', error);
      setErro(`Erro ao conectar com o servidor: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setEnviando(false);
    }
  };

  const handleExcluir = async () => {
    if (!confirm('Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    setExcluindo(true);
    setErro('');
    
    try {
      const response = await fetch(`/api/produtos/${produtoId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        router.push('/configuracao/produtos');
        router.refresh();
      } else {
        setErro(data.error || 'Erro ao excluir produto');
      }
    } catch (error: any) {
      console.error('Erro:', error);
      setErro(`Erro ao conectar com o servidor: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setExcluindo(false);
    }
  };

  const margem = calcularMargem();
  const margemCor = margem >= 50 ? 'text-green-600' : margem >= 30 ? 'text-yellow-600' : 'text-red-600';

  if (carregando) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin mr-3" />
          <span className="text-gray-600">Carregando produto...</span>
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
            href="/configuracao/produtos"
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Produto</h1>
            <p className="text-gray-600">Editando: {formData.nome || 'Carregando...'}</p>
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
                value={(formData.tags || []).join(', ')}
                onChange={handleTagsChange}
                placeholder="Ex: vegano, lanche, popular, promocao"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">
                Tags atuais: {(formData.tags || []).length > 0 ? (formData.tags || []).join(', ') : 'Nenhuma tag definida'}
              </p>
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
                  value={formData.precoVenda || ''}
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
                  value={formData.precoCusto || ''}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              {formData.precoCusto && formData.precoCusto > 0 && (
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
              onChange={handleChange}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="controlarEstoque" className="ml-2 text-sm text-gray-700">
              Controlar estoque deste produto
            </label>
          </div>

          {/* Alerta de estoque baixo */}
          {formData.controlarEstoque && 
           formData.estoqueAtual <= formData.estoqueMinimo && (
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
                  value={formData.peso || ''}
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
                  value={formData.volume || ''}
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
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${formData.adicionais.includes(adicional._id)
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
                    <div className={`h-5 w-5 rounded-full border-2 ${formData.adicionais.includes(adicional._id)
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-gray-300'
                    }`}>
                      {formData.adicionais.includes(adicional._id) && (
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
              <div className="relative">
                <input
                  type="checkbox"
                  id="ativo"
                  name="ativo"
                  checked={formData.ativo}
                  onChange={handleChange}
                  className="sr-only"
                />
                <label
                  htmlFor="ativo"
                  className={`block w-14 h-8 rounded-full cursor-pointer transition-colors ${formData.ativo ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                >
                  <span
                    className={`block h-6 w-6 mt-1 ml-1 rounded-full bg-white transition-transform ${formData.ativo ? 'translate-x-6' : ''
                      }`}
                  ></span>
                </label>
              </div>
              <label htmlFor="ativo" className="ml-3 text-sm font-medium text-gray-900">
                {formData.ativo ? 'Produto Ativo' : 'Produto Inativo'}
              </label>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex justify-between space-x-4">
          <Link
            href="/configuracao/produtos"
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
              disabled={enviando || !formData.nome || !formData.precoVenda || !formData.categoria}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center"
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
  );
}