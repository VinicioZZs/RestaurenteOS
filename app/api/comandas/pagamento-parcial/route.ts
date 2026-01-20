  // /app/api/comandas/pagamento-parcial/route.ts - VERSÃO CORRIGIDA COM TIPOS
  import { NextRequest, NextResponse } from 'next/server';
  import mongoose from 'mongoose';

  // Definir interfaces para TypeScript
  interface Venda {
    comandaId: string;
    mesaId: string;
    numeroMesa: string;
    valor: number;
    formasPagamento: any[];
    data: Date;
    tipo: string;
  }

  interface ComandaDocument {
    id: string;
    mesaId?: string;
    numeroMesa?: string;
    itens?: any[];
    pagadores?: any[];
    formasPagamento?: any[];
    total?: number;
    status?: string;
    _id?: mongoose.Types.ObjectId;
    [key: string]: any; // Para outras propriedades
  }

  interface CaixaDocument {
    _id: mongoose.Types.ObjectId;
    status: string;
    vendas?: Venda[];
    totalVendas?: number;
    saldoAtual?: number;
    [key: string]: any;
  }

  export async function POST(request: NextRequest) {
    console.log('🔄 POST /api/comandas/pagamento-parcial chamado');
    
    try {
      const MONGODB_URI = process.env.MONGODB_URI;
      
      if (!MONGODB_URI) {
        console.log('⚠️ MongoDB URI não configurada');
        return NextResponse.json(
          { success: false, message: 'Banco de dados não configurado' },
          { status: 503 }
        );
      }

      // Conecta ao MongoDB
      await mongoose.connect(MONGODB_URI, {
        dbName: 'restaurante',
      });

      if (!mongoose.connection || !mongoose.connection.db) {
        throw new Error('Não foi possível estabelecer conexão com o MongoDB');
      }

      const db = mongoose.connection.db;
      console.log('✅ Conectado ao MongoDB, banco:', db.databaseName);

      const body = await request.json();
      console.log('📦 Dados recebidos:', body);
      
      const { comandaId, dados, action } = body;

      if (!comandaId) {
        return NextResponse.json(
          { success: false, message: 'ID da comanda é obrigatório' },
          { status: 400 }
        );
      }

      const comandasCollection = db.collection<ComandaDocument>('comandas');
      const comandasFechadasCollection = db.collection('comandas_fechadas');
      
      // SE FOR FECHAMENTO TOTAL
      if (action === 'fechar') {
  console.log('🔒 Fechando comanda:', comandaId);
  
  // Buscar comanda
  const comanda = await comandasCollection.findOne({ id: comandaId });
  
  if (!comanda) {
    console.log('⚠️ Comanda não encontrada, criando básica');
    
    // Se não encontrou, criar uma básica com os dados fornecidos
    const novaComandaFechada = {
      id: comandaId,
      mesaId: dados.mesaId || dados.numeroMesa || `mesa-${Date.now()}`,
      numeroMesa: dados.numeroMesa || dados.mesaId || '00',
      itens: dados.itens || [],
      pagadores: dados.pagadores || [],
      total: dados.total || 0,
      formasPagamento: dados.formasPagamentoUtilizadas || [],
      dataFechamento: new Date(),
      status: 'fechada',
      criadoEm: new Date()
    };
    
    await comandasFechadasCollection.insertOne(novaComandaFechada);
    
    // 🔥 ATUALIZAR MESA (ADICIONE ESTA PARTE)
    try {
      const mesasCollection = db.collection('mesas');
      const numeroMesa = novaComandaFechada.numeroMesa;
      
      await mesasCollection.updateOne(
        { numero: numeroMesa },
        {
          $set: {
            status: 'livre',
            totalComanda: 0,
            quantidadeItens: 0,
            atualizadoEm: new Date()
          }
        },
        { upsert: true }
      );
      console.log(`✅ Mesa ${numeroMesa} atualizada para 'livre'`);
    } catch (mesaError) {
      console.error('❌ Erro ao atualizar mesa:', mesaError);
    }
    
    // Registrar no caixa
    const caixaCollection = db.collection<CaixaDocument>('caixas');
    const caixa = await caixaCollection.findOne({ status: 'aberto' });
    
    if (caixa) {
      const novaVenda: Venda = {
        comandaId,
        mesaId: novaComandaFechada.mesaId,
        numeroMesa: novaComandaFechada.numeroMesa,
        valor: novaComandaFechada.total,
        formasPagamento: novaComandaFechada.formasPagamento,
        data: new Date(),
        tipo: 'comanda_fechada'
      };
      
      await caixaCollection.updateOne(
        { _id: caixa._id },
        {
          $push: { vendas: novaVenda } as any,
          $inc: {
            totalVendas: novaComandaFechada.total || 0,
            saldoAtual: novaComandaFechada.total || 0
          }
        }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Comanda fechada com sucesso (criada do zero)',
      action: 'fechar',
      comandaId,
      timestamp: new Date().toISOString(),
    });
  }
  
  // Se encontrou a comanda, mover para histórico
  const comandaFechada = {
    ...comanda,
    pagadores: dados.pagadores || comanda.pagadores || [],
    formasPagamento: dados.formasPagamentoUtilizadas || comanda.formasPagamento || [],
    dataFechamento: new Date(),
    status: 'fechada'
  };
  
  await comandasFechadasCollection.insertOne(comandaFechada);
  
  // Remover da coleção de comandas abertas
  await comandasCollection.deleteOne({ id: comandaId });
  
  // 🔥🔥🔥 ADICIONE ESTA PARTE - ATUALIZAR MESA NO BANCO 🔥🔥🔥
  try {
  const mesasCollection = db.collection('mesas');
  const numeroMesaParaAtualizar = comandaFechada.numeroMesa || comandaFechada.mesaId || dados.numeroMesa || dados.mesaId;
  
  // Formatar o número da mesa (2 dígitos)
  const numeroMesaFormatado = numeroMesaParaAtualizar.toString().padStart(2, '0');
  
  console.log(`🔄 Atualizando mesa ${numeroMesaFormatado} para status 'livre'...`);
  
  const resultado = await mesasCollection.updateOne(
    { numero: numeroMesaFormatado },
    {
      $set: {
        status: 'livre',
        totalComanda: 0,
        quantidadeItens: 0,
        atualizadoEm: new Date()
      }
    }
  );
  
  if (resultado.matchedCount > 0) {
    console.log(`✅ Mesa ${numeroMesaFormatado} atualizada no banco`);
  } else {
    // Também tentar sem formatação (para compatibilidade)
    await mesasCollection.updateOne(
      { numero: numeroMesaParaAtualizar },
      {
        $set: {
          status: 'livre',
          totalComanda: 0,
          quantidadeItens: 0,
          atualizadoEm: new Date()
        }
      }
    );
    console.log(`✅ Mesa ${numeroMesaParaAtualizar} atualizada (sem formatação)`);
  }
  
  // 🔥 DISPARAR EVENTO PARA O DASHBOARD
  const mesaParaDashboard = {
    mesaId: comandaFechada.mesaId || 'desconhecido',
    numeroMesa: numeroMesaFormatado,
    comandaId: comandaId
  };
  
  // Salvar no localStorage como backup
  if (typeof window !== 'undefined') {
    localStorage.setItem(`mesa_fechada_${comandaId}`, JSON.stringify(mesaParaDashboard));
  }
  
} catch (mesaError) {
  console.error('❌ Erro ao atualizar mesa:', mesaError);
}
  
  // Registrar no caixa
  const caixaCollection = db.collection<CaixaDocument>('caixas');
  const caixa = await caixaCollection.findOne({ status: 'aberto' });
  
  if (caixa) {
    const mesaId = comanda.mesaId || comandaFechada.mesaId || dados.mesaId || 'desconhecido';
    const numeroMesa = comanda.numeroMesa || comandaFechada.numeroMesa || dados.numeroMesa || '00';
    const valor = dados.total || comanda.total || comandaFechada.total || 0;
    const formasPagamento = dados.formasPagamentoUtilizadas || comandaFechada.formasPagamento || [];
    
    const novaVenda: Venda = {
      comandaId,
      mesaId: mesaId as string,
      numeroMesa: numeroMesa as string,
      valor,
      formasPagamento,
      data: new Date(),
      tipo: 'comanda_fechada'
    };
    
    await caixaCollection.updateOne(
      { _id: caixa._id },
      {
        $push: { vendas: novaVenda } as any,
        $inc: {
          totalVendas: valor,
          saldoAtual: valor
        }
      }
    );
  }
  
  return NextResponse.json({
    success: true,
    message: 'Comanda fechada com sucesso',
    action: 'fechar',
    comandaId,
    mesaAtualizada: true, // Nova flag
    timestamp: new Date().toISOString(),
  });
}

    } catch (error: any) {
      console.error('❌ Erro no pagamento-parcial:', error);  
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'Erro interno do servidor',
          error: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  }

  // Adicione também um GET para teste
  export async function GET(request: NextRequest) {
    return NextResponse.json({
      success: true,
      message: 'Endpoint /api/comandas/pagamento-parcial está funcionando',
      status: 'online',
      timestamp: new Date().toISOString()
    });
  }