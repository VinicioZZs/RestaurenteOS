// models/Caixa.js
const mongoose = require('mongoose');

const caixaSchema = new mongoose.Schema({
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
    usuario: String,
    observacao: String,
    valorEsperado: Number,
    diferenca: Number,
    statusDiferenca: {
      type: String,
      enum: ['ok', 'divergencia_positiva', 'divergencia_negativa']
    }
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
    mesaId: String
  }],
  totalVendas: Number,
  totalEntradas: Number,
  totalSaidas: Number,
  formasPagamento: [{
    forma: String,
    total: Number,
    quantidade: Number
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Caixa', caixaSchema);