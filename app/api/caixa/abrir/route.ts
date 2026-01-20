// app/api/caixa/abrir/route.ts - Adicione inicializações
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';

const caixaSchema = new mongoose.Schema({
  status: String,
  abertura: {
    data: Date,
    valorInicial: Number,
    usuario: String
  },
  fechamento: {
    data: Date,
    valorFinal: Number,
    usuario: String,
    observacao: String,
    valorEsperado: Number,
    diferenca: Number,
    statusDiferenca: String
  },
  vendas: Array,
  totalVendas: { type: Number, default: 0 },
  totalSaidas: { type: Number, default: 0 },
  saldoAtual: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Caixa = mongoose.models.Caixa || mongoose.model('Caixa', caixaSchema);

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { valorInicial, usuario } = await request.json();
    
    // Validar valorInicial
    const valorInicialNumero = parseFloat(valorInicial);
    if (isNaN(valorInicialNumero) || valorInicialNumero < 0) {
      return NextResponse.json(
        { success: false, error: 'Valor inicial inválido' },
        { status: 400 }
      );
    }
    
    // Verificar se já existe caixa aberto
    const caixaAberto = await Caixa.findOne({ status: 'aberto' });
    
    if (caixaAberto) {
      return NextResponse.json(
        { success: false, error: 'Já existe um caixa aberto' },
        { status: 400 }
      );
    }
    
    // Criar novo caixa
    const novoCaixa = new Caixa({
      status: 'aberto',
      abertura: {
        data: new Date(),
        valorInicial: valorInicialNumero,
        usuario
      },
      totalVendas: 0,
      totalSaidas: 0,
      saldoAtual: valorInicialNumero,
      vendas: []
    });
    
    await novoCaixa.save();
    
    return NextResponse.json({
      success: true,
      message: 'Caixa aberto com sucesso',
      data: novoCaixa
    });
    
  } catch (error: any) {
    console.error('Erro ao abrir caixa:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno ao abrir caixa',
        details: error.message 
      },
      { status: 500 }
    );
  }
}