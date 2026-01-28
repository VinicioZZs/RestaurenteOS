// app/api/balcao/venda-completa/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  console.log('🏪 API BALCÃO COMPLETA - Processando venda completa');
  
  try {
    // 1. Pegar os dados
    const dados = await request.json();
    console.log('📦 Dados recebidos:', {
      total: dados.total,
      quantidadeItens: dados.itens?.length,
      operador: dados.operador,
      pagadores: dados.pagadores?.length
    });
    
    // 2. Conectar ao banco
    const db = await connectDB();
    if (!db) {
      return NextResponse.json({ 
        success: false,
        error: 'Erro de conexão com o banco de dados'
      }, { status: 500 });
    }
    
    // 3. Verificar se tem caixa aberto
    const caixa = await db.collection('caixas').findOne({ status: 'aberto' });
    if (!caixa) {
      return NextResponse.json({ 
        success: false,
        error: 'Caixa fechado. É necessário abrir o caixa antes de realizar vendas.'
      }, { status: 400 });
    }
    
    // 4. Preparar dados da venda completa
    const vendaCompletaData = {
      tipo: 'balcao',
      itens: dados.itens || [],
      pagadores: dados.pagadores || [],
      total: dados.total || 0,
      totalOriginal: dados.itens?.reduce((sum: number, item: any) => 
        sum + (item.precoUnitario * item.quantidade), 0) || 0,
      descontos: dados.pagadores?.reduce((sum: number, p: any) => sum + (p.desconto || 0), 0) || 0,
      acrescimos: dados.pagadores?.reduce((sum: number, p: any) => sum + (p.acrescimo || 0), 0) || 0,
      formasPagamento: dados.formasPagamentoUtilizadas || [],
      operador: dados.operador || 'Balcão',
      caixaId: caixa._id,
      caixaNumero: caixa.numero || 1,
      status: 'finalizado',
      dataVenda: new Date(),
      criadoEm: new Date(),
      atualizadoEm: new Date()
    };
    
    console.log('💾 Salvando venda completa no banco...');
    
    // 5. Salvar na coleção vendas_balcao_completas
    let vendaId = null;
    try {
      const resultado = await db.collection('vendas_balcao_completas').insertOne(vendaCompletaData);
      vendaId = resultado.insertedId;
      console.log('✅ Venda completa salva com ID:', vendaId);
    } catch (error) {
      console.error('❌ Erro ao salvar venda completa:', error);
      return NextResponse.json({ 
        success: false,
        error: 'Erro ao salvar venda no banco de dados'
      }, { status: 500 });
    }
    
    // 6. Atualizar saldo do caixa
    try {
  const novoSaldo = (caixa.saldoAtual || 0) + (dados.total || 0);
  
  // Buscar o caixa atual para pegar movimentações existentes
  const caixaAtual = await db.collection('caixas').findOne({ _id: caixa._id });
  const movimentacoes = caixaAtual?.movimentacoes || [];
  
  // Adicionar nova movimentação
  movimentacoes.push({
    tipo: 'entrada',
    valor: dados.total || 0,
    descricao: `Venda balcão #${vendaId?.toString().slice(-6)}`,
    operador: dados.operador || 'Balcão',
    data: new Date(),
    vendaId: vendaId
  });
  
  // Atualizar tudo de uma vez
  await db.collection('caixas').updateOne(
    { _id: caixa._id },
    { 
      $set: { 
        saldoAtual: novoSaldo,
        atualizadoEm: new Date(),
        movimentacoes: movimentacoes
      }
    }
  );
  console.log('💰 Saldo do caixa atualizado para:', novoSaldo);
} catch (error) {
  console.error('⚠️ Erro ao atualizar caixa:', error);
}
    
    // 7. Registrar no histórico
    try {
      await db.collection('historico_vendas').insertOne({
        vendaId,
        tipo: 'balcao',
        total: dados.total || 0,
        operador: dados.operador || 'Balcão',
        dataVenda: new Date(),
        formasPagamento: dados.formasPagamentoUtilizadas?.map((fp: any) => fp.nome) || [],
        caixaNumero: caixa.numero || 1
      });
    } catch (error) {
      console.error('⚠️ Erro ao registrar histórico:', error);
    }
    
    // 8. Retornar sucesso
    return NextResponse.json({
      success: true,
      message: '✅ Venda do balcão realizada com sucesso!',
      data: {
        vendaId: vendaId,
        numero: 'B' + Date.now().toString().slice(-6),
        total: dados.total || 0,
        data: new Date().toLocaleString('pt-BR'),
        formasPagamento: dados.formasPagamentoUtilizadas?.map((fp: any) => fp.nome) || [],
        caixaNumero: caixa.numero || 1
      }
    });
    
  } catch (error: any) {
    console.error('💥 ERRO CRÍTICO NA VENDA COMPLETA:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro ao processar venda completa'
    }, { status: 500 });
  }
}