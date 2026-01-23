import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import ComandaFechada from '@/app/models/comanda_fechada';

// CORREÇÃO DO ERRO DE BUILD:
// Força a rota a ser dinâmica, pois ela depende de searchParams (request.url)
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await connectDB();
    
    // 1. Captura parâmetros da URL
    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo') || 'hoje';
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    
    // 2. Define o filtro de data
    let filtroData: any = {};
    const hoje = new Date();
    
    switch (periodo) {
      case 'hoje':
        const inicioHoje = new Date(hoje.setHours(0, 0, 0, 0));
        const fimHoje = new Date();
        fimHoje.setHours(23, 59, 59, 999);
        filtroData = { fechadoEm: { $gte: inicioHoje, $lt: fimHoje } };
        break;
      case 'ontem':
        const ontem = new Date();
        ontem.setDate(ontem.getDate() - 1);
        const inicioOntem = new Date(ontem.setHours(0, 0, 0, 0));
        const fimOntem = new Date(ontem.setHours(23, 59, 59, 999));
        filtroData = { fechadoEm: { $gte: inicioOntem, $lt: fimOntem } };
        break;
      case 'semana':
        const semanaPassada = new Date();
        semanaPassada.setDate(semanaPassada.getDate() - 7);
        filtroData = { fechadoEm: { $gte: semanaPassada } };
        break;
      case 'mes':
        const mesPassado = new Date();
        mesPassado.setMonth(mesPassado.getMonth() - 1);
        filtroData = { fechadoEm: { $gte: mesPassado } };
        break;
      case 'personalizado':
        if (dataInicio && dataFim) {
          const inicio = new Date(dataInicio);
          const fim = new Date(dataFim);
          fim.setHours(23, 59, 59, 999);
          filtroData = { fechadoEm: { $gte: inicio, $lte: fim } };
        }
        break;
    }

    // 3. Busca no Banco de Dados
    const comandasFechadas = await ComandaFechada.find(filtroData)
      .sort({ fechadoEm: -1 })
      .lean();

    if (!comandasFechadas.length) {
      return NextResponse.json({
        success: true,
        data: {
          totalVendas: 0,
          totalComandas: 0,
          ticketMedio: 0,
          produtosMaisVendidos: [],
          categoriasMaisVendidas: [],
          vendasPorPeriodo: [],
          mesasMaisUtilizadas: [],
          comandasFechadas: []
        }
      });
    }

    // 4. Processamento dos Dados
    let totalVendas = 0;
    const produtosMap: any = {};
    const categoriasMap: any = {};
    const mesasMap: any = {};
    const periodoMap: any = {};

    comandasFechadas.forEach((comanda: any) => {
      totalVendas += comanda.total || 0;

      // Por Mesa
      const mesa = comanda.numeroMesa || 'Balcão';
      if (!mesasMap[mesa]) mesasMap[mesa] = { mesa, quantidade: 0, total: 0 };
      mesasMap[mesa].quantidade++;
      mesasMap[mesa].total += comanda.total || 0;

      // Por Período
      const data = new Date(comanda.fechadoEm);
      const chavePeriodo = periodo === 'hoje' 
        ? `${data.getHours().toString().padStart(2, '0')}:00`
        : data.toLocaleDateString('pt-BR');
        
      if (!periodoMap[chavePeriodo]) periodoMap[chavePeriodo] = { periodo: chavePeriodo, total: 0 };
      periodoMap[chavePeriodo].total += comanda.total || 0;

      // Itens
      comanda.itens?.forEach((item: any) => {
        const pNome = item.nome || 'Desconhecido';
        if (!produtosMap[pNome]) produtosMap[pNome] = { nome: pNome, quantidade: 0, total: 0 };
        produtosMap[pNome].quantidade += item.quantidade || 1;
        produtosMap[pNome].total += (item.precoUnitario || 0) * (item.quantidade || 1);

        const cat = item.categoria || 'Outros';
        if (!categoriasMap[cat]) categoriasMap[cat] = { nome: cat, quantidade: 0, total: 0 };
        categoriasMap[cat].quantidade += item.quantidade || 1;
        categoriasMap[cat].total += (item.precoUnitario || 0) * (item.quantidade || 1);
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        totalVendas,
        totalComandas: comandasFechadas.length,
        ticketMedio: totalVendas / comandasFechadas.length,
        produtosMaisVendidos: Object.values(produtosMap).sort((a: any, b: any) => b.quantidade - a.quantidade).slice(0, 10),
        categoriasMaisVendidas: Object.values(categoriasMap).sort((a: any, b: any) => b.total - a.total),
        vendasPorPeriodo: Object.values(periodoMap),
        mesasMaisUtilizadas: Object.values(mesasMap).sort((a: any, b: any) => b.quantidade - a.quantidade).slice(0, 5),
        comandasFechadas: comandasFechadas.slice(0, 50)
      }
    });

  } catch (error: any) {
    console.error('Erro API Relatórios:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}