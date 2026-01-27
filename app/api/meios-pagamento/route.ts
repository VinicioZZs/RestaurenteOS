// app/api/meios-pagamento/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import MeioPagamento from '@/app/models/MeioPagamento';

export async function GET(request: NextRequest) {
  try {
    const conn = await connectDB();
    
    if (!conn) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Não foi possível conectar ao banco de dados',
          data: []
        },
        { status: 500 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const ativos = searchParams.get('ativos');
    
    let query = {};
    if (ativos === 'true') {
      query = { ativo: true };
    }
    
    const meios = await MeioPagamento.find(query).sort({ ordem: 1, nome: 1 });
    
    return NextResponse.json({
      success: true,
      data: meios,
      count: meios.length
    });
    
  } catch (error: any) {
    console.error('Erro ao buscar meios de pagamento:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        data: []
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const conn = await connectDB();
    
    if (!conn) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Não foi possível conectar ao banco de dados'
        },
        { status: 500 }
      );
    }
    
    const body = await request.json();
    
    // Validar campos obrigatórios
    if (!body.nome) {
      return NextResponse.json(
        { success: false, error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }
    
    // Verificar se já existe um meio com mesmo nome
    const existe = await MeioPagamento.findOne({ 
      nome: body.nome,
      ativo: true 
    });
    
    if (existe) {
      return NextResponse.json(
        { success: false, error: 'Já existe um meio de pagamento com este nome' },
        { status: 409 }
      );
    }
    
    const novoMeio = await MeioPagamento.create({
      ...body,
      criadoEm: new Date(),
      atualizadoEm: new Date()
    });
    
    return NextResponse.json({
      success: true,
      data: novoMeio,
      message: 'Meio de pagamento criado com sucesso'
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Erro ao criar meio de pagamento:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}