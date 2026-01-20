// app/api/comandas/fechar-completo/route.ts - VERSÃO CORRIGIDA COM TIPAGEM
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'restaurante';

// Definir interfaces para TypeScript
interface Comanda {
  _id: ObjectId;
  id?: string;
  mesaId: string;
  numeroMesa?: string;
  itens?: any[];
  total?: number;
  status: string;
  criadoEm?: Date;
  atualizadoEm?: Date;
  [key: string]: any;
}

interface Venda {
  comandaId: string;
  mesa: string;
  valor: number;
  data: Date;
  tipo: string;
}

interface Caixa {
  _id: ObjectId;
  status: string;
  vendas?: Venda[];
  totalVendas?: number;
  saldoAtual?: number;
  [key: string]: any;
}

export async function POST(request: NextRequest) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    const body = await request.json();
    console.log('🚀 Fechando comanda completo:', body);
    
    const { comandaId, mesaId, numeroMesa, dados } = body;
    
    if (!comandaId || !numeroMesa) {
      return NextResponse.json(
        { success: false, error: 'comandaId e numeroMesa são obrigatórios' },
        { status: 400 }
      );
    }
    
    await client.connect();
    const db = client.db(DB_NAME);
    
    // 1. Buscar a comanda
    let comanda: Comanda | null = null;
    
    // Tentar por ObjectId primeiro
    if (ObjectId.isValid(comandaId)) {
      comanda = await db.collection<Comanda>('comandas').findOne({
        _id: new ObjectId(comandaId)
      });
    }
    
    // Se não encontrou, tentar pelo campo id (string)
    if (!comanda) {
      comanda = await db.collection<Comanda>('comandas').findOne({
        $or: [
          { id: comandaId },
          { _id: comandaId }
        ]
      });
    }
    
    if (!comanda) {
      return NextResponse.json(
        { success: false, error: 'Comanda não encontrada' },
        { status: 404 }
      );
    }
    
    console.log('📋 Comanda encontrada:', {
      _id: comanda._id.toString(),
      mesaId: comanda.mesaId,
      numeroMesa: comanda.numeroMesa,
      total: comanda.total,
      status: comanda.status
    });
    
    // Usar o total da comanda ou dos dados recebidos
    const totalComanda = dados?.total || comanda.total || 0;
    
    // 2. Mover para histórico
    const comandaFechada = {
      ...comanda,
      dataFechamento: new Date(),
      status: 'fechada',
      numeroMesa: numeroMesa,
      mesaId: mesaId || comanda.mesaId,
      total: totalComanda
    };
    
    await db.collection('comandas_fechadas').insertOne(comandaFechada);
    
    // 3. Remover da coleção de comandas abertas
    let deleteResult;
    if (comanda._id instanceof ObjectId) {
      deleteResult = await db.collection('comandas').deleteOne({
        _id: comanda._id
      });
    } else {
      deleteResult = await db.collection('comandas').deleteOne({
        id: comandaId
      });
    }
    
    console.log(`🗑️ Comanda removida: ${deleteResult.deletedCount} documento(s)`);
    
    // 4. Atualizar mesa para 'livre' (CRÍTICO!)
    const mesasCollection = db.collection('mesas');
    const numeroFormatado = numeroMesa.toString().padStart(2, '0');
    
    console.log(`🔄 Atualizando mesa ${numeroFormatado} para livre...`);
    
    const updateResult = await mesasCollection.updateOne(
      { numero: numeroFormatado },
      {
        $set: {
          status: 'livre',
          totalComanda: 0,
          quantidadeItens: 0,
          atualizadoEm: new Date()
        }
      }
    );
    
    if (updateResult.matchedCount === 0 && numeroFormatado !== numeroMesa) {
      await mesasCollection.updateOne(
        { numero: numeroMesa },
        {
          $set: {
            status: 'livre',
            totalComanda: 0,
            quantidadeItens: 0,
            atualizadoEm: new Date()
          }
        }
      );
    }
    
    console.log(`✅ Mesa atualizada:`, {
      numeroFormatado,
      matched: updateResult.matchedCount,
      modified: updateResult.modifiedCount
    });
    
    // 5. Registrar no caixa (opcional) - CORREÇÃO AQUI
    if (totalComanda > 0) {
      const caixaCollection = db.collection<Caixa>('caixas');
      const caixa = await caixaCollection.findOne({ status: 'aberto' });
      
      if (caixa) {
        // Criar objeto de venda corretamente tipado
        const novaVenda: Venda = {
          comandaId: comandaId,
          mesa: numeroFormatado,
          valor: totalComanda,
          data: new Date(),
          tipo: 'comanda_fechada'
        };
        
        // CORREÇÃO: Usar operador $push corretamente tipado
        await caixaCollection.updateOne(
          { _id: caixa._id },
          { 
            $push: { vendas: novaVenda } as any, // Usar 'as any' para evitar erro de tipagem
            $inc: {
              totalVendas: totalComanda,
              saldoAtual: totalComanda
            }
          }
        );
        console.log(`💰 Registrado no caixa: R$ ${totalComanda.toFixed(2)}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Comanda fechada com sucesso',
      data: {
        comandaId,
        mesaAtualizada: updateResult.modifiedCount > 0,
        mesaNumero: numeroFormatado,
        total: totalComanda,
        comandaRemovida: deleteResult.deletedCount > 0,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao fechar comanda completo:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

// Método GET para teste
export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Endpoint /api/comandas/fechar-completo está funcionando',
    instructions: 'Use POST com { comandaId, mesaId, numeroMesa, dados }',
    timestamp: new Date().toISOString()
  });
}