// app/configuracao/categorias/novo/page.tsx - VERSÃO HÍBRIDA
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Tag, 
  Save, 
  X,
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  Palette
} from 'lucide-react';

const icones = ['📦', '🍔', '🍕', '🥤', '🍟', '🍰', '🥗', '☕', '🍺', '🍦', '🧀', '🥩'];

export default function NovaCategoriaPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [imagemPreview, setImagemPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    icone: '📦',
    imagem: '',
    usaImagem: false, // false = usa ícone, true = usa imagem
    ordem: '',
    ativo: true
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
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
          usaImagem: true // Automaticamente marca como "usa imagem"
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
    setEnviando(true);

    try {
      const response = await fetch('/api/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          ordem: formData.ordem ? parseInt(formData.ordem) : undefined
        })
      });

      const data = await response.json();

      if (data.success) {
        router.push('/configuracao/categorias');
        router.refresh();
      } else {
        setErro(data.error || 'Erro ao criar categoria');
      }
    } catch (error) {
      setErro('Erro ao conectar com o servidor');
      console.error(error);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Link
            href="/configuracao/categorias"
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nova Categoria</h1>
            <p className="text-gray-600">Adicione uma nova categoria ao sistema</p>
          </div>
        </div>
      </div>

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

            {/* Tipo de Visualização */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de Visualização
              </label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, usaImagem: false }))}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                    !formData.usaImagem
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Palette className="h-8 w-8 mb-2" />
                  <span className="font-medium">Usar Ícone</span>
                  <span className="text-sm mt-1">Selecionar um emoji</span>
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
                  <span className="text-sm mt-1">Enviar uma foto</span>
                </button>
              </div>
            </div>

            {/* Ícone (só aparece se não usa imagem) */}
            {!formData.usaImagem && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ícone
                </label>
                <div className="flex items-center space-x-2">
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
                  <div className="text-3xl p-3 bg-gray-100 rounded-lg w-16 h-16 flex items-center justify-center">
                    {formData.icone}
                  </div>
                </div>
              </div>
            )}

            {/* Imagem (só aparece se usa imagem) */}
            {formData.usaImagem && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagem da Categoria
                </label>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  {/* Upload */}
                  <div className="flex-1">
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-green-400 transition-colors">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">
                        Clique para adicionar uma imagem
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
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                      >
                        {uploading ? 'Enviando...' : 'Selecionar Imagem'}
                      </button>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700 mb-3">Prévia:</p>
                    <div className="h-48 bg-gray-100 rounded-xl border border-gray-200 overflow-hidden flex items-center justify-center">
                      {imagemPreview ? (
                        <img 
                          src={imagemPreview} 
                          alt="Preview" 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-16 w-16 text-gray-400" />
                      )}
                    </div>
                  </div>
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
                placeholder="Deixe em branco para auto"
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
                onChange={(e) => setFormData(prev => ({ ...prev, ativo: e.target.checked }))}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="ativo" className="ml-2 text-sm text-gray-700">
                Categoria ativa (aparece nas listas)
              </label>
            </div>

            {/* Erro */}
            {erro && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {erro}
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="flex justify-end space-x-4">
            <Link
              href="/configuracao/categorias"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 flex items-center"
            >
              <X className="h-5 w-5 mr-2" />
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={enviando || !formData.nome}
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
                  Criar Categoria
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}