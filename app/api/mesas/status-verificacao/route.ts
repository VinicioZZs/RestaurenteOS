// app/api/mesas/status-verificacao/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'restaurante';

export async function GET(request: NextRequest) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Buscar mesas com status 'livre' e totalComanda = 0
    const mesasLivres = await db.collection('mesas')
      .find({ 
        status: 'livre',
        totalComanda: 0 
      })
      .toArray();
    
    // Buscar comandas abertas para comparar
    const comandasAbertas = await db.collection('comandas')
      .find({ status: 'aberta' })
      .toArray();
    
    // Filtrar mesas que estão livres mas ainda têm comandas abertas
    const numerosMesasComComanda = comandasAbertas.map(c => c.numeroMesa);
    
    const mesasRealmenteLivres = mesasLivres
      .filter(mesa => !numerosMesasComComanda.includes(mesa.numero))
      .map(mesa => mesa.numero);
    
    return NextResponse.json({
      success: true,
      mesasLivres: mesasRealmenteLivres,
      totalMesasLivres: mesasRealmenteLivres.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    return NextResponse.json({
      success: false,
      mesasLivres: [],
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  } finally {
    await client.close();
  }
}