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
    
    console.log('📥 Recebendo POST /api/comandas:', JSON.stringify(body, null, 2));
    
    if (!body.mesaId) {
      return NextResponse.json(
        { success: false, error: 'mesaId é obrigatório' },
        { status: 400 }
      );
    }
    
    await client.connect();
    const db = client.db(DB_NAME);
    
    // 🔴 LOG: Mostrar todas as mesas no banco
    const todasMesas = await db.collection('mesas').find({}).toArray();
    console.log('📊 Todas as mesas no banco:', todasMesas.map(m => ({ 
      id: m._id.toString(), 
      numero: m.numero, 
      nome: m.nome 
    })));
    
    // Buscar mesa pelo número
    const mesa = await db.collection('mesas').findOne({
      numero: body.mesaId.toString()
    });
    
    if (!mesa) {
      console.log('❌ Mesa não encontrada com número:', body.mesaId);
      console.log('🔍 Mesas disponíveis:', todasMesas.map(m => m.numero));
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
    const mesaId = mesa._id.toString();
    const totalCalculado = body.total || body.itens?.reduce((sum: number, item: any) => 
      sum + (item.precoUnitario * item.quantidade), 0) || 0;
    
    // 🔴 LOG: Mostrar comandas existentes
    const comandasExistentes = await db.collection('comandas').find({
      mesaId: mesaId,
      status: 'aberta'
    }).toArray();
    
    console.log('📊 Comandas existentes para esta mesa:', comandasExistentes.map(c => ({
      id: c._id.toString(),
      mesaId: c.mesaId,
      itens: c.itens?.length || 0,
      total: c.total
    })));
    
    let novaComandaId: string | null = null;
    
    if (comandasExistentes.length > 0) {
      // Atualizar comanda existente
      const resultado = await db.collection('comandas').updateOne(
        { _id: comandasExistentes[0]._id },
        {
          $set: {
            itens: body.itens || [],
            total: totalCalculado,
            atualizadoEm: agora
          }
        }
      );
      
      novaComandaId = comandasExistentes[0]._id.toString();
      
      console.log('✅ Comanda atualizada:', { 
        modifiedCount: resultado.modifiedCount,
        matchedCount: resultado.matchedCount,
        mesaNumero: mesa.numero, 
        total: totalCalculado, 
        itens: body.itens?.length || 0 
      });
      
    } else {
      // Criar nova comanda
      const novaComanda = {
        mesaId: mesaId,
        numeroMesa: body.numeroMesa || mesa.numero,
        itens: body.itens || [],
        total: totalCalculado,
        status: 'aberta',
        criadoEm: agora,
        atualizadoEm: agora
      };
      
      console.log('➕ Criando nova comanda:', novaComanda);
      
      const resultado = await db.collection('comandas').insertOne(novaComanda);
      novaComandaId = resultado.insertedId.toString();
      
      console.log('✅ Nova comanda criada:', {
        id: novaComandaId,
        insertedId: resultado.insertedId,
        mesaNumero: mesa.numero,
        total: totalCalculado
      });
    }
    
    // Atualizar mesa
    const updateMesaResult = await db.collection('mesas').updateOne(
      { _id: mesa._id },
      {
        $set: {
          atualizadoEm: agora
        }
      }
    );
    
    console.log('📝 Mesa atualizada:', {
      modifiedCount: updateMesaResult.modifiedCount,
      matchedCount: updateMesaResult.matchedCount
    });
    
    // 🔴 LOG: Verificar se realmente salvou
    const comandaSalva = await db.collection('comandas').findOne({
      _id: new ObjectId(novaComandaId)
    });
    
    console.log('🔍 Comanda salva no banco:', comandaSalva);
    
    return NextResponse.json({
      success: true,
      message: comandasExistentes.length > 0 ? 'Comanda atualizada' : 'Comanda criada',
      data: {
        _id: novaComandaId,
        mesaId: mesa.numero,
        mesaObjectId: mesaId,
        total: totalCalculado,
        atualizadoEm: agora.toISOString(),
        debug: {
          comandaSalva: !!comandaSalva,
          itensCount: comandaSalva?.itens?.length || 0
        }
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