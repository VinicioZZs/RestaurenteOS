// app/api/mesas/route.ts - VERSÃO COMPLETA CORRIGIDA (MongoDB Driver)
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'restaurante';

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
      .toArray();
    
    // Buscar comandas abertas - USANDO OS IDs DAS MESAS
    const mesaIds = mesas.map(m => m._id.toString());
    const comandas = await db.collection('comandas')
      .find({ 
        mesaId: { $in: mesaIds },
        status: 'aberta' 
      })
      .toArray();
    
    // Criar mapa de comandas por mesaId
    const comandasPorMesa = new Map();
    comandas.forEach(comanda => {
      comandasPorMesa.set(comanda.mesaId, comanda);
    });
    
    // Montar resposta com totais
    const mesasComTotais = mesas.map(mesa => {
      const comanda = comandasPorMesa.get(mesa._id.toString());
      
      let totalComanda = 0;
      let quantidadeItens = 0;
      
      if (comanda && comanda.itens) {
        totalComanda = comanda.itens.reduce((sum: number, item: any) => 
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
    console.log('Dados recebidos para criar mesa:', body);
    
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
      // Mesa já existe - retornar dados dela
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
          nome: mesaExistente.nome,
          totalComanda,
          quantidadeItens,
          atualizadoEm: comanda?.atualizadoEm || mesaExistente.criadoEm || new Date()
        }
      }, { status: 409 }); // 409 Conflict
    }
    
    // Criar nova mesa
    const novaMesa = {
        numero: body.numero.toString().padStart(2, '0'), // SEMPRE com 2 dígitos
      nome: body.nome || `Mesa ${body.numero.toString().padStart(2, '0')}`,
      capacidade: body.capacidade || 4,
      status: 'livre',
      criadoEm: new Date(),
      atualizadoEm: new Date()
    };
    
    const resultado = await db.collection('mesas').insertOne(novaMesa);
    
    return NextResponse.json({
      success: true,
      message: 'Mesa criada com sucesso',
      data: {
        _id: resultado.insertedId.toString(),
        ...novaMesa,
        totalComanda: 0,
        quantidadeItens: 0
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Erro ao criar mesa:', error);
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