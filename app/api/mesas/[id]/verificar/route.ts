// app/api/mesas/[numero]/verificar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'restaurante';

export async function GET(
  request: NextRequest,
  { params }: { params: { numero: string } }
) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    const { numero } = params;
    
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Buscar mesa
    const mesa = await db.collection('mesas').findOne({
      numero: numero.toString().padStart(2, '0')
    });
    
    if (!mesa) {
      return NextResponse.json({
        success: true,
        mesaEncontrada: false,
        status: 'nao_existe',
        mensagem: 'Mesa não encontrada'
      });
    }
    
    // Verificar se tem comanda aberta
    const comanda = await db.collection('comandas').findOne({
      $or: [
        { mesaId: mesa._id.toString() },
        { numeroMesa: numero },
        { numeroMesa: numero.toString().padStart(2, '0') }
      ],
      status: 'aberta'
    });
    
    return NextResponse.json({
      success: true,
      mesaEncontrada: true,
      status: mesa.status,
      temComanda: !!comanda,
      comandaId: comanda?._id?.toString(),
      totalComanda: comanda?.total || 0,
      quantidadeItens: comanda?.itens?.length || 0,
      recomendacao: !comanda ? 'voltar_dashboard' : 'permanecer'
    });
    
  } catch (error) {
    console.error('Erro ao verificar mesa:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  } finally {
    await client.close();
  }
}