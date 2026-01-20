// app/api/comandas/fechar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';

// Reutilizar os mesmos schemas do pagamento-parcial para consistência
const comandaSchema = new mongoose.Schema({
  id: String,
  mesaId: String,
  numeroMesa: String,
  itens: Array,
  total: Number,
  status: String,
  atualizadoEm: Date
});

const Comanda = mongoose.models.Comanda || mongoose.model('Comanda', comandaSchema);

// Schema para histórico de comandas fechadas
const comandaFechadaSchema = new mongoose.Schema({
  comandaId: String,
  mesaId: String,
  numeroMesa: String,
  itens: Array,
  pagadores: Array,
  total: Number,
  formasPagamento: Array,
  dataFechamento: Date
});

const ComandaFechada = mongoose.models.ComandaFechada || 
  mongoose.model('ComandaFechada', comandaFechadaSchema);

// Schema para caixa
const caixaSchema = new mongoose.Schema({
  status: String,
  abertura: Object,
  vendas: Array,
  totalVendas: Number,
  saldoAtual: Number
});

const Caixa = mongoose.models.Caixa || mongoose.model('Caixa', caixaSchema);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { comandaId, mesaId, numeroMesa, pagadores, total, formasPagamentoUtilizadas, itens } = body;

    await connectDB();
    const db = mongoose.connection.db;
    if (!db) throw new Error("Banco de dados não conectado");

    // 1. SALVAR NO HISTÓRICO (Igual você já faz)
    const novaComandaFechada = new ComandaFechada({
      comandaId, mesaId, numeroMesa, itens, pagadores, total,
      formasPagamento: formasPagamentoUtilizadas,
      dataFechamento: new Date()
    });
    await novaComandaFechada.save();

    // 2. DELETAR COMANDA ATIVA
    await Comanda.deleteOne({ _id: comandaId });

    // 3. A SOLUÇÃO CORRIGIDA: PADSTART(2, '0')
    const filtros = [];
    
    // Filtro 1: Pelo ID do MongoDB
    if (mesaId && mongoose.Types.ObjectId.isValid(mesaId)) {
      filtros.push({ _id: new mongoose.Types.ObjectId(mesaId) });
    }

    // Filtro 2: Pelo Número (FORMATADO COM 0 NA FRENTE)
    if (numeroMesa) {
      const numFormatado = numeroMesa.toString().padStart(2, '0');
      filtros.push({ numero: numFormatado });
      filtros.push({ numero: numeroMesa.toString() }); // Backup sem zero
    }

    // Executa a deleção na coleção 'mesas' (Plural, como no seu route.ts)
    const resultadoMesa = await db.collection('mesas').deleteMany({
      $or: filtros
    });

    console.log(`✅ Resultado: ${resultadoMesa.deletedCount} mesa(s) removida(s).`);

    // 4. ATUALIZAR CAIXA
    const caixa = await Caixa.findOne({ status: 'aberto' });
    if (caixa) {
      await Caixa.updateOne(
        { _id: caixa._id },
        {
          $push: {
            vendas: { comandaId, valor: total, data: new Date() }
          },
          $inc: { totalVendas: total, saldoAtual: total }
        }
      );
    }

    return NextResponse.json({ 
      success: true, 
      deletado: resultadoMesa.deletedCount > 0 
    });

  return NextResponse.json({ success: true, deletado: resultadoMesa.deletedCount > 0 });

  } catch (error: any) {
    console.error('❌ Erro:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}