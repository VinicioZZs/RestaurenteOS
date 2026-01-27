// app/api/meios-pagamento/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';
import MeioPagamento from '@/app/models/MeioPagamento';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Validar se o ID é um ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }
    
    const meio = await MeioPagamento.findById(params.id);
    
    if (!meio) {
      return NextResponse.json(
        { success: false, error: 'Meio de pagamento não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: meio
    });
    
  } catch (error: any) {
    console.error('Erro ao buscar meio de pagamento:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Validar se o ID é um ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Verificar se o meio de pagamento existe
    const meioExistente = await MeioPagamento.findById(params.id);
    if (!meioExistente) {
      return NextResponse.json(
        { success: false, error: 'Meio de pagamento não encontrado' },
        { status: 404 }
      );
    }
    
    // Se estiver alterando o nome, verificar se já existe outro com o mesmo nome
    if (body.nome && body.nome !== meioExistente.nome) {
      const existeComMesmoNome = await MeioPagamento.findOne({
        nome: body.nome,
        _id: { $ne: params.id }
      });
      
      if (existeComMesmoNome) {
        return NextResponse.json(
          { success: false, error: 'Já existe outro meio de pagamento com este nome' },
          { status: 409 }
        );
      }
    }
    
    const meioAtualizado = await MeioPagamento.findByIdAndUpdate(
      params.id,
      { 
        ...body, 
        atualizadoEm: new Date() 
      },
      { new: true, runValidators: true }
    );
    
    return NextResponse.json({
      success: true,
      data: meioAtualizado,
      message: 'Meio de pagamento atualizado com sucesso'
    });
    
  } catch (error: any) {
    console.error('Erro ao atualizar meio de pagamento:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Validar se o ID é um ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }
    
    const meioExistente = await MeioPagamento.findById(params.id);
    if (!meioExistente) {
      return NextResponse.json(
        { success: false, error: 'Meio de pagamento não encontrado' },
        { status: 404 }
      );
    }
    
    await MeioPagamento.findByIdAndDelete(params.id);
    
    return NextResponse.json({
      success: true,
      message: 'Meio de pagamento excluído com sucesso'
    });
    
  } catch (error: any) {
    console.error('Erro ao excluir meio de pagamento:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}