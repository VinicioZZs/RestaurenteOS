import mongoose from 'mongoose';

const ItemComandaFechadaSchema = new mongoose.Schema({
  produtoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Produto' },
  nome: String,
  quantidade: Number,
  precoUnitario: Number,
  categoria: String,
  observacao: String
});

const ComandaFechadaSchema = new mongoose.Schema({
  numeroMesa: String,
  nomeMesa: String,
  itens: [ItemComandaFechadaSchema],
  total: Number,
  pagamentos: [{
    forma: String,
    valor: Number,
    taxa: Number,
    troco: Number
  }],
  criadoEm: { type: Date, default: Date.now },
  atualizadoEm: { type: Date, default: Date.now },
  fechadoEm: { type: Date, default: Date.now }
}, {
  collection: 'comandas_fechadas' // ⬅️ ADICIONE ESTA LINHA!
});

export default mongoose.models.ComandaFechada || 
  mongoose.model('ComandaFechada', ComandaFechadaSchema);