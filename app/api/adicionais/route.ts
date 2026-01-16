// app/api/adicionais/route.ts - ATUALIZADA COM FILTRO POR IDs
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, WithId, Document, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'restaurante';

interface AdicionalDocument extends Document {
  nome: string;
  descricao?: string;
  preco: number;
  categoria: string;
  gratuito: boolean;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

interface AdicionalResponse {
  _id: string;
  nome: string;
  descricao?: string;
  preco: number;
  categoria: string;
  gratuito: boolean;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
}

// ✅ GET ATUALIZADO: Suporta filtro por IDs específicos
export async function GET(request: NextRequest) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    
    const { searchParams } = new URL(request.url);
    const ativos = searchParams.get('ativos');
    const ids = searchParams.get('ids'); // ✅ NOVO: Filtro por IDs
    
    console.log('🔍 Buscando adicionais com filtros:', { ativos, ids });
    
    let query: any = {};
    
    // Filtro por status ativo
    if (ativos === 'true') {
      query.ativo = true;
    }
    
    // ✅ NOVO: Filtro por IDs específicos
    if (ids) {
      try {
        const idsArray = ids.split(',');
        const objectIds = idsArray
          .map(id => id.trim())
          .filter(id => ObjectId.isValid(id))
          .map(id => new ObjectId(id));
        
        if (objectIds.length > 0) {
          query._id = { $in: objectIds };
        } else {
          console.log('⚠️ Nenhum ID válido fornecido');
        }
      } catch (error) {
        console.error('⚠️ Erro ao processar IDs:', error);
      }
    }
    
    console.log('📋 Query final:', query);
    
    const adicionais = await db.collection<AdicionalDocument>('adicionais')
      .find(query)
      .sort({ nome: 1 })
      .toArray();
    
    console.log(`✅ Encontrados ${adicionais.length} adicionais`);
    
    const adicionaisFormatados: AdicionalResponse[] = adicionais.map((adicional: WithId<AdicionalDocument>) => ({
      _id: adicional._id.toString(),
      nome: adicional.nome,
      descricao: adicional.descricao,
      preco: adicional.preco,
      categoria: adicional.categoria,
      gratuito: adicional.gratuito || false, // ✅ INCLUÍDO
      ativo: adicional.ativo,
      criadoEm: adicional.criadoEm,
      atualizadoEm: adicional.atualizadoEm
    }));
    
    return NextResponse.json({
      success: true,
      data: adicionaisFormatados
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao buscar adicionais:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar adicionais: ' + error.message },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

// POST - Criar adicional (MANTIDO IGUAL)
export async function POST(request: NextRequest) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    const body = await request.json();
    
    const precoNumerico = parseFloat(body.preco);

    if (!body.nome || (!body.gratuito && (isNaN(precoNumerico) || precoNumerico <= 0))) {
      return NextResponse.json(
        { success: false, error: 'Nome é obrigatório e preço deve ser maior que zero para itens pagos' },
        { status: 400 }
      );
    }
    
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Verificar se adicional já existe
    const adicionalExistente = await db.collection<AdicionalDocument>('adicionais').findOne({
      nome: body.nome.trim()
    });
    
    if (adicionalExistente) {
      return NextResponse.json(
        { success: false, error: 'Adicional com este nome já existe' },
        { status: 409 }
      );
    }
    
    const novoAdicional: AdicionalDocument = {
      nome: body.nome.trim(),
      descricao: body.descricao?.trim() || '',
      preco: parseFloat(body.preco),
      categoria: body.categoria || 'Adicional',
      gratuito: body.gratuito !== undefined ? body.gratuito : false,
      ativo: body.ativo !== undefined ? body.ativo : true,
      criadoEm: new Date(),
      atualizadoEm: new Date()
    };
    
    const result = await db.collection('adicionais').insertOne(novoAdicional);
    
    return NextResponse.json({
      success: true,
      message: 'Adicional criado com sucesso',
      data: {
        ...novoAdicional,
        _id: result.insertedId.toString()
      } as AdicionalResponse
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao criar adicional:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar adicional' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}