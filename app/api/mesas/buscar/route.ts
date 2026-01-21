// /app/api/mesas/buscar/route.ts - VERSÃO UNIFICADA (SÓ COMANDAS)
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'restaurante';

export async function GET(request: NextRequest) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    const { searchParams } = new URL(request.url);
    const termo = searchParams.get('termo') || '';
    
    if (!termo.trim()) {
      return NextResponse.json({ success: true, data: [] });
    }

    await client.connect();
    const db = client.db(DB_NAME);
    
    // 🔥 A MÁGICA: Normalizamos o termo que o usuário digitou.
    // Se ele digitou "013", isso vira "13". Se digitou "1", vira "01".
    const termoLimpo = parseInt(termo, 10).toString().padStart(2, '0');

    console.log(`🔍 Buscando mesa exata: "${termoLimpo}"`);
    
    const comandasEncontradas = await db.collection('comandas')
      .find({
        $or: [
          { numeroMesa: termoLimpo }, // Busca o número já normalizado
          { nomeMesa: { $regex: termo, $options: 'i' } } // Nome pode continuar flexível
        ]
      })
      .toArray();

    const resultado = comandasEncontradas.map(comanda => ({
      _id: comanda._id.toString(),
      numero: comanda.numeroMesa || comanda.numero,
      nome: comanda.nomeMesa || `Mesa ${comanda.numeroMesa}`,
      totalComanda: comanda.total || 0,
      quantidadeItens: comanda.itens?.length || 0,
      atualizadoEm: comanda.atualizadoEm || new Date(),
      status: 'ocupada' // Se está na coleção 'comandas', ela está ativa/ocupada
    }));
    
    return NextResponse.json({
      success: true,
      data: resultado
    });
    
  } catch (error) {
    console.error('❌ Erro na busca:', error);
    return NextResponse.json({ success: false, error: 'Erro interno' }, { status: 500 });
  } finally {
    await client.close();
  }
}