// models/MeioPagamento.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IMeioPagamento extends Document {
  nome: string;
  descricao?: string;
  ativo: boolean;
  tipo: 'dinheiro' | 'cartao' | 'pix' | 'outros' | 'personalizado';
  taxa: number;
  permiteTroco: boolean;
  permiteDividir: boolean;
  icone: string;
  cor: string;
  ordem: number;
  configs?: {
    chavePix?: string;
    banco?: string;
    agencia?: string;
    conta?: string;
    bandeiras?: string[];
  };
  criadoEm: Date;
  atualizadoEm: Date;
}

const MeioPagamentoSchema = new Schema({
  nome: { type: String, required: true },
  descricao: String,
  ativo: { type: Boolean, default: true },
  tipo: { 
    type: String, 
    enum: ['dinheiro', 'cartao', 'pix', 'outros', 'personalizado'],
    default: 'personalizado'
  },
  taxa: { type: Number, default: 0, min: 0, max: 100 },
  permiteTroco: { type: Boolean, default: false },
  permiteDividir: { type: Boolean, default: true },
  icone: { type: String, default: '💳' },
  cor: { type: String, default: '#3B82F6' },
  ordem: { type: Number, default: 99 },
  configs: {
    chavePix: String,
    banco: String,
    agencia: String,
    conta: String,
    bandeiras: [String],
  },
  criadoEm: { type: Date, default: Date.now },
  atualizadoEm: { type: Date, default: Date.now }
});

// Verificar se o modelo já existe para evitar redefinição
const MeioPagamento = mongoose.models.MeioPagamento as mongoose.Model<IMeioPagamento> || 
  mongoose.model<IMeioPagamento>('MeioPagamento', MeioPagamentoSchema);

export default MeioPagamento;