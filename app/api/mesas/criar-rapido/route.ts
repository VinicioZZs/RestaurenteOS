// app/api/mesas/criar-rapido/route.ts - ENDPOINT ULTRA SIMPLES
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'restaurante';

export async function POST(request: NextRequest) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    const body = await request.json();
    const numero = body.numero;
    
    if (!numero) {
      return NextResponse.json(
        { success: false, error: 'Número da mesa é obrigatório' },
        { status: 400 }
      );
    }
    
    await client.connect();
    const db = client.db(DB_NAME);
    const comandasCollection = db.collection('comandas');
    
    const numeroFormatado = numero.toString().padStart(2, '0');
    
    // VERIFICAR SE JÁ EXISTE COMANDA ABERTA
    const comandaExistente = await comandasCollection.findOne({
  $or: [
    { numeroMesa: numeroFormatado },
    { numeroMesa: numero.toString() }
  ],
  status: 'aberta' // SÓ BLOQUEIA SE ESTIVER ABERTA
});

if (comandaExistente) {
  return NextResponse.json({
    success: false,
    error: `A mesa ${numeroFormatado} já está ocupada com uma comanda ativa.`,
    comandaId: comandaExistente._id.toString()
  }, { status: 409 });
}
    
    // CRIAR NOVA COMANDA (MESA)
    const novaComanda = {
      numeroMesa: numeroFormatado,
      mesaId: numeroFormatado,
      numero: parseInt(numero),
      nome: `Mesa ${numeroFormatado}`,
      itens: [],
      total: 0,
      status: 'aberta',
      criadoEm: new Date(),
      atualizadoEm: new Date(),
      pagadores: [],
      formasPagamento: []
    };
    
    const resultado = await comandasCollection.insertOne(novaComanda);
    
    return NextResponse.json({
      success: true,
      data: {
        _id: resultado.insertedId.toString(),
        ...novaComanda
      }
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao criar mesa:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}