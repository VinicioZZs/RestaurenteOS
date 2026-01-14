// app/api/produtos/[id]/route.ts - API COMPLETA
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'restaurante';

// GET - Buscar produto por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    const { id } = params;
    
    console.log('🔍 Buscando produto ID:', id);
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'ID do produto inválido' },
        { status: 400 }
      );
    }
    
    await client.connect();
    const db = client.db(DB_NAME);
    
    const produto = await db.collection('produtos').findOne({
      _id: new ObjectId(id)
    });
    
    if (!produto) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      );
    }
    
    // Formatar resposta
    const produtoFormatado = {
      _id: produto._id.toString(),
      nome: produto.nome,
      descricao: produto.descricao || '',
      codigo: produto.codigo || '',
      preco: produto.preco,
      precoVenda: produto.precoVenda || produto.preco,
      precoCusto: produto.precoCusto || 0,
      categoria: produto.categoria,
      imagem: produto.imagem || '',
      estoqueAtual: produto.estoqueAtual || 0,
      estoqueMinimo: produto.estoqueMinimo || 0,
      controlarEstoque: produto.controlarEstoque || false,
      adicionais: produto.adicionais || [],
      unidadeMedida: produto.unidadeMedida || 'unidade',
      peso: produto.peso || 0,
      volume: produto.volume || 0,
      ativo: produto.ativo !== undefined ? produto.ativo : true,
      tags: produto.tags || [],
      criadoEm: produto.criadoEm,
      atualizadoEm: produto.atualizadoEm
    };
    
    return NextResponse.json({
      success: true,
      data: produtoFormatado
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao buscar produto:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar produto' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

// PUT - Atualizar produto
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    const { id } = params;
    const body = await request.json();
    
    console.log('✏️ Atualizando produto ID:', id);
    console.log('📥 Dados recebidos:', body);
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'ID do produto inválido' },
        { status: 400 }
      );
    }
    
    // Validação
    const precoVenda = body.precoVenda || body.preco;
    if (!body.nome || !precoVenda || !body.categoria) {
      return NextResponse.json(
        { success: false, error: 'Nome, preço e categoria são obrigatórios' },
        { status: 400 }
      );
    }
    
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Verificar se produto existe
    const produtoExistente = await db.collection('produtos').findOne({
      _id: new ObjectId(id)
    });
    
    if (!produtoExistente) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se outro produto já tem este nome
    const produtoComMesmoNome = await db.collection('produtos').findOne({
      nome: body.nome.trim(),
      _id: { $ne: new ObjectId(id) }
    });
    
    if (produtoComMesmoNome) {
      return NextResponse.json(
        { success: false, error: 'Outro produto com este nome já existe' },
        { status: 409 }
      );
    }
    
    const updateData = {
      nome: body.nome.trim(),
      descricao: body.descricao?.trim() || '',
      preco: parseFloat(precoVenda),
      precoVenda: parseFloat(precoVenda),
      precoCusto: body.precoCusto ? parseFloat(body.precoCusto) : 0,
      categoria: body.categoria,
      imagem: body.imagem || '',
      estoqueAtual: parseInt(body.estoqueAtual) || 0,
      estoqueMinimo: parseInt(body.estoqueMinimo) || 0,
      controlarEstoque: body.controlarEstoque || false,
      adicionais: body.adicionais || [],
      unidadeMedida: body.unidadeMedida || 'unidade',
      peso: body.peso ? parseFloat(body.peso) : 0,
      volume: body.volume ? parseFloat(body.volume) : 0,
      ativo: body.ativo !== undefined ? body.ativo : true,
      tags: body.tags || [],
      atualizadoEm: new Date()
    };
    
    const result = await db.collection('produtos').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Produto atualizado com sucesso',
      data: {
        _id: id,
        ...updateData
      }
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao atualizar produto:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar produto' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

// DELETE - Excluir produto
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    const { id } = params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'ID do produto inválido' },
        { status: 400 }
      );
    }
    
    await client.connect();
    const db = client.db(DB_NAME);
    
    const result = await db.collection('produtos').deleteOne({
      _id: new ObjectId(id)
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Produto não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Produto excluído com sucesso'
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao excluir produto:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir produto' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}