// app/api/mesas/buscar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'restaurante';

export async function GET(request: NextRequest) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    const { searchParams } = new URL(request.url);
    const termo = searchParams.get('termo');
    
    if (!termo) {
      return NextResponse.json(
        { success: false, error: 'Termo de busca é obrigatório' },
        { status: 400 }
      );
    }
    
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Criar condições de busca flexíveis
    const condicoesBusca: any[] = [
      { numero: termo },
      { numero: termo.toString().padStart(2, '0') },
      { nome: { $regex: termo, $options: 'i' } }
    ];
    
    // Se for ObjectId válido
    if (ObjectId.isValid(termo)) {
      condicoesBusca.push({ _id: new ObjectId(termo) });
    }
    
    const mesa = await db.collection('comandas').findOne({
      $or: condicoesBusca
    });
    
    if (!mesa) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'Mesa não encontrada'
      });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        _id: mesa._id.toString(),
        numero: mesa.numero,
        nome: mesa.nome,
        status: mesa.status || 'livre',
        capacidade: mesa.capacidade || 4,
        criadoEm: mesa.criadoEm,
        atualizadoEm: mesa.atualizadoEm
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar mesa:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar mesa' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}