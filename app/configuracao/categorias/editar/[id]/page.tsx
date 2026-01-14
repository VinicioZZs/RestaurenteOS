// app/configuracao/categorias/editar/[id]/page.tsx - VERSÃO COMPLETA CORRIGIDA
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Tag, 
  Save, 
  X,
  ArrowLeft,
  Upload,
  Trash2,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  Palette
} from 'lucide-react';

const icones = ['📦', '🍔', '🍕', '🥤', '🍟', '🍰', '🥗', '☕', '🍺', '🍦', '🧀', '🥩'];

interface CategoriaData {
  _id: string;
  nome: string;
  descricao: string;
  icone: string;
  imagem: string;
  usaImagem: boolean;
  ordem: number;
  ativo: boolean;
}

export default function EditarCategoriaPage() {
  const router = useRouter();
  const params = useParams();
  const categoriaId = params.id as string;
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [imagemPreview, setImagemPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState<CategoriaData>({
    _id: '',
    nome: '',
    descricao: '',
    icone: '📦',
    imagem: '',
    usaImagem: false,
    ordem: 1,
    ativo: true
  });

  useEffect(() => {
    if (categoriaId) {
      carregarDados();
    }
  }, [categoriaId]);

  // Sincroniza o preview com a imagem do formData
  useEffect(() => {
    if (formData.imagem) {
      setImagemPreview(formData.imagem);
    }
  }, [formData.imagem]);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      setErro('');
      
      const response = await fetch(`/api/categorias/${categoriaId}`);
      const data = await response.json();
      
      if (data.success) {
        const categoria = data.data;
        setFormData({
          _id: categoria._id,
          nome: categoria.nome,
          descricao: categoria.descricao || '',
          icone: categoria.icone || '📦',
          imagem: categoria.imagem || '',
          usaImagem: categoria.usaImagem !== undefined ? categoria.usaImagem : false,
          ordem: categoria.ordem || 1,
          ativo: categoria.ativo !== undefined ? categoria.ativo : true
        });
        
        if (categoria.imagem) {
          setImagemPreview(categoria.imagem);
        }
      } else {
        setErro(data.error || 'Categoria não encontrada');
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setErro('Erro ao carregar dados da categoria');
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
        [name]: value === '' ? 1 : parseInt(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
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
        setFormData(prev => ({ 
          ...prev, 
          imagem: base64String,
          usaImagem: true
        }));
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erro no upload:', error);
      setErro('Erro ao fazer upload da imagem');
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');
    setEnviando(true);

    try {
      const response = await fetch(`/api/categorias/${categoriaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setSucesso('Categoria atualizada com sucesso!');
        setTimeout(() => carregarDados(), 1000);
      } else {
        setErro(data.error || 'Erro ao atualizar categoria');
      }
    } catch (error) {
      console.error('Erro:', error);
      setErro('Erro ao conectar com o servidor');
    } finally {
      setEnviando(false);
    }
  };

  const handleExcluir = async () => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) {
      return;
    }
    
    setExcluindo(true);
    setErro('');
    
    try {
      const response = await fetch(`/api/categorias/${categoriaId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        router.push('/configuracao/categorias');
        router.refresh();
      } else {
        setErro(data.error || 'Erro ao excluir categoria');
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
          <Loader2 className="h-8 w-8 text-green-600 animate-spin mr-3" />
          <span className="text-gray-600">Carregando categoria...</span>
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
            href="/configuracao/categorias"
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Editar Categoria</h1>
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
                Nome da Categoria *
              </label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
                placeholder="Ex: Bebidas, Lanches, Sobremesas"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                placeholder="Descreva esta categoria..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Status da Visualização */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">Status da Visualização</h3>
              <div className="flex items-center">
                <div className={`w-12 h-12 rounded-lg mr-3 flex items-center justify-center ${
                  formData.usaImagem ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  {formData.usaImagem ? (
                    formData.imagem ? (
                      <div className="w-10 h-10 rounded overflow-hidden">
                        <img 
                          src={formData.imagem} 
                          alt="Miniatura" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <ImageIcon className="h-6 w-6 text-blue-600" />
                    )
                  ) : (
                    <div className="text-2xl">{formData.icone}</div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {formData.usaImagem ? 'Visualização por Imagem' : 'Visualização por Ícone'}
                  </p>
                  <p className="text-xs text-gray-600">
                    {formData.usaImagem 
                      ? (formData.imagem ? 'Imagem personalizada carregada' : 'Aguardando imagem...')
                      : `Ícone: ${formData.icone}`
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Tipo de Visualização */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de Visualização
              </label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ 
                      ...prev, 
                      usaImagem: false,
                      imagem: '' 
                    }));
                    setImagemPreview('');
                  }}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                    !formData.usaImagem
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Palette className="h-8 w-8 mb-2" />
                  <span className="font-medium">Usar Ícone</span>
                  <span className="text-sm mt-1">
                    {!formData.usaImagem ? '✓ Selecionado' : 'Selecionar um emoji'}
                  </span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, usaImagem: true }))}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                    formData.usaImagem
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ImageIcon className="h-8 w-8 mb-2" />
                  <span className="font-medium">Usar Imagem</span>
                  <span className="text-sm mt-1">
                    {formData.usaImagem ? '✓ Selecionado' : 'Enviar uma foto'}
                  </span>
                </button>
              </div>
            </div>

            {/* Ícone (só aparece se não usa imagem) */}
            {!formData.usaImagem && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ícone
                </label>
                <div className="flex items-center space-x-4">
                  <select
                    name="icone"
                    value={formData.icone}
                    onChange={handleChange}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {icones.map(icone => (
                      <option key={icone} value={icone}>
                        {icone} {icone === '📦' ? 'Caixa' : 
                               icone === '🍔' ? 'Hambúrguer' :
                               icone === '🍕' ? 'Pizza' :
                               icone === '🥤' ? 'Bebida' :
                               icone === '🍟' ? 'Batata' :
                               icone === '🍰' ? 'Bolo' : 'Ícone'}
                      </option>
                    ))}
                  </select>
                  <div className="text-4xl p-4 bg-gray-100 rounded-lg w-20 h-20 flex items-center justify-center shadow-sm">
                    {formData.icone}
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Clique no ícone para visualizar em tamanho maior
                </p>
              </div>
            )}

            {/* Imagem (só aparece se usa imagem) */}
            {formData.usaImagem && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagem da Categoria
                  {formData.imagem && (
                    <span className="ml-2 text-green-600 text-sm">✓ Carregada</span>
                  )}
                </label>
                
                <div className="mb-4">
                  <div className="flex items-center space-x-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          {formData.imagem ? 'Alterar Imagem' : 'Selecionar Imagem'}
                        </>
                      )}
                    </button>
                    
                    {formData.imagem && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({ ...prev, imagem: '' }));
                          setImagemPreview('');
                        }}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 flex items-center"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remover Imagem
                      </button>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-500 mt-2">
                    PNG, JPG, GIF até 5MB. Recomendado: 300x300 pixels
                  </p>
                </div>
                
                {/* Preview */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Prévia:</p>
                  <div className="h-64 bg-gray-100 rounded-xl border-2 border-gray-200 overflow-hidden flex items-center justify-center relative">
                    {imagemPreview || formData.imagem ? (
                      <>
                        <img 
                          src={imagemPreview || formData.imagem} 
                          alt="Preview" 
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute bottom-4 left-4 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {formData.imagem ? 'Imagem carregada' : 'Nova imagem'}
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-6">
                        <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Nenhuma imagem selecionada</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Clique em "Selecionar Imagem" acima
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {formData.imagem && (
                    <p className="mt-2 text-xs text-gray-500">
                      ⚠️ Se remover a imagem, a categoria voltará a usar ícone automaticamente
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Ordem */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ordem de Exibição
              </label>
              <input
                type="number"
                name="ordem"
                value={formData.ordem}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-1">
                Número que define a ordem na listagem (menor = primeiro)
              </p>
            </div>

            {/* Status */}
            <div className="flex items-center mb-6">
              <input
                type="checkbox"
                id="ativo"
                name="ativo"
                checked={formData.ativo}
                onChange={handleChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="ativo" className="ml-2 text-sm text-gray-700">
                Categoria ativa (aparece nas listas)
              </label>
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-between space-x-4">
            <Link
              href="/configuracao/categorias"
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
                disabled={enviando || !formData.nome}
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
    </div>
  );
}