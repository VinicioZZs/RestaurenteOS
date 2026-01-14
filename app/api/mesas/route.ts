// app/api/mesas/route.ts - COM TIPOS CORRIGIDOS
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'restaurante';

// Definir tipos
interface ItemComanda {
  precoUnitario: number;
  quantidade: number;
  // ... outros campos se tiver
}

interface Comanda {
  _id: any;
  mesaId: string;
  itens: ItemComanda[];
  status: string;
  atualizadoEm: Date;
}

interface Mesa {
  _id: any;
  numero: string;
  nome: string;
  capacidade: number;
  criadoEm: Date;
}

export async function GET(request: NextRequest) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    
    const { searchParams } = new URL(request.url);
    const busca = searchParams.get('busca') || '';
    
    // Buscar todas as mesas
    let query = {};
    if (busca) {
      query = {
        $or: [
          { numero: { $regex: busca, $options: 'i' } },
          { nome: { $regex: busca, $options: 'i' } }
        ]
      };
    }
    
    const mesas = await db.collection('mesas')
      .find(query)
      .sort({ numero: 1 })
      .toArray() as Mesa[];
    
    // Buscar comandas abertas
    const mesaIds = mesas.map(m => m._id.toString());
    const comandas = await db.collection('comandas')
      .find({ 
        mesaId: { $in: mesaIds },
        status: 'aberta' 
      })
      .toArray() as Comanda[];
    
    // Criar mapa de comandas por mesaId
    const comandasPorMesa = new Map();
    comandas.forEach(comanda => {
      comandasPorMesa.set(comanda.mesaId, comanda);
    });
    
    // Montar resposta com totais - COM TIPAGEM CORRETA
    const mesasComTotais = mesas.map(mesa => {
      const comanda = comandasPorMesa.get(mesa._id.toString()) as Comanda | undefined;
      
      let totalComanda = 0;
      let quantidadeItens = 0;
      
      if (comanda && comanda.itens) {
        // CORREÇÃO AQUI: Adicionar tipos explicitamente
        totalComanda = comanda.itens.reduce((sum: number, item: ItemComanda) => 
          sum + (item.precoUnitario * item.quantidade), 0
        );
        quantidadeItens = comanda.itens.length;
      }
      
      return {
        _id: mesa._id.toString(),
        numero: mesa.numero,
        nome: mesa.nome,
        totalComanda,
        quantidadeItens,
        atualizadoEm: comanda?.atualizadoEm || mesa.criadoEm || new Date()
      };
    });
    
    return NextResponse.json({
      success: true,
      data: mesasComTotais
    });
    
  } catch (error) {
    console.error('Erro ao buscar mesas:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao buscar mesas'
      },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

// ... resto do código POST permanece igual ...