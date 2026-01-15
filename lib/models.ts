// lib/models.ts
import mongoose from 'mongoose';

// Schema para Mesa
const mesaSchema = new mongoose.Schema({
  numero: String,
  nome: String,
  capacidade: { type: Number, default: 4 },
  status: { type: String, default: 'livre' },
  criadoEm: { type: Date, default: Date.now },
  atualizadoEm: { type: Date, default: Date.now }
});

// Schema para Comanda
const comandaSchema = new mongoose.Schema({
  mesaId: String,
  numeroMesa: String,
  itens: [{
    produtoId: String,
    quantidade: Number,
    precoUnitario: Number,
    observacao: String
  }],
  total: { type: Number, default: 0 },
  status: { type: String, default: 'aberta' },
  criadoEm: { type: Date, default: Date.now },
  atualizadoEm: { type: Date, default: Date.now }
});

// Criar ou obter modelos
export const Mesa = mongoose.models.Mesa || mongoose.model('Mesa', mesaSchema);
export const Comanda = mongoose.models.Comanda || mongoose.model('Comanda', comandaSchema);