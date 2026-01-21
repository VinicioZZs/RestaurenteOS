// app/api/mesas/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'restaurante';

export async function POST(request: NextRequest) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    const { numero, nome } = await request.json();
    
    // 🔥 A MÁGICA: Transformamos em número e depois de volta para texto com 2 dígitos.
    // Isso faz "013" virar "13" e "1" virar "01".
    const numeroFormatado = parseInt(numero, 10).toString().padStart(2, '0');

    await client.connect();
    const db = client.db(DB_NAME);

    // Agora a verificação é exata: "13" nunca deixará criar "013"
    const comandaExiste = await db.collection('comandas').findOne({
      numeroMesa: numeroFormatado
    });

    if (comandaExiste) {
      return NextResponse.json({ 
        success: false, 
        error: `A mesa ${numeroFormatado} já está aberta.` 
      }, { status: 409 });
    }

    const novaComanda = {
      numeroMesa: numeroFormatado,
      nomeMesa: nome || `Mesa ${numeroFormatado}`,
      itens: [],
      total: 0,
      criadoEm: new Date(),
      atualizadoEm: new Date()
    };

    const resultado = await db.collection('comandas').insertOne(novaComanda);
    
    return NextResponse.json({ 
      success: true, 
      data: { 
        ...novaComanda, 
        _id: resultado.insertedId.toString(),
        numero: numeroFormatado 
      } 
    });
  } catch (error) {
    console.error("Erro ao criar comanda:", error);
    return NextResponse.json({ success: false, error: "Erro interno no servidor" }, { status: 500 });
  } finally {
    await client.close();
  }
}