// app/models/Caixa.ts
import mongoose from 'mongoose';

const CaixaSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['aberto', 'fechado'],
    default: 'fechado'
  },
  abertura: {
    data: Date,
    valorInicial: Number,
    usuario: String,
    observacao: String,
    contagemNotas: {
      type: Map,
      of: Number,
      default: {}
    }
  },
  fechamento: {
    data: Date,
    valorFinal: Number,
    valorEsperado: Number,
    diferenca: Number,
    statusDiferenca: {
      type: String,
      enum: ['ok', 'sobra', 'falta'],
      default: 'ok'
    },
    usuario: String,
    observacao: String,
    contagemNotas: {
      type: Map,
      of: Number,
      default: {}
    }
  },
  movimentacoes: [{
    data: Date,
    tipo: {
      type: String,
      enum: ['entrada', 'saida', 'venda_balcao', 'venda_comanda']
    },
    descricao: String,
    valor: Number,
    formaPagamento: String,
    comandaId: String,
    mesaId: String,
    balcaoId: String,
    usuario: String,
    detalhes: {
      tipoVenda: {
        type: String,
        enum: ['comanda', 'balcao', 'retirada', 'outro'],
        default: 'comanda'
      },
      itens: [{
        produtoId: String,
        produtoNome: String,
        quantidade: Number,
        precoUnitario: Number,
        total: Number
      }],
      observacao: String
    }
  }],
  totalVendas: {
    type: Number,
    default: 0
  },
  totalVendasComanda: {
    type: Number,
    default: 0
  },
  totalVendasBalcao: {
    type: Number,
    default: 0
  },
  totalEntradas: {
    type: Number,
    default: 0
  },
  totalSaidas: {
    type: Number,
    default: 0
  },
  saldoAtual: {
    type: Number,
    default: 0
  },
  estatisticas: {
    quantidadeVendas: {
      comandas: { type: Number, default: 0 },
      balcao: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    formasPagamento: {
      dinheiro: { type: Number, default: 0 },
      cartao: { type: Number, default: 0 },
      pix: { type: Number, default: 0 },
      outros: { type: Number, default: 0 }
    },
    periodo: {
      inicio: Date,
      fim: Date
    }
  }
}, {
  timestamps: true
});

// Método para adicionar venda de balcão
CaixaSchema.methods.adicionarVendaBalcao = async function(vendaData: any) {
  const movimentacao = {
    data: new Date(),
    tipo: 'venda_balcao' as const,
    descricao: `Venda de Balcão - ${vendaData.itens.length} itens`,
    valor: vendaData.total,
    formaPagamento: vendaData.pagamento?.forma || 'dinheiro',
    balcaoId: vendaData._id || `balcao_${Date.now()}`,
    usuario: vendaData.operador || 'Balcão',
    detalhes: {
      tipoVenda: 'balcao' as const,
      itens: vendaData.itens,
      observacao: 'Venda direta no balcão'
    }
  };

  this.movimentacoes.push(movimentacao);
  
  // Atualizar totais
  this.totalVendas += vendaData.total;
  this.totalVendasBalcao += vendaData.total;
  this.saldoAtual += vendaData.total;
  
  // Atualizar estatísticas
  this.estatisticas.quantidadeVendas.balcao += 1;
  this.estatisticas.quantidadeVendas.total += 1;
  
  const formaPagamento = vendaData.pagamento?.forma?.toLowerCase() || 'dinheiro';
  if (formaPagamento in this.estatisticas.formasPagamento) {
    this.estatisticas.formasPagamento[formaPagamento] += vendaData.total;
  } else {
    this.estatisticas.formasPagamento.outros += vendaData.total;
  }
  
  await this.save();
  return movimentacao;
};

// Método para adicionar venda de comanda
CaixaSchema.methods.adicionarVendaComanda = async function(comandaData: any) {
  const movimentacao = {
    data: new Date(),
    tipo: 'venda_comanda' as const,
    descricao: `Comanda ${comandaData.numeroMesa || comandaData.mesaId} - Fechada`,
    valor: comandaData.total,
    formaPagamento: comandaData.pagamento?.forma || 'dinheiro',
    comandaId: comandaData._id || comandaData.comandaId,
    mesaId: comandaData.mesaId,
    usuario: comandaData.operador || 'Sistema',
    detalhes: {
      tipoVenda: 'comanda' as const,
      itens: comandaData.itens,
      observacao: `Mesa ${comandaData.numeroMesa || comandaData.mesaId}`
    }
  };

  this.movimentacoes.push(movimentacao);
  
  // Atualizar totais
  this.totalVendas += comandaData.total;
  this.totalVendasComanda += comandaData.total;
  this.saldoAtual += comandaData.total;
  
  // Atualizar estatísticas
  this.estatisticas.quantidadeVendas.comandas += 1;
  this.estatisticas.quantidadeVendas.total += 1;
  
  const formaPagamento = comandaData.pagamento?.forma?.toLowerCase() || 'dinheiro';
  if (formaPagamento in this.estatisticas.formasPagamento) {
    this.estatisticas.formasPagamento[formaPagamento] += comandaData.total;
  } else {
    this.estatisticas.formasPagamento.outros += comandaData.total;
  }
  
  await this.save();
  return movimentacao;
};

// Método estático para encontrar caixa aberto
CaixaSchema.statics.findAberto = async function() {
  return await this.findOne({ status: 'aberto' });
};

// Método para verificar se caixa está aberto
CaixaSchema.methods.estaAberto = function() {
  return this.status === 'aberto';
};

// Evitar criar múltiplos modelos
const Caixa = mongoose.models?.Caixa || mongoose.model('Caixa', CaixaSchema);

export default Caixa;