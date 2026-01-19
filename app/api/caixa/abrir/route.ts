// app/api/caixa/abrir/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Caixa from '@/models/Caixa';

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Verificar se já existe caixa aberto
    const caixaAberto = await Caixa.findOne({ status: 'aberto' });
    if (caixaAberto) {
      return NextResponse.json({
        success: false,
        error: 'Já existe um caixa aberto'
      }, { status: 400 });
    }
    
    const body = await request.json();
    const { valorInicial, usuario, observacao } = body;
    
    // Validar dados
    if (!valorInicial || valorInicial < 0) {
      return NextResponse.json({
        success: false,
        error: 'Valor inicial inválido'
      }, { status: 400 });
    }
    
    // Criar novo caixa
    const novoCaixa = await Caixa.create({
      status: 'aberto',
      abertura: {
        data: new Date(),
        valorInicial,
        usuario: usuario || 'Operador',
        observacao: observacao || ''
      },
      movimentacoes: [{
        data: new Date(),
        tipo: 'entrada',
        descricao: 'Abertura de caixa',
        valor: valorInicial,
        formaPagamento: 'dinheiro'
      }],
      totalVendas: 0,
      totalEntradas: valorInicial,
      totalSaidas: 0,
      saldoAtual: valorInicial
    });
    
    return NextResponse.json({
      success: true,
      data: novoCaixa.toObject(),
      message: 'Caixa aberto com sucesso'
    });
    
  } catch (error: any) {
    console.error('Erro ao abrir caixa:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }, { status: 500 });
  }
}