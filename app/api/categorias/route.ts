// app/api/categorias/route.ts (ATUALIZADO COM IMAGEM)
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, WithId, Document } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'restaurante';

interface CategoriaDocument extends Document {
  nome: string;
  descricao?: string;
  icone?: string;
  imagem?: string;
  usaImagem?: boolean; // Novo campo
  ordem: number;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

interface CategoriaResponse {
  _id: string;
  nome: string;
  descricao?: string;
  icone?: string;
  imagem?: string;
  ordem: number;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

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
    
    const categorias = await db.collection<CategoriaDocument>('categorias')
      .find(query)
      .sort({ ordem: 1, nome: 1 })
      .toArray();
    
    const categoriasFormatadas: CategoriaResponse[] = categorias.map((categoria: WithId<CategoriaDocument>) => ({
  _id: categoria._id.toString(),
  nome: categoria.nome,
  descricao: categoria.descricao,
  icone: categoria.icone,
  imagem: categoria.imagem,
  // ADICIONE ESTA LINHA:
  usaImagem: categoria.usaImagem !== undefined ? categoria.usaImagem : false,
  ordem: categoria.ordem,
  ativo: categoria.ativo,
  criadoEm: categoria.criadoEm,
  atualizadoEm: categoria.atualizadoEm
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

export async function POST(request: NextRequest) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    const body = await request.json();
    
    if (!body.nome) {
      return NextResponse.json(
        { success: false, error: 'Nome da categoria é obrigatório' },
        { status: 400 }
      );
    }
    
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Verificar se categoria já existe
    const categoriaExistente = await db.collection<CategoriaDocument>('categorias').findOne({
      nome: body.nome.trim()
    });
    
    if (categoriaExistente) {
      return NextResponse.json(
        { success: false, error: 'Categoria com este nome já existe' },
        { status: 409 }
      );
    }
    
    // Pegar a última ordem
    const ultimaCategoria = await db.collection<CategoriaDocument>('categorias')
      .find()
      .sort({ ordem: -1 })
      .limit(1)
      .toArray();
    
    const novaOrdem = ultimaCategoria.length > 0 ? ultimaCategoria[0].ordem + 1 : 1;
    
    const novaCategoria: CategoriaDocument = {
        nome: body.nome.trim(),
        descricao: body.descricao?.trim() || '',
        icone: body.icone || '📦',
        imagem: body.imagem || '',
        usaImagem: body.usaImagem !== undefined ? body.usaImagem : false, // Padrão: usa ícone
        ordem: body.ordem || novaOrdem,
        ativo: body.ativo !== undefined ? body.ativo : true,
        criadoEm: new Date(),
        atualizadoEm: new Date()
        };
    
    const result = await db.collection('categorias').insertOne(novaCategoria);
    
    return NextResponse.json({
      success: true,
      message: 'Categoria criada com sucesso',
      data: {
        ...novaCategoria,
        _id: result.insertedId.toString()
      } as CategoriaResponse
    });
    
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar categoria' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}