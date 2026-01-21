import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'restaurante';

// BUSCAR COMANDAS (DASHBOARD)
export async function GET(request: NextRequest) {
  const client = new MongoClient(MONGODB_URI);
  try {
    const { searchParams } = new URL(request.url);
    const mesaId = searchParams.get('mesaId');
    await client.connect();
    const db = client.db(DB_NAME);

    if (!mesaId) {
  // 🔥 Adicionamos o .sort({ numeroMesa: 1 }) para ordenar de 01 a 99
  const comandas = await db.collection('comandas')
    .find({})
    .sort({ numeroMesa: 1 }) 
    .toArray();
  
  return NextResponse.json({
    success: true,
    data: comandas.map(c => ({
      _id: c._id.toString(),
      numero: c.numeroMesa || c.numero, 
      nome: c.nomeMesa || `Mesa ${c.numeroMesa}`,
      totalComanda: c.total || 0,
      quantidadeItens: c.itens?.length || 0,
      atualizadoEm: c.atualizadoEm || c.criadoEm
    }))
  });
}

    // 🔥 FILTRO CORRIGIDO PARA TS:
    const filtro: any = {
      $or: [
        { numeroMesa: mesaId },
        { numeroMesa: mesaId.toString().padStart(2, '0') }
      ]
    };

    if (ObjectId.isValid(mesaId)) {
      filtro.$or.push({ _id: new ObjectId(mesaId) });
    }

    const comanda = await db.collection('comandas').findOne(filtro);

    // Retorna a comanda BRUTA para que os produtos apareçam (nome, preço, etc)
    return NextResponse.json({ success: true, data: comanda });
  } finally {
    await client.close();
  }
}

// SALVAR ITENS (CORREÇÃO DO UNDEFINED)
export async function POST(request: NextRequest) {
  const client = new MongoClient(MONGODB_URI);
  try {
    const body = await request.json();
    
    // 🔥 Pega o que vier: numeroMesa, mesaId ou numero
    const identificador = body.numeroMesa || body.mesaId || body.numero;
    
    if (!identificador) throw new Error("Número da mesa não identificado");

    await client.connect();
    const db = client.db(DB_NAME);
    const numeroFormatado = identificador.toString().padStart(2, '0');

    // Atualiza a comanda. Se o campo no seu banco for 'numero', mude aqui.
    const resultado = await db.collection('comandas').updateOne(
      { 
        $or: [
          { numeroMesa: numeroFormatado },
          { numero: numeroFormatado }
        ]
      },
      { 
        $set: { 
          itens: body.itens || [], 
          total: body.total || 0, 
          atualizadoEm: new Date() 
        } 
      }
    );

    if (resultado.matchedCount === 0) {
      return NextResponse.json({ success: false, error: "Comanda não encontrada no banco." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Itens gravados no banco!" });

  } catch (error: any) {
    console.error('❌ Erro ao salvar:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    await client.close();
  }
}