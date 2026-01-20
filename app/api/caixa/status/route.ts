// app/api/caixa/status/route.ts - ATUALIZADO
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';

const caixaSchema = new mongoose.Schema({
  status: String,
  abertura: Object,
  fechamento: Object,
  vendas: Array,
  totalVendas: Number,
  totalSaidas: Number,
  saldoAtual: Number,
  createdAt: Date,
  updatedAt: Date
});

const Caixa = mongoose.models.Caixa || 
  mongoose.model('Caixa', caixaSchema);

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const caixa = await Caixa.findOne({ status: 'aberto' });
    
    if (!caixa) {
      return NextResponse.json({
        success: true,
        data: {
          status: 'fechado',
          saldoAtual: 0,
          totalVendas: 0,
          totalSaidas: 0,
          vendas: []
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...caixa.toObject(),
        _id: caixa._id.toString()
      }
    });
    
  } catch (error: any) {
    console.error('Erro ao buscar status do caixa:', error);
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