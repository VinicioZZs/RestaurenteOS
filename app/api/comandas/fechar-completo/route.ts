import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'restaurante';

export async function POST(request: NextRequest) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    const body = await request.json();
    const { comandaId } = body;

    await client.connect();
    const db = client.db(DB_NAME);

    // 1. Busca a comanda (Sem filtro de status, direto pelo ID)
    const comanda = await db.collection('comandas').findOne({ 
      _id: new ObjectId(comandaId) 
    });

    if (!comanda) {
      return NextResponse.json({ success: false, error: 'Comanda não encontrada.' }, { status: 404 });
    }

    // 2. Salva no histórico
    await db.collection('comandas_fechadas').insertOne({
      ...comanda,
      fechadoEm: new Date()
    });

    // 3. DELETA da coleção principal (Isso faz sumir do Dashboard)
    await db.collection('comandas').deleteOne({ _id: comanda._id });

    // O RETURN DEVE ESTAR DENTRO DO TRY
    return NextResponse.json({ success: true, message: 'Finalizado e removido do dashboard!' });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    await client.close();
  }
} // <--- Verifique se essa chave final existe!