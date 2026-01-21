import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDB } from '@/lib/mongodb';

// BUSCAR COMANDAS (DASHBOARD)
export async function GET(request: NextRequest) {
  try {
    const db = await getDB();
    if (!db) {
      return NextResponse.json({ success: false, error: "Falha ao conectar ao banco de dados" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const mesaId = searchParams.get('mesaId');

    if (!mesaId) {
      // 🔥 Ordenação de 01 a 99 garantida pelo singleton
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

    // 🔥 FILTRO PARA TS USANDO A CONEXÃO COMPARTILHADA
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

    return NextResponse.json({ success: true, data: comanda });
  } catch (error: any) {
    console.error('❌ Erro no GET:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// SALVAR ITENS (CORREÇÃO DO POOL DE CONEXÕES)
export async function POST(request: NextRequest) {
  try {
    const db = await getDB();
    if (!db) {
      return NextResponse.json({ success: false, error: "Falha ao conectar ao banco de dados" }, { status: 500 });
    }

    const body = await request.json();
    const identificador = body.numeroMesa || body.mesaId || body.numero;
    
    if (!identificador) throw new Error("Número da mesa não identificado");

    const numeroFormatado = identificador.toString().padStart(2, '0');

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
  }
}