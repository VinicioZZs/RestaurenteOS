// app/api/mesas/buscar-mesa/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Mesa } from '@/lib/models';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const numero = searchParams.get('numero');
    
    if (!numero) {
      return NextResponse.json(
        { success: false, error: 'Parâmetro número é obrigatório' },
        { status: 400 }
      );
    }
    
    // Conectar ao banco
    const conn = await connectDB();
    if (!conn) {
      return NextResponse.json(
        { success: false, error: 'Banco de dados não disponível' },
        { status: 500 }
      );
    }
    
    // Buscar mesa pelo número
    const mesa = await Mesa.findOne({ numero: numero.toString() });
    
    if (!mesa) {
      return NextResponse.json({
        success: false,
        error: 'Mesa não encontrada',
        data: null
      });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        _id: mesa._id.toString(),
        numero: mesa.numero,
        nome: mesa.nome,
        capacidade: mesa.capacidade,
        status: mesa.status,
        criadoEm: mesa.criadoEm,
        atualizadoEm: mesa.atualizadoEm
      }
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao buscar mesa:', error);
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