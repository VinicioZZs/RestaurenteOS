// app/api/adicionais/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'restaurante';

// GET: Buscar adicional por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    const { id } = params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'ID do adicional inválido' },
        { status: 400 }
      );
    }
    
    await client.connect();
    const db = client.db(DB_NAME);
    
    const adicional = await db.collection('adicionais').findOne({
      _id: new ObjectId(id)
    });
    
    if (!adicional) {
      return NextResponse.json(
        { success: false, error: 'Adicional não encontrado' },
        { status: 404 }
      );
    }
    
    const adicionalFormatado = {
      _id: adicional._id.toString(),
      nome: adicional.nome,
      descricao: adicional.descricao || '',
      preco: adicional.preco,
      categoria: adicional.categoria || 'Adicional',
      ativo: adicional.ativo !== undefined ? adicional.ativo : true,
      criadoEm: adicional.criadoEm,
      atualizadoEm: adicional.atualizadoEm
    };
    
    return NextResponse.json({
      success: true,
      data: adicionalFormatado
    });
    
  } catch (error) {
    console.error('Erro ao buscar adicional:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar adicional' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

// PUT: Atualizar adicional
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    const { id } = params;
    const body = await request.json();
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'ID do adicional inválido' },
        { status: 400 }
      );
    }
    
    if (!body.nome || !body.preco) {
      return NextResponse.json(
        { success: false, error: 'Nome e preço são obrigatórios' },
        { status: 400 }
      );
    }
    
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Verificar se existe outro adicional com mesmo nome
    const adicionalComMesmoNome = await db.collection('adicionais').findOne({
      nome: body.nome.trim(),
      _id: { $ne: new ObjectId(id) }
    });
    
    if (adicionalComMesmoNome) {
      return NextResponse.json(
        { success: false, error: 'Outro adicional com este nome já existe' },
        { status: 409 }
      );
    }
    
    const updateData = {
    nome: body.nome.trim(),
    descricao: body.descricao?.trim() || '',
    preco: parseFloat(body.preco),
    categoria: body.categoria || 'Adicional',
    gratuito: body.gratuito !== undefined ? body.gratuito : false, // ← NOVO
    ativo: body.ativo !== undefined ? body.ativo : true,
    atualizadoEm: new Date()
    };
    
    const result = await db.collection('adicionais').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Adicional não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Adicional atualizado com sucesso',
      data: {
        _id: id,
        ...updateData
      }
    });
    
  } catch (error) {
    console.error('Erro ao atualizar adicional:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar adicional' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

// DELETE: Excluir adicional
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    const { id } = params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'ID do adicional inválido' },
        { status: 400 }
      );
    }
    
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Verificar se há produtos usando este adicional
    const produtosComAdicional = await db.collection('produtos').findOne({
      adicionais: id
    });
    
    if (produtosComAdicional) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Não é possível excluir adicional utilizado por produtos',
          produto: produtosComAdicional.nome
        },
        { status: 400 }
      );
    }
    
    const result = await db.collection('adicionais').deleteOne({
      _id: new ObjectId(id)
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Adicional não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Adicional excluído com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao excluir adicional:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir adicional' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}