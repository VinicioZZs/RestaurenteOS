// /app/api/mesas/buscar/route.ts - VERSÃO CORRIGIDA
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'restaurante'; // ← MUDE PARA 'restaurante' se estiver 'restaurante'

export async function GET(request: NextRequest) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    const { searchParams } = new URL(request.url);
    const termo = searchParams.get('termo') || '';
    
    if (!termo.trim()) {
      return NextResponse.json(
        { success: false, error: 'Termo de busca é obrigatório' },
        { status: 400 }
      );
    }
    
    await client.connect();
    const db = client.db(DB_NAME); // ← VAI LER DO BANCO CORRETO!
    
    console.log(`🔍 Buscando mesas no banco ${DB_NAME} com termo: "${termo}"`);
    
    // Buscar mesas que correspondam ao termo
    const mesas = await db.collection('mesas')
      .find({
        $or: [
          { numero: { $regex: termo, $options: 'i' } },
          { nome: { $regex: termo, $options: 'i' } }
        ]
      })
      .sort({ numero: 1 })
      .toArray();
    
    // Buscar comandas abertas para calcular totais
    const comandas = await db.collection('comandas')
      .find({ status: 'aberta' })
      .toArray();
    
    const mesasComTotais = mesas.map(mesa => {
      const comanda = comandas.find(c => 
        c.mesaId === mesa._id.toString() || 
        c.numeroMesa === mesa.numero ||
        c.numeroMesa === mesa.numero.toString().padStart(2, '0')
      );
      
      const totalComanda = comanda?.itens?.reduce((sum: number, item: any) => 
        sum + (item.precoUnitario * item.quantidade), 0) || 0;
      
      return {
        _id: mesa._id.toString(),
        numero: mesa.numero,
        nome: mesa.nome,
        totalComanda,
        quantidadeItens: comanda?.itens?.length || 0,
        atualizadoEm: comanda?.atualizadoEm || mesa.criadoEm || new Date(),
        status: totalComanda > 0 ? 'ocupada' : 'livre'
      };
    });
    
    console.log(`✅ Encontradas ${mesasComTotais.length} mesas no banco ${DB_NAME}`);
    
    return NextResponse.json({
      success: true,
      data: mesasComTotais,
      debug: {
        banco: DB_NAME,
        termo,
        totalEncontrado: mesasComTotais.length,
        numerosEncontrados: mesasComTotais.map(m => m.numero)
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar mesas:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao buscar mesas',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
