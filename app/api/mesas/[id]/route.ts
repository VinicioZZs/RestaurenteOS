// app/api/mesas/[id]/route.ts - VERSÃO COM MONGODB DRIVER
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'restaurante';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const client = new MongoClient(MONGODB_URI);
  try {
    const mesaId = params.id;
    await client.connect();
    const db = client.db(DB_NAME);

    // 🔥 FILTRO CORRIGIDO PARA TS:
    const filtroDelecao: any = {
      $or: [
        { numeroMesa: mesaId },
        { numeroMesa: mesaId.padStart(2, '0') }
      ]
    };

    if (ObjectId.isValid(mesaId)) {
      filtroDelecao.$or.push({ _id: new ObjectId(mesaId) });
    }

    const resultado = await db.collection('comandas').deleteOne(filtroDelecao);

    return NextResponse.json({ 
      success: resultado.deletedCount > 0,
      message: resultado.deletedCount > 0 ? "Mesa apagada" : "Mesa não encontrada" 
    });
  } finally {
    await client.close();
  }
}