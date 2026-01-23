export const dynamic = 'force-dynamic';

// app/api/caixa/resumo/route.ts - Atualizado
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';

// Schema para Caixa (consistente com o outro endpoint)
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

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Buscar caixa aberto
    const caixa = await Caixa.findOne({ status: 'aberto' });
    
    if (!caixa) {
      return NextResponse.json({
        success: false,
        error: 'Nenhum caixa aberto encontrado'
      });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        caixa: {
          ...caixa.toObject(),
          _id: caixa._id.toString()
        },
        resumo: {
          valorInicial: caixa.abertura?.valorInicial || 0,
          totalVendas: caixa.totalVendas || 0,
          totalSaidas: caixa.totalSaidas || 0,
          saldoAtual: caixa.saldoAtual || 0,
          valorEsperado: (caixa.abertura?.valorInicial || 0) + 
                       (caixa.totalVendas || 0) - 
                       (caixa.totalSaidas || 0)
        }
      }
    });
    
  } catch (error: any) {
    console.error('Erro ao buscar resumo do caixa:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno',
        details: error.message 
      },
      { status: 500 }
    );
  }
}