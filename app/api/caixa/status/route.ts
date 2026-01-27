// app/api/caixa/status/route.ts - CORRIGIDO
export const dynamic = 'force-dynamic';

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
        success: false,
        data: null,
        error: 'Nenhum caixa aberto encontrado'
      });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        status: 'aberto',
        _id: caixa._id.toString(),
        abertura: caixa.abertura,
        fechamento: caixa.fechamento,
        totalVendas: caixa.totalVendas || 0,
        totalSaidas: caixa.totalSaidas || 0,
        saldoAtual: caixa.saldoAtual || 0,
        vendas: caixa.vendas || [],
        createdAt: caixa.createdAt,
        updatedAt: caixa.updatedAt
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