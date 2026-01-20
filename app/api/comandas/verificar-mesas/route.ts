// app/api/comandas/verificar-mesa/route.ts - VERSÃO CORRIGIDA
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb'; // ← Importar ObjectId

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'restaurante';

export async function GET(request: NextRequest) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    const { searchParams } = new URL(request.url);
    const mesaId = searchParams.get('mesaId');
    
    if (!mesaId) {
      return NextResponse.json(
        { success: false, error: 'mesaId é obrigatório' },
        { status: 400 }
      );
    }
    
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Criar array de condições de busca
    const condicoesBusca: any[] = [
      { numero: mesaId },
      { numero: mesaId.toString().padStart(2, '0') }
    ];
    
    // Adicionar condição por _id somente se for ObjectId válido
    if (ObjectId.isValid(mesaId)) {
      condicoesBusca.push({ _id: new ObjectId(mesaId) });
    }
    
    // Buscar mesa primeiro
    const mesa = await db.collection('mesas').findOne({
      $or: condicoesBusca
    });
    
    if (!mesa) {
      return NextResponse.json({
        success: true,
        mesaEncontrada: false,
        comandaExistente: false,
        podeCriar: false,
        message: 'Mesa não encontrada'
      });
    }
    
    // Verificar se já tem comanda aberta
    const comandaExistente = await db.collection('comandas').findOne({
      $or: [
        { mesaId: mesa._id.toString(), status: 'aberta' },
        { numeroMesa: mesa.numero, status: 'aberta' },
        { numeroMesa: mesa.numero.toString().padStart(2, '0'), status: 'aberta' }
      ]
    });
    
    return NextResponse.json({
      success: true,
      mesaEncontrada: true,
      comandaExistente: !!comandaExistente,
      comandaData: comandaExistente ? {
        _id: comandaExistente._id.toString(),
        numeroMesa: comandaExistente.numeroMesa,
        total: comandaExistente.total,
        itens: comandaExistente.itens?.length || 0
      } : null,
      podeCriar: !comandaExistente,
      message: comandaExistente 
        ? 'Já existe comanda aberta para esta mesa' 
        : 'Pode criar nova comanda'
    });
    
  } catch (error) {
    console.error('Erro ao verificar mesa:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao verificar mesa',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}