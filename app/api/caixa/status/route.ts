// app/api/caixa/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Caixa from '@/models/Caixa';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Buscar caixa ativo ou criar um fechado se não existir
    let caixa = await Caixa.findOne({ status: 'aberto' }).sort({ createdAt: -1 });
    
    if (!caixa) {
      // Verificar se existe algum caixa fechado recentemente
      const ultimoFechado = await Caixa.findOne({ status: 'fechado' }).sort({ 'fechamento.data': -1 });
      
      if (ultimoFechado) {
        caixa = ultimoFechado;
      } else {
        // Criar caixa fechado padrão se não existir nenhum
        caixa = await Caixa.create({
          status: 'fechado',
          totalVendas: 0,
          totalEntradas: 0,
          totalSaidas: 0,
          saldoAtual: 0
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      data: caixa.toObject()
    });
    
  } catch (error: any) {
    console.error('Erro ao buscar status do caixa:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 });
  }
}