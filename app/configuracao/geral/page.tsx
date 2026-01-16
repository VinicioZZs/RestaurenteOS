// app/configuracao/geral/page.tsx - CONFIGURAÇÕES GERAIS DO SISTEMA
'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  AlertTriangle,
  Receipt,
  Package,
  Bell,
  CheckCircle,
  Palette,
  Eye,
  EyeOff,
  Monitor,
  Moon,
  Sun
} from 'lucide-react';

interface ConfiguracoesSistema {
  // Preset da comanda
  presetComanda: 'comanda' | 'ficha' | 'mesa' | 'pedido';
  mostrarGarcom: boolean;
  mostrarMesaNumero: boolean;
  
  // Controle de estoque
  controleEstoqueGlobal: boolean;
  mostrarAlertaEstoque: boolean;
  simboloEstoqueMinimo: string;
  corAlertaEstoque: string;
  
  // Aparência geral
  temaSistema: 'claro' | 'escuro' | 'auto';
  corPrimaria: string;
  corSecundaria: string;
  
  // Comportamento
  tempoAutoSave: number;
  mostrarDicas: boolean;
  confirmarExclusao: boolean;
  
  // Timestamps
  atualizadoEm: string;
  atualizadoPor: string;
}

const presetsComanda = [
  { id: 'comanda', nome: 'Comanda', descricao: 'COM001 - Mesa 01', icone: '📋' },
  { id: 'ficha', nome: 'Ficha', descricao: 'FICHA #042', icone: '📄' },
  { id: 'mesa', nome: 'Mesa', descricao: 'MESA 05', icone: '🪑' },
  { id: 'pedido', nome: 'Pedido', descricao: 'PEDIDO #123', icone: '📝' }
];

const simbolosEstoque = [
  { id: 'exclamacao', simbolo: '⚠️', descricao: 'Exclamação' },
  { id: 'alerta', simbolo: '🚨', descricao: 'Alerta' },
  { id: 'baixo', simbolo: '📉', descricao: 'Seta para baixo' },
  { id: 'atenção', simbolo: '🔔', descricao: 'Sino' },
  { id: 'info', simbolo: 'ℹ️', descricao: 'Informação' }
];

export default function ConfiguracoesGeraisPage() {
  const [configuracoes, setConfiguracoes] = useState<ConfiguracoesSistema>({
    // Valores padrão
    presetComanda: 'comanda',
    mostrarGarcom: true,
    mostrarMesaNumero: true,
    
    controleEstoqueGlobal: false,
    mostrarAlertaEstoque: true,
    simboloEstoqueMinimo: '⚠️',
    corAlertaEstoque: '#f59e0b',
    
    temaSistema: 'claro',
    corPrimaria: '#2563eb',
    corSecundaria: '#7c3aed',
    
    tempoAutoSave: 30,
    mostrarDicas: true,
    confirmarExclusao: true,
    
    atualizadoEm: new Date().toISOString(),
    atualizadoPor: 'Admin'
  });

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro', texto: string } | null>(null);

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  const carregarConfiguracoes = async () => {
    try {
      setCarregando(true);
      const response = await fetch('/api/configuracoes');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setConfiguracoes(data.data);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      // Carregar do localStorage como fallback
      const salvas = localStorage.getItem('config_sistema');
      if (salvas) {
        setConfiguracoes(JSON.parse(salvas));
      }
    } finally {
      setCarregando(false);
    }
  };

  const salvarConfiguracoes = async () => {
  try {
    setSalvando(true);
    setMensagem(null);
    
    console.log('📤 Enviando configurações:', configuracoes);
    
    const response = await fetch('/api/configuracoes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...configuracoes,
        atualizadoEm: new Date().toISOString(),
        atualizadoPor: 'Usuário Atual'
      })
    });
    
    console.log('📥 Resposta da API:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    });
    
    // ⚠️ IMPORTANTE: Primeiro pegar o texto da resposta
    const responseText = await response.text();
    console.log('📄 Conteúdo da resposta:', responseText);
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Erro ao parsear JSON:', parseError);
      throw new Error(`Resposta inválida: ${responseText.substring(0, 100)}`);
    }
    
    if (!response.ok) {
      // Usar a mensagem de erro da API se existir
      throw new Error(data.error || `Erro ${response.status}: ${response.statusText}`);
    }
    
    if (!data.success) {
      throw new Error(data.error || 'Erro desconhecido na API');
    }
    
    // Sucesso!
    setMensagem({
      tipo: 'sucesso',
      texto: 'Configurações salvas com sucesso!'
    });
    
    // Atualizar localStorage para efeito imediato
    localStorage.setItem('config_sistema', JSON.stringify(configuracoes));
    
    // Disparar evento para outros componentes
    window.dispatchEvent(new CustomEvent('config-atualizada', {
      detail: configuracoes
    }));
    
    // Recarregar após 2 segundos (opcional)
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
  } catch (error: any) {
    console.error('❌ Erro completo ao salvar:', error);
    setMensagem({
      tipo: 'erro',
      texto: error.message || 'Erro ao salvar configurações'
    });
  } finally {
    setSalvando(false);
  }
};

  const resetarPadrao = () => {
    if (confirm('Restaurar configurações padrão? Suas alterações serão perdidas.')) {
      setConfiguracoes({
        presetComanda: 'comanda',
        mostrarGarcom: true,
        mostrarMesaNumero: true,
        controleEstoqueGlobal: false,
        mostrarAlertaEstoque: true,
        simboloEstoqueMinimo: '⚠️',
        corAlertaEstoque: '#f59e0b',
        temaSistema: 'claro',
        corPrimaria: '#2563eb',
        corSecundaria: '#7c3aed',
        tempoAutoSave: 30,
        mostrarDicas: true,
        confirmarExclusao: true,
        atualizadoEm: new Date().toISOString(),
        atualizadoPor: 'Sistema'
      });
    }
  };

  const atualizarConfiguracao = (campo: keyof ConfiguracoesSistema, valor: any) => {
    setConfiguracoes(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  if (carregando) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div>
          <div className="flex items-center mb-2">
            <Settings className="h-8 w-8 text-gray-700 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Configurações Gerais</h1>
          </div>
          <p className="text-gray-600">
            Personalize o comportamento e aparência do sistema
          </p>
        </div>
        
        <div className="mt-4 lg:mt-0 flex items-center gap-3">
          <button
            onClick={resetarPadrao}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Restaurar Padrão
          </button>
          <button
            onClick={salvarConfiguracoes}
            disabled={salvando}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center"
          >
            {salvando ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Salvar Configurações
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mensagem de status */}
      {mensagem && (
        <div className={`mb-6 p-4 rounded-lg ${
          mensagem.tipo === 'sucesso' 
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <div className="flex items-center">
            {mensagem.tipo === 'sucesso' ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <AlertTriangle className="h-5 w-5 mr-2" />
            )}
            <span>{mensagem.texto}</span>
          </div>
        </div>
      )}

      {/* Grid de configurações */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1: Preset da Comanda */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card Preset da Comanda */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Receipt className="h-5 w-5 mr-2 text-blue-600" />
              Preset da Comanda
            </h2>
            
            <p className="text-gray-600 mb-6 text-sm">
              Escolha como o sistema irá identificar as comandas na interface.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {presetsComanda.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => atualizarConfiguracao('presetComanda', preset.id)}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                    configuracoes.presetComanda === preset.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-2xl mb-2">{preset.icone}</span>
                  <span className="font-medium text-gray-900">{preset.nome}</span>
                  <span className="text-xs text-gray-500 mt-1">{preset.descricao}</span>
                </button>
              ))}
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900">Mostrar nome do garçom</span>
                  <p className="text-sm text-gray-500">Exibe "Garçom: João" no header</p>
                </div>
                <button
                  onClick={() => atualizarConfiguracao('mostrarGarcom', !configuracoes.mostrarGarcom)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    configuracoes.mostrarGarcom ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    configuracoes.mostrarGarcom ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900">Mostrar número da mesa</span>
                  <p className="text-sm text-gray-500">Exibe o número ao lado do nome</p>
                </div>
                <button
                  onClick={() => atualizarConfiguracao('mostrarMesaNumero', !configuracoes.mostrarMesaNumero)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    configuracoes.mostrarMesaNumero ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    configuracoes.mostrarMesaNumero ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Card Controle de Estoque */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Package className="h-5 w-5 mr-2 text-green-600" />
              Controle de Estoque
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900">Ativar controle geral de estoque</span>
                  <p className="text-sm text-gray-500">Mostra alertas quando produtos estão baixos</p>
                </div>
                <button
                  onClick={() => atualizarConfiguracao('controleEstoqueGlobal', !configuracoes.controleEstoqueGlobal)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    configuracoes.controleEstoqueGlobal ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    configuracoes.controleEstoqueGlobal ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              
              {configuracoes.controleEstoqueGlobal && (
                <>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <span className="font-medium text-gray-900">Mostrar alertas de estoque</span>
                      <p className="text-sm text-gray-500">Exibe símbolos na comanda</p>
                    </div>
                    <button
                      onClick={() => atualizarConfiguracao('mostrarAlertaEstoque', !configuracoes.mostrarAlertaEstoque)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        configuracoes.mostrarAlertaEstoque ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        configuracoes.mostrarAlertaEstoque ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Símbolo para estoque mínimo
                    </label>
                    <div className="flex gap-2">
                      {simbolosEstoque.map((simbolo) => (
                        <button
                          key={simbolo.id}
                          onClick={() => atualizarConfiguracao('simboloEstoqueMinimo', simbolo.simbolo)}
                          className={`p-3 rounded-lg border-2 ${
                            configuracoes.simboloEstoqueMinimo === simbolo.simbolo
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="text-xl">{simbolo.simbolo}</span>
                          <p className="text-xs text-gray-500 mt-1">{simbolo.descricao}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cor do alerta
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="color"
                        value={configuracoes.corAlertaEstoque}
                        onChange={(e) => atualizarConfiguracao('corAlertaEstoque', e.target.value)}
                        className="w-12 h-12 rounded-lg cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="p-3 rounded-lg border" style={{ backgroundColor: configuracoes.corAlertaEstoque + '20' }}>
                          <span className="font-medium" style={{ color: configuracoes.corAlertaEstoque }}>
                            Exemplo de alerta: Produto com estoque baixo
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Cor atual: {configuracoes.corAlertaEstoque}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Coluna 2: Aparência e Comportamento */}
        <div className="space-y-6">
          {/* Card Aparência */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Palette className="h-5 w-5 mr-2 text-purple-600" />
              Aparência
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tema do sistema
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'claro', nome: 'Claro', icone: Sun },
                    { id: 'escuro', nome: 'Escuro', icone: Moon },
                    { id: 'auto', nome: 'Auto', icone: Monitor }
                  ].map((tema) => {
                    const Icon = tema.icone;
                    return (
                      <button
                        key={tema.id}
                        onClick={() => atualizarConfiguracao('temaSistema', tema.id)}
                        className={`p-3 rounded-lg border-2 flex flex-col items-center ${
                          configuracoes.temaSistema === tema.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="h-5 w-5 mb-1" />
                        <span className="text-sm font-medium">{tema.nome}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cores principais
                </label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">Primária:</span>
                    <input
                      type="color"
                      value={configuracoes.corPrimaria}
                      onChange={(e) => atualizarConfiguracao('corPrimaria', e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                    <span className="text-sm font-mono">{configuracoes.corPrimaria}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">Secundária:</span>
                    <input
                      type="color"
                      value={configuracoes.corSecundaria}
                      onChange={(e) => atualizarConfiguracao('corSecundaria', e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                    <span className="text-sm font-mono">{configuracoes.corSecundaria}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card Comportamento */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2 text-gray-600" />
              Comportamento
            </h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Auto-save (segundos)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="5"
                    max="120"
                    step="5"
                    value={configuracoes.tempoAutoSave}
                    onChange={(e) => atualizarConfiguracao('tempoAutoSave', parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="font-medium min-w-[40px]">{configuracoes.tempoAutoSave}s</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900">Mostrar dicas</span>
                  <p className="text-sm text-gray-500">Dicas e tutoriais para novos usuários</p>
                </div>
                <button
                  onClick={() => atualizarConfiguracao('mostrarDicas', !configuracoes.mostrarDicas)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    configuracoes.mostrarDicas ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    configuracoes.mostrarDicas ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900">Confirmar exclusões</span>
                  <p className="text-sm text-gray-500">Solicitar confirmação antes de excluir</p>
                </div>
                <button
                  onClick={() => atualizarConfiguracao('confirmarExclusao', !configuracoes.confirmarExclusao)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    configuracoes.confirmarExclusao ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    configuracoes.confirmarExclusao ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Card Informações */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Bell className="h-5 w-5 mr-2 text-gray-600" />
              Informações do Sistema
            </h2>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Última atualização:</span>
                <span className="font-medium">
                  {new Date(configuracoes.atualizadoEm).toLocaleDateString('pt-BR')}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Atualizado por:</span>
                <span className="font-medium">{configuracoes.atualizadoPor}</span>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Versão:</span>
                  <span className="font-bold text-blue-600">RestauranteOS v2.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Footer */}
      <div className="mt-8 p-6 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold mb-2">Prévia das Configurações</h3>
            <p className="text-gray-300 text-sm">
              Sistema configurado como: <span className="font-bold capitalize">{configuracoes.presetComanda}</span>
              {configuracoes.controleEstoqueGlobal && (
                <span className="ml-4">
                  <AlertTriangle className="inline h-4 w-4 mr-1" />
                  Controle de estoque ativo
                </span>
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded-full text-sm ${
              configuracoes.temaSistema === 'claro' ? 'bg-white text-gray-900' :
              configuracoes.temaSistema === 'escuro' ? 'bg-gray-700 text-white' :
              'bg-gradient-to-r from-white to-gray-300 text-gray-900'
            }`}>
              {configuracoes.temaSistema === 'claro' ? '☀️ Tema Claro' :
               configuracoes.temaSistema === 'escuro' ? '🌙 Tema Escuro' : '🔄 Tema Auto'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}