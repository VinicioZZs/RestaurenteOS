    // app/configuracao/adicionais/novo/page.tsx
    'use client';

    import { useState } from 'react';
    import { useRouter } from 'next/navigation';
    import Link from 'next/link';
    import { 
    Plus, 
    Save, 
    X,
    ArrowLeft,
    DollarSign,
    Tag,
    AlertCircle,
    Loader2
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

    export default function NovoAdicionalPage() {
    const router = useRouter();
    
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState('');
    
    const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    preco: '',
    categoria: 'Adicional',
    gratuito: false, // ← NOVO CAMPO
    ativo: true
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'number') {
        setFormData(prev => ({
            ...prev,
            [name]: value === '' ? '' : parseFloat(value)
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
        setEnviando(true);

       // Validações ajustadas para aceitar gratuitos
            if (!formData.nome.trim()) {
            setErro('Nome do adicional é obrigatório');
            setEnviando(false);
            return;
            }

            // SÓ VALIDA PREÇO SE NÃO FOR GRATUITO
            if (!formData.gratuito && (!formData.preco || parseFloat(formData.preco) <= 0)) {
            setErro('Preço deve ser maior que zero');
            setEnviando(false);
            return;
            }

        try {
        const response = await fetch('/api/adicionais', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            ...formData,
            preco: parseFloat(formData.preco)
            })
        });

        const data = await response.json();

        if (data.success) {
            router.push('/configuracao/adicionais');
            router.refresh();
        } else {
            setErro(data.error || 'Erro ao criar adicional');
        }
        } catch (error) {
        console.error('Erro:', error);
        setErro('Erro ao conectar com o servidor');
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
                href="/configuracao/adicionais"
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
            >
                <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Novo Adicional</h1>
                <p className="text-gray-600">Adicione uma nova opção extra para produtos</p>
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
                            value={formData.preco}
                            onChange={handleChange}
                            required
                            min="0"
                            step="0.01"
                            placeholder="0,00"
                            disabled={formData.gratuito} // ← DESABILITA QUANDO GRATUITO
                            className={`w-full pl-10 pr-4 py-3 border ${formData.gratuito ? 'bg-gray-100 text-gray-500' : 'bg-white text-gray-900'} border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-70`}
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

                {/* Adicional Gratuito */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center mb-2">
                    <input
                    type="checkbox"
                    id="gratuito"
                    name="gratuito"
                    checked={formData.gratuito}
                    onChange={(e) => {
                        setFormData(prev => ({ 
                        ...prev, 
                        gratuito: e.target.checked,
                        // Se marcar como gratuito, zera o preço
                        preco: e.target.checked ? '0' : prev.preco
                        }));
                    }}
                    className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <label htmlFor="gratuito" className="ml-3 text-sm font-medium text-gray-700">
                    Adicional gratuito
                    </label>
                </div>
                
                {formData.gratuito ? (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded">
                    <p className="text-sm text-green-700">
                        ✅ Este adicional será oferecido sem custo adicional ao cliente.
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                        O preço foi automaticamente definido como R$ 0,00
                    </p>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 mt-1">
                    Desmarque para definir um preço para este adicional
                    </p>
                )}
                </div>

                {/* Status */}
                <div className="flex items-center mb-6">
                <input
                    type="checkbox"
                    id="ativo"
                    name="ativo"
                    checked={formData.ativo}
                    onChange={(e) => setFormData(prev => ({ ...prev, ativo: e.target.checked }))}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="ativo" className="ml-2 text-sm text-gray-700">
                    Adicional ativo (disponível para seleção)
                </label>
                </div>

                {/* Erro */}
                {erro && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                    <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    {erro}
                    </div>
                </div>
                )}
            </div>

            {/* Ações */}
            <div className="flex justify-end space-x-4">
                <Link
                href="/configuracao/adicionais"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 flex items-center"
                >
                <X className="h-5 w-5 mr-2" />
                Cancelar
                </Link>
                <button
                type="submit"
                disabled={enviando || !formData.nome || !formData.preco}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center"
                >
                {enviando ? (
                    <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Criando...
                    </>
                ) : (
                    <>
                    <Save className="h-5 w-5 mr-2" />
                    Criar Adicional
                    </>
                )}
                </button>
            </div>
            </form>
        </div>
        </div>
    );
    }
