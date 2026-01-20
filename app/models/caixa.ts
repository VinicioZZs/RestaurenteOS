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
    observacao: String
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
    observacao: String
  },
  movimentacoes: [{
    data: Date,
    tipo: {
      type: String,
      enum: ['entrada', 'saida']
    },
    descricao: String,
    valor: Number,
    formaPagamento: String,
    comandaId: String,
    mesaId: String,
    usuario: String
  }],
  totalVendas: {
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
  }
}, {
  timestamps: true
});

// Evitar criar múltiplos modelos
const Caixa = mongoose.models?.Caixa || mongoose.model('Caixa', CaixaSchema);
export default Caixa;