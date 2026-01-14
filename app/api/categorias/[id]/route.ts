// app/api/categorias/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'restaurante';

// GET: Buscar categoria por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    const { id } = params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'ID da categoria inválido' },
        { status: 400 }
      );
    }
    
    await client.connect();
    const db = client.db(DB_NAME);
    
    const categoria = await db.collection('categorias').findOne({
      _id: new ObjectId(id)
    });
    
    if (!categoria) {
      return NextResponse.json(
        { success: false, error: 'Categoria não encontrada' },
        { status: 404 }
      );
    }
    
    const categoriaFormatada = {
        _id: categoria._id.toString(),
        nome: categoria.nome,
        descricao: categoria.descricao || '',
        icone: categoria.icone || '📦',
        imagem: categoria.imagem || '',
        // ADICIONE:
        usaImagem: categoria.usaImagem !== undefined ? categoria.usaImagem : false,
        ordem: categoria.ordem || 1,
        ativo: categoria.ativo !== undefined ? categoria.ativo : true,
        criadoEm: categoria.criadoEm,
        atualizadoEm: categoria.atualizadoEm
        };
    
    return NextResponse.json({
      success: true,
      data: categoriaFormatada
    });
    
  } catch (error) {
    console.error('Erro ao buscar categoria:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar categoria' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

// PUT: Atualizar categoria
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
        { success: false, error: 'ID da categoria inválido' },
        { status: 400 }
      );
    }
    
    if (!body.nome) {
      return NextResponse.json(
        { success: false, error: 'Nome da categoria é obrigatório' },
        { status: 400 }
      );
    }
    
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Verificar se existe outra categoria com mesmo nome
    const categoriaComMesmoNome = await db.collection('categorias').findOne({
      nome: body.nome.trim(),
      _id: { $ne: new ObjectId(id) }
    });
    
    if (categoriaComMesmoNome) {
      return NextResponse.json(
        { success: false, error: 'Outra categoria com este nome já existe' },
        { status: 409 }
      );
    }
    
    const updateData = {
      nome: body.nome.trim(),
      descricao: body.descricao?.trim() || '',
      icone: body.icone || '📦',
      imagem: body.imagem || '',
      ordem: body.ordem || 1,
      ativo: body.ativo !== undefined ? body.ativo : true,
      atualizadoEm: new Date()
    };
    
    const result = await db.collection('categorias').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Categoria não encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Categoria atualizada com sucesso',
      data: {
        _id: id,
        ...updateData
      }
    });
    
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar categoria' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

// DELETE: Excluir categoria
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    const { id } = params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'ID da categoria inválido' },
        { status: 400 }
      );
    }
    
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Verificar se há produtos nesta categoria
    const produtosNaCategoria = await db.collection('produtos').countDocuments({
      categoria: id
    });
    
    if (produtosNaCategoria > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Não é possível excluir categoria com produtos associados',
          produtosCount: produtosNaCategoria
        },
        { status: 400 }
      );
    }
    
    const result = await db.collection('categorias').deleteOne({
      _id: new ObjectId(id)
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Categoria não encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Categoria excluída com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao excluir categoria:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir categoria' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}