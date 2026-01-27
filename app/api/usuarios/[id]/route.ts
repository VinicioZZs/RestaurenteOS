    // app/api/usuarios/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

// GET - Buscar usuário por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🔍 GET /api/usuarios/[id] - ID:', params.id);
  
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
  
  try {
    if (!params.id || params.id === 'undefined' || params.id === '[id]') {
      return NextResponse.json(
        { success: false, error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }
    
    await client.connect();
    const db = client.db('restaurante');
    
    console.log('📊 Buscando usuário com ID:', params.id);
    
    const usuario = await db.collection('usuarios').findOne(
      { _id: new ObjectId(params.id) },
      { projection: { senhaHash: 0 } } // Não retornar senha
    );
    
    console.log('✅ Resultado da busca:', usuario ? 'Encontrado' : 'Não encontrado');
    
    if (!usuario) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    const usuarioFormatado = {
      ...usuario,
      _id: usuario._id.toString()
    };
    
    return NextResponse.json({
      success: true,
      data: usuarioFormatado
    });
    
  } catch (error: any) {
    console.error('❌ Erro completo:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao buscar usuário',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('✏️ PUT /api/usuarios/[id] - ID:', params.id);
  
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
  
  try {
    const body = await request.json();
    console.log('📥 Dados recebidos:', body);
    
    if (!params.id) {
      return NextResponse.json(
        { success: false, error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }
    
    await client.connect();
    const db = client.db('restaurante');
    
    // Verificar se usuário existe
    const usuarioExistente = await db.collection('usuarios').findOne({ 
      _id: new ObjectId(params.id) 
    });
    
    if (!usuarioExistente) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    // Preparar dados para atualização
    const updateData: any = {
      nome: body.nome,
      email: body.email,
      role: body.role,
      ativo: body.ativo,
      permissoes: body.permissoes,
      atualizadoEm: new Date().toISOString()
    };
    
    // Se forneceu senha, fazer hash
    if (body.senha) {
      const salt = await bcrypt.genSalt(10);
      updateData.senhaHash = await bcrypt.hash(body.senha, salt);
    }
    
    // Atualizar no banco
    const result = await db.collection('usuarios').updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    );
    
    console.log('✅ Usuário atualizado:', result.modifiedCount, 'documento(s)');
    
    // Buscar usuário atualizado
    const usuarioAtualizado = await db.collection('usuarios').findOne(
      { _id: new ObjectId(params.id) },
      { projection: { senhaHash: 0 } }
    );
    
    return NextResponse.json({
      success: true,
      data: {
        ...usuarioAtualizado,
        _id: usuarioAtualizado?._id.toString()
      },
      message: 'Usuário atualizado com sucesso'
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao atualizar usuário',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

// DELETE - Manter a função de exclusão que você já criou
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
  
  try {
    const id = params.id;
    console.log('🗑️ Tentando excluir usuário ID:', id);
    
    if (!id || id === 'undefined') {
      return NextResponse.json(
        { success: false, error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }
    
    await client.connect();
    const db = client.db('restaurante');
    
    // Verificar se usuário existe
    const usuario = await db.collection('usuarios').findOne({ 
      _id: new ObjectId(id) 
    });
    
    if (!usuario) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    // Excluir usuário
    const result = await db.collection('usuarios').deleteOne({ 
      _id: new ObjectId(id) 
    });
    
    if (result.deletedCount === 1) {
      console.log('✅ Usuário excluído:', usuario.email);
      return NextResponse.json({
        success: true,
        message: 'Usuário excluído com sucesso'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Erro ao excluir usuário' },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('❌ Erro ao excluir usuário:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao excluir usuário',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}