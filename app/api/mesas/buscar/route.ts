// app/api/mesas/buscar/route.ts - COM TIPOS CORRIGIDOS
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'restaurante';

// Definir tipos
interface ItemComanda {
  precoUnitario: number;
  quantidade: number;
}

interface Comanda {
  _id: any;
  mesaId: string;
  itens: ItemComanda[];
  status: string;
}

interface Mesa {
  _id: any;
  numero: string;
  nome: string;
}

export async function GET(request: NextRequest) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    
    const { searchParams } = new URL(request.url);
    const termo = searchParams.get('termo');
    
    if (!termo) {
      return NextResponse.json(
        { success: false, error: 'Termo de busca é obrigatório' },
        { status: 400 }
      );
    }
    
    // Buscar mesas
    const mesas = await db.collection('mesas')
      .find({
        $or: [
          { numero: { $regex: termo, $options: 'i' } },
          { nome: { $regex: termo, $options: 'i' } }
        ]
      })
      .sort({ numero: 1 })
      .limit(10)
      .toArray() as Mesa[];
    
    if (mesas.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'Nenhuma mesa encontrada'
      });
    }
    
    // Buscar comandas das mesas encontradas
    const mesaIds = mesas.map(m => m._id.toString());
    const comandas = await db.collection('comandas')
      .find({ 
        mesaId: { $in: mesaIds },
        status: 'aberta' 
      })
      .toArray() as Comanda[];
    
    // Mapa de comandas por mesaId
    const comandasPorMesa = new Map<string, Comanda>();
    comandas.forEach(comanda => {
      comandasPorMesa.set(comanda.mesaId, comanda);
    });
    
    // Montar resposta - COM TIPAGEM CORRETA
    const resultado = mesas.map(mesa => {
      const comanda = comandasPorMesa.get(mesa._id.toString());
      
      let totalComanda = 0;
      if (comanda && comanda.itens) {
        // CORREÇÃO AQUI: Adicionar tipos explicitamente
        totalComanda = comanda.itens.reduce((sum: number, item: ItemComanda) => 
          sum + (item.precoUnitario * item.quantidade), 0
        );
      }
      
      return {
        _id: mesa._id.toString(),
        numero: mesa.numero,
        nome: mesa.nome,
        totalComanda,
        quantidadeItens: comanda?.itens?.length || 0
      };
    });
    
    return NextResponse.json({
      success: true,
      data: resultado
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