// app/api/categorias/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'restaurante';

// GET - Listar categorias
export async function GET(request: NextRequest) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    
    const { searchParams } = new URL(request.url);
    const ativas = searchParams.get('ativas');
    
    let query: any = {};
    
    if (ativas === 'true') {
      query.ativo = true;
    }
    
    const categorias = await db.collection('categorias')
      .find(query)
      .sort({ ordem: 1, nome: 1 }) // Ordenar por ordem primeiro
      .toArray();
    
    const categoriasFormatadas = categorias.map(categoria => ({
      _id: categoria._id.toString(),
      nome: categoria.nome,
      descricao: categoria.descricao || '',
      icone: categoria.icone || '📦',
      imagem: categoria.imagem || '',
      usaImagem: categoria.usaImagem || false,
      ordem: categoria.ordem || 999,
      ativo: categoria.ativo !== false,
      criadoEm: categoria.criadoEm || new Date().toISOString(),
      atualizadoEm: categoria.atualizadoEm || categoria.criadoEm || new Date().toISOString()
    }));
    
    return NextResponse.json({
      success: true,
      data: categoriasFormatadas
    });
    
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar categorias' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

// POST - Criar nova categoria
export async function POST(request: NextRequest) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    
    const body = await request.json();
    
    console.log('Dados recebidos para criar categoria:', body);
    
    // Validação básica
    if (!body.nome || body.nome.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }
    
    // Verificar se já existe categoria com mesmo nome
    const categoriaExistente = await db.collection('categorias')
      .findOne({ nome: body.nome.trim() });
    
    if (categoriaExistente) {
      return NextResponse.json(
        { success: false, error: 'Já existe uma categoria com este nome' },
        { status: 400 }
      );
    }
    
    // Preparar dados da nova categoria
    const novaCategoria = {
      nome: body.nome.trim(),
      descricao: body.descricao?.trim() || '',
      icone: body.icone || '📦',
      imagem: body.imagem || '',
      usaImagem: body.usaImagem || false,
      ordem: body.ordem ? parseInt(body.ordem) : 999,
      ativo: body.ativo !== undefined ? body.ativo : true,
      criadoEm: new Date(),
      atualizadoEm: new Date()
    };
    
    console.log('Inserindo categoria:', novaCategoria);
    
    // Inserir no banco de dados
    const result = await db.collection('categorias').insertOne(novaCategoria);
    
    // Obter a categoria criada com o ID
    const categoriaCriada = await db.collection('categorias').findOne({
      _id: result.insertedId
    });
    
    return NextResponse.json({
      success: true,
      data: {
        _id: categoriaCriada?._id.toString(),
        ...novaCategoria,
        criadoEm: categoriaCriada?.criadoEm,
        atualizadoEm: categoriaCriada?.atualizadoEm
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor ao criar categoria',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

// PUT - Atualizar categoria
export async function PUT(request: NextRequest) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Extrair ID da URL (ex: /api/categorias/12345)
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Verificar se a categoria existe
    const categoriaExistente = await db.collection('categorias').findOne({
      _id: new ObjectId(id)
    });
    
    if (!categoriaExistente) {
      return NextResponse.json(
        { success: false, error: 'Categoria não encontrada' },
        { status: 404 }
      );
    }
    
    // Preparar atualização
    const updateData: any = {
      atualizadoEm: new Date()
    };
    
    // Adicionar campos que foram enviados
    if (body.nome !== undefined) updateData.nome = body.nome.trim();
    if (body.descricao !== undefined) updateData.descricao = body.descricao.trim();
    if (body.icone !== undefined) updateData.icone = body.icone;
    if (body.imagem !== undefined) updateData.imagem = body.imagem;
    if (body.usaImagem !== undefined) updateData.usaImagem = body.usaImagem;
    if (body.ordem !== undefined) updateData.ordem = parseInt(body.ordem);
    if (body.ativo !== undefined) updateData.ativo = body.ativo;
    
    // Atualizar no banco
    await db.collection('categorias').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    // Obter categoria atualizada
    const categoriaAtualizada = await db.collection('categorias').findOne({
      _id: new ObjectId(id)
    });
    
    return NextResponse.json({
      success: true,
      data: {
        _id: categoriaAtualizada?._id.toString(),
        nome: categoriaAtualizada?.nome,
        descricao: categoriaAtualizada?.descricao || '',
        icone: categoriaAtualizada?.icone || '📦',
        imagem: categoriaAtualizada?.imagem || '',
        usaImagem: categoriaAtualizada?.usaImagem || false,
        ordem: categoriaAtualizada?.ordem || 999,
        ativo: categoriaAtualizada?.ativo !== false,
        criadoEm: categoriaAtualizada?.criadoEm,
        atualizadoEm: categoriaAtualizada?.atualizadoEm
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

// DELETE - Excluir categoria
export async function DELETE(request: NextRequest) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Extrair ID da URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'ID inválido' },
        { status: 400 }
      );
    }
    
    // Verificar se a categoria existe
    const categoriaExistente = await db.collection('categorias').findOne({
      _id: new ObjectId(id)
    });
    
    if (!categoriaExistente) {
      return NextResponse.json(
        { success: false, error: 'Categoria não encontrada' },
        { status: 404 }
      );
    }
    
    // Verificar se há produtos usando esta categoria
    const produtosComCategoria = await db.collection('produtos').countDocuments({
      categoria: categoriaExistente.nome
    });
    
    if (produtosComCategoria > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Não é possível excluir esta categoria. Existem ${produtosComCategoria} produtos vinculados a ela.`
        },
        { status: 400 }
      );
    }
    
    // Excluir categoria
    await db.collection('categorias').deleteOne({
      _id: new ObjectId(id)
    });
    
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