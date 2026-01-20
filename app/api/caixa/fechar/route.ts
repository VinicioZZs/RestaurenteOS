// app/api/caixa/fechar/route.ts - VERSÃO CORRIGIDA
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';

// Schema para Caixa
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
    statusDiferenca: String // 'ok', 'sobra', 'faltou'
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
    
    const { valorFinal, usuario, observacao } = await request.json();
    
    console.log('🔒 Fechando caixa:', { valorFinal, usuario });

    // Validar valorFinal
    const valorFinalNumero = parseFloat(valorFinal);
    if (isNaN(valorFinalNumero) || valorFinalNumero < 0) {
      return NextResponse.json(
        { success: false, error: 'Valor final inválido' },
        { status: 400 }
      );
    }

    // Buscar caixa aberto
    const caixa = await Caixa.findOne({ status: 'aberto' });
    
    if (!caixa) {
      return NextResponse.json(
        { success: false, error: 'Não há caixa aberto para fechar' },
        { status: 404 }
      );
    }

    // Calcular valor esperado (corretamente)
    const valorInicial = caixa.abertura?.valorInicial || 0;
    const totalVendas = caixa.totalVendas || 0;
    const totalSaidas = caixa.totalSaidas || 0;
    
    const valorEsperado = valorInicial + totalVendas - totalSaidas;
    
    // Calcular diferença (corretamente)
    const diferenca = valorFinalNumero - valorEsperado;
    
    // Determinar status da diferença
    let statusDiferenca = 'ok';
    if (Math.abs(diferenca) > 0.01) { // tolerância de 1 centavo
      statusDiferenca = diferenca > 0 ? 'sobra' : 'faltou';
    }

    console.log('📊 Cálculos:', {
      valorInicial,
      totalVendas,
      totalSaidas,
      valorEsperado,
      valorFinal: valorFinalNumero,
      diferenca,
      statusDiferenca
    });

    // Atualizar caixa
    const caixaFechado = await Caixa.findByIdAndUpdate(
      caixa._id,
      {
        $set: {
          status: 'fechado',
          fechamento: {
            data: new Date(),
            valorFinal: valorFinalNumero,
            usuario,
            observacao: observacao || '',
            valorEsperado,
            diferenca,
            statusDiferenca
          },
          updatedAt: new Date()
        }
      },
      { new: true }
    );

    console.log('✅ Caixa fechado com sucesso');

    return NextResponse.json({
      success: true,
      message: 'Caixa fechado com sucesso',
      data: {
        caixa: caixaFechado,
        resumo: {
          valorInicial,
          totalVendas,
          totalSaidas,
          valorEsperado,
          valorFinal: valorFinalNumero,
          diferenca,
          statusDiferenca
        }
      }
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao fechar caixa:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno ao fechar caixa',
        details: error.message 
      },
      { status: 500 }
    );
  }
}