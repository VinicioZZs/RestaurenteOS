export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    console.log('✅ MongoDB conectado');
    
    // Tenta várias coleções possíveis
    const Caixa = mongoose.models.Caixa || mongoose.model('Caixa', new mongoose.Schema({
      status: String,
      abertura: Object,
      createdAt: Date
    }));
    
    const todosCaixas = await Caixa.find({});
    
    return NextResponse.json({
      sucesso: true,
      total: todosCaixas.length,
      caixas: todosCaixas.map(c => ({
        id: c._id?.toString() || 'sem-id',
        status: c.status || 'sem-status',
        valorInicial: c.abertura?.valorInicial || 0,
        data: c.abertura?.data || 'sem-data',
        usuario: c.abertura?.usuario || 'sem-usuario',
        criadoEm: c.createdAt || 'sem-data'
      }))
    });
    
  } catch (error: any) {
    console.error('❌ ERRO:', error);
    return NextResponse.json({
      sucesso: false,
      erro: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}