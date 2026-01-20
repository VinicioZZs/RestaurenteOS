// app/api/comandas/route.ts - VERSÃO CORRIGIDA COMPLETA
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
    const mesaId = searchParams.get('mesaId');
    
    if (!mesaId) {
      return NextResponse.json(
        { success: false, error: 'mesaId é obrigatório' },
        { status: 400 }
      );
    }
    
    // Criar condições de busca flexíveis
    const condicoesBusca: any[] = [
      { numero: mesaId },
      { numero: mesaId.toString().padStart(2, '0') }
    ];
    
    // Se for ObjectId válido, adicionar essa condição também
    if (ObjectId.isValid(mesaId)) {
      condicoesBusca.push({ _id: new ObjectId(mesaId) });
    }
    
    // Buscar mesa
    const mesa = await db.collection('mesas').findOne({
      $or: condicoesBusca
    });
    
    if (!mesa) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'Mesa não encontrada'
      });
    }
    
    // Buscar comanda usando o _id da mesa
    const comanda = await db.collection('comandas').findOne({
      mesaId: mesa._id.toString(),
      status: 'aberta'
    });
    
    if (!comanda) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'Nenhuma comanda aberta para esta mesa'
      });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        _id: comanda._id.toString(),
        mesaId: comanda.mesaId,
        numeroMesa: comanda.numeroMesa,
        itens: comanda.itens || [],
        total: comanda.total || 0,
        status: comanda.status || 'aberta',
        criadoEm: comanda.criadoEm,
        atualizadoEm: comanda.atualizadoEm
      }
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

export async function POST(request: NextRequest) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    const body = await request.json();
    
    console.log('📥 Recebendo POST /api/comandas:', {
      mesaId: body.mesaId,
      numeroMesa: body.numeroMesa,
      totalItens: body.itens?.length || 0
    });
    
    if (!body.mesaId) {
      return NextResponse.json(
        { success: false, error: 'mesaId é obrigatório' },
        { status: 400 }
      );
    }
    
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Buscar mesa (com múltiplas condições)
    const condicoesBusca: any[] = [
      { numero: body.mesaId.toString() },
      { numero: body.mesaId.toString().padStart(2, '0') }
    ];
    
    // Se for ObjectId válido
    if (ObjectId.isValid(body.mesaId)) {
      condicoesBusca.push({ _id: new ObjectId(body.mesaId) });
    }
    
    const mesa = await db.collection('mesas').findOne({
      $or: condicoesBusca
    });
    
    if (!mesa) {
      console.log('❌ Mesa não encontrada:', body.mesaId);
      return NextResponse.json(
        { success: false, error: `Mesa ${body.mesaId} não encontrada` },
        { status: 404 }
      );
    }
    
    const mesaId = mesa._id.toString();
    const numeroMesa = mesa.numero.toString();
    const agora = new Date();
    
    // Verificar se já existe comanda aberta
    const comandaExistente = await db.collection('comandas').findOne({
      mesaId: mesaId,
      status: 'aberta'
    });
    
    if (comandaExistente) {
  console.log('⚠️ Comanda já existe, atualizando...', {
    comandaId: comandaExistente._id.toString(),
    mesaId,
    numeroMesa
  });
  
  // Atualizar comanda existente
  const resultadoAtualizacao = await db.collection('comandas').updateOne(
    { _id: comandaExistente._id },
    {
      $set: {
        itens: body.itens || [],
        total: body.total || 0,
        atualizadoEm: agora,
        status: 'aberta' // Garantir que continua aberta
      }
    }
  );
  
  return NextResponse.json({
    success: true,
    data: {
      _id: comandaExistente._id.toString(),
      mesaId,
      numeroMesa,
      itens: body.itens || [],
      total: body.total || 0,
      status: 'aberta',
      atualizadoEm: agora.toISOString()
    },
    message: 'Comanda atualizada com sucesso'
  });
}
    
    // Criar nova comanda
    const novaComanda = {
      mesaId: mesaId,
      numeroMesa: numeroMesa,
      itens: body.itens || [],
      total: body.total || 0,
      status: 'aberta',
      criadoEm: agora,
      atualizadoEm: agora,
      totalPago: 0,
      formasPagamento: []
    };
    
    const resultado = await db.collection('comandas').insertOne(novaComanda);
    
    console.log('✅ Comanda criada:', {
      comandaId: resultado.insertedId.toString(),
      mesaId,
      numeroMesa
    });
    
    // Atualizar status da mesa
    await db.collection('mesas').updateOne(
      { _id: mesa._id },
      { 
        $set: { 
          status: 'ocupada',
          atualizadoEm: agora
        } 
      }
    );
    
    return NextResponse.json({
      success: true,
      data: {
        _id: resultado.insertedId.toString(),
        ...novaComanda
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao salvar comanda:', error);
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