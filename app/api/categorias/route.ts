import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'restaurante';

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
      .sort({ nome: 1 })
      .toArray();
    
    // ✅ ATUALIZE ESTA PARTE para incluir todos os campos
    const categoriasFormatadas = categorias.map(categoria => ({
      _id: categoria._id.toString(),
      nome: categoria.nome,
      descricao: categoria.descricao || '', // ✅ ADICIONAR
      icone: categoria.icone || '📦',
      imagem: categoria.imagem || '', // ✅ ADICIONAR
      usaImagem: categoria.usaImagem || false, // ✅ ADICIONAR
      ordem: categoria.ordem || 999, // ✅ ADICIONAR
      ativo: categoria.ativo !== false,
      criadoEm: categoria.criadoEm,
      atualizadoEm: categoria.atualizadoEm || categoria.criadoEm // ✅ ADICIONAR
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