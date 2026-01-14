    // app/api/comandas/route.ts - VERSÃO MONGODB ATUALIZADA
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'restaurante';

// POST - Salvar comanda
export async function POST(request: NextRequest) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const comandasCollection = db.collection('comandas');
    const mesasCollection = db.collection('mesas');
    
    const body = await request.json();
    const { mesaId, numeroMesa, itens, total } = body;
    
    // IMPORTANTE: Buscar o ID real da mesa pelo número
    const mesa = await mesasCollection.findOne({ numero: numeroMesa });
    if (!mesa) {
      return NextResponse.json(
        { success: false, error: 'Mesa não encontrada' },
        { status: 404 }
      );
    }
    
    const mesaRealId = mesa._id.toString();
    
    // Verificar se já existe comanda para esta mesa
    const comandaExistente = await comandasCollection.findOne({
      mesaId: mesaRealId,
      status: 'aberta'
    });
    
    if (comandaExistente) {
      // Atualizar comanda existente
      const result = await comandasCollection.updateOne(
        { _id: comandaExistente._id },
        { 
          $set: { 
            itens: itens,
            total: total,
            atualizadoEm: new Date()
          }
        }
      );
      
      return NextResponse.json({
        success: true,
        message: 'Comanda atualizada',
        data: { 
          ...comandaExistente, 
          _id: comandaExistente._id.toString(),
          itens 
        }
      });
    } else {
      // Criar nova comanda
      const novaComanda = {
        mesaId: mesaRealId,
        numeroMesa: numeroMesa,
        itens: itens,
        total: total,
        status: 'aberta',
        criadoEm: new Date(),
        atualizadoEm: new Date()
      };
      
      const result = await comandasCollection.insertOne(novaComanda);
      
      return NextResponse.json({
        success: true,
        message: 'Comanda criada',
        data: { 
          ...novaComanda, 
          _id: result.insertedId.toString() 
        }
      });
    }
    
  } catch (error) {
    console.error('Erro ao salvar comanda:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao salvar comanda',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

// GET - Buscar comanda
export async function GET(request: NextRequest) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const comandasCollection = db.collection('comandas');
    const mesasCollection = db.collection('mesas');
    
    const { searchParams } = new URL(request.url);
    const mesaNumero = searchParams.get('mesaNumero'); // Alterado para buscar por número
    
    if (!mesaNumero) {
      return NextResponse.json(
        { success: false, error: 'Número da mesa é obrigatório' },
        { status: 400 }
      );
    }
    
    // Buscar mesa pelo número
    const mesa = await mesasCollection.findOne({ numero: mesaNumero });
    if (!mesa) {
      return NextResponse.json({
        success: false,
        error: 'Mesa não encontrada'
      });
    }
    
    // Buscar comanda aberta para a mesa
    const comanda = await comandasCollection.findOne({
      mesaId: mesa._id.toString(),
      status: 'aberta'
    });
    
    if (!comanda) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'Nenhuma comanda aberta encontrada'
      });
    }
    
    // Converter ObjectId para string
    const comandaFormatada = {
      ...comanda,
      _id: comanda._id.toString(),
      itens: comanda.itens || []
    };
    
    return NextResponse.json({
      success: true,
      data: comandaFormatada
    });
    
  } catch (error) {
    console.error('Erro ao buscar comanda:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar comanda' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}