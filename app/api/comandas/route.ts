// app/api/comandas/route.ts - VERSÃO CORRIGIDA (ObjectId)
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
    
    // Buscar mesa primeiro para obter o _id correto
    const mesa = await db.collection('mesas').findOne({
      numero: mesaId
    });
    
    if (!mesa) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'Mesa não encontrada'
      });
    }
    
    // Buscar comanda por mesaId (usando o _id da mesa)
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
    
    console.log('📥 Salvando/Atualizando comanda:', body);
    
    if (!body.mesaId) {
      return NextResponse.json(
        { success: false, error: 'mesaId é obrigatório' },
        { status: 400 }
      );
    }
    
    await client.connect();
    const db = client.db(DB_NAME);
    
    // 🔴 PROBLEMA AQUI: body.mesaId é o NÚMERO da mesa (ex: "10"), não um ObjectId
    // Buscar mesa pelo número
    const mesa = await db.collection('mesas').findOne({
      numero: body.mesaId.toString()
    });
    
    if (!mesa) {
      console.log('❌ Mesa não encontrada com número:', body.mesaId);
      return NextResponse.json(
        { success: false, error: `Mesa ${body.mesaId} não encontrada` },
        { status: 404 }
      );
    }
    
    console.log('✅ Mesa encontrada:', { 
      id: mesa._id.toString(), 
      numero: mesa.numero, 
      nome: mesa.nome 
    });
    
    const agora = new Date();
    const mesaId = mesa._id.toString(); // 🔴 AGORA SIM: ObjectId da mesa
    const totalCalculado = body.total || body.itens?.reduce((sum: number, item: any) => 
      sum + (item.precoUnitario * item.quantidade), 0) || 0;
    
    // Verificar se já existe comanda aberta para esta mesa
    const comandaExistente = await db.collection('comandas').findOne({
      mesaId: mesaId,
      status: 'aberta'
    });
    
    let novaComandaId: string | null = null;
    
    if (comandaExistente) {
      // Atualizar comanda existente
      await db.collection('comandas').updateOne(
        { _id: comandaExistente._id },
        {
          $set: {
            itens: body.itens || [],
            total: totalCalculado,
            atualizadoEm: agora
          }
        }
      );
      
      novaComandaId = comandaExistente._id.toString();
      
      console.log('✅ Comanda atualizada:', { 
        mesaId: mesa.numero, 
        total: totalCalculado, 
        itens: body.itens?.length || 0 
      });
      
    } else {
      // Criar nova comanda
      const novaComanda = {
        mesaId: mesaId, // 🔴 Usando ObjectId da mesa
        numeroMesa: body.numeroMesa || mesa.numero,
        itens: body.itens || [],
        total: totalCalculado,
        status: 'aberta',
        criadoEm: agora,
        atualizadoEm: agora
      };
      
      const resultado = await db.collection('comandas').insertOne(novaComanda);
      novaComandaId = resultado.insertedId.toString();
      
      console.log('✅ Nova comanda criada:', {
        id: novaComandaId,
        mesaNumero: mesa.numero,
        total: totalCalculado
      });
    }
    
    // ✅ IMPORTANTE: Atualizar também a mesa com o último horário
    await db.collection('mesas').updateOne(
      { _id: mesa._id },
      {
        $set: {
          atualizadoEm: agora
        }
      }
    );
    
    return NextResponse.json({
      success: true,
      message: comandaExistente ? 'Comanda atualizada' : 'Comanda criada',
      data: {
        _id: novaComandaId,
        mesaId: mesa.numero, // 🔴 Retornando o número da mesa para o frontend
        mesaObjectId: mesaId, // 🔴 E também o ObjectId se precisar
        total: totalCalculado,
        atualizadoEm: agora.toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao salvar comanda:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao salvar comanda',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}