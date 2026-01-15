// app/api/mesas/route.ts - COMPLETO COM GET E POST
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

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
    
    // Montar resposta com totais
    const mesasComTotais = mesas.map(mesa => {
      const comanda = comandasPorMesa.get(mesa._id.toString()) as Comanda | undefined;
      
      let totalComanda = 0;
      let quantidadeItens = 0;
      
      if (comanda && comanda.itens) {
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

export async function POST(request: NextRequest) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    const body = await request.json();
    
    console.log('📥 Recebendo POST /api/mesas:', body);
    
    if (!body.numero || !body.numero.toString().trim()) {
      return NextResponse.json(
        { success: false, error: 'Número da mesa é obrigatório' },
        { status: 400 }
      );
    }
    
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Verificar se mesa já existe
    const mesaExistente = await db.collection('mesas').findOne({
      numero: body.numero.toString()
    });
    
    if (mesaExistente) {
      console.log('⚠️ Mesa já existe:', mesaExistente);
      
      // Buscar comanda aberta desta mesa
      const comanda = await db.collection('comandas').findOne({
        mesaId: mesaExistente._id.toString(),
        status: 'aberta'
      });
      
      let totalComanda = 0;
      let quantidadeItens = 0;
      
      if (comanda && comanda.itens) {
        totalComanda = comanda.itens.reduce((sum: number, item: any) => 
          sum + (item.precoUnitario * item.quantidade), 0
        );
        quantidadeItens = comanda.itens.length;
      }
      
      return NextResponse.json({
        success: false,
        error: 'Mesa já existe',
        data: {
          _id: mesaExistente._id.toString(),
          numero: mesaExistente.numero,
          nome: mesaExistente.nome || `Mesa ${mesaExistente.numero.padStart(2, '0')}`,
          totalComanda,
          quantidadeItens,
          atualizadoEm: comanda?.atualizadoEm || mesaExistente.criadoEm || new Date()
        }
      }, { status: 409 });
    }
    
    // Criar nova mesa
    const novaMesa = {
      numero: body.numero.toString(),
      nome: body.nome || `Mesa ${body.numero.toString().padStart(2, '0')}`,
      capacidade: body.capacidade || 4,
      status: 'livre',
      criadoEm: new Date(),
      atualizadoEm: new Date()
    };
    
    console.log('➕ Criando nova mesa:', novaMesa);
    
    const resultado = await db.collection('mesas').insertOne(novaMesa);
    
    const mesaCriada = {
      _id: resultado.insertedId.toString(),
      ...novaMesa,
      totalComanda: 0,
      quantidadeItens: 0
    };
    
    console.log('✅ Mesa criada com sucesso:', mesaCriada);
    
    return NextResponse.json({
      success: true,
      message: 'Mesa criada com sucesso',
      data: mesaCriada
    }, { status: 201 });
    
  } catch (error) {
    console.error('❌ Erro ao criar mesa:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao criar mesa',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
