// app/api/relatorios/route.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import ComandaFechada from '@/app/models/comanda_fechada';

export async function GET(request: Request) {
  try {
    console.log('🚀 Iniciando busca de relatórios...');
    const db = await connectDB(); // Mova esta linha para cá
    if (!db) {
      return NextResponse.json({
        success: false,
        error: 'Erro de conexão com o banco de dados'
      }, { status: 500 });
    }
    
    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo') || 'hoje';
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    const tipoVenda = searchParams.get('tipoVenda') || 'todos'; // 'todos', 'comanda', 'balcao'
    
    console.log('📋 Parâmetros recebidos:', { periodo, dataInicio, dataFim, tipoVenda });
    
    // Função para criar filtro de data
    const criarFiltroData = (baseDate?: Date) => {
      let filtro: any = {};
      const hoje = baseDate || new Date();
      
      switch (periodo) {
        case 'hoje':
          const inicioHoje = new Date(hoje.setHours(0, 0, 0, 0));
          const fimHoje = new Date();
          fimHoje.setHours(23, 59, 59, 999);
          filtro = {
            $gte: inicioHoje,
            $lt: fimHoje
          };
          break;
        case 'ontem':
          const ontem = new Date(hoje);
          ontem.setDate(ontem.getDate() - 1);
          const inicioOntem = new Date(ontem.setHours(0, 0, 0, 0));
          const fimOntem = new Date(ontem.setHours(23, 59, 59, 999));
          filtro = {
            $gte: inicioOntem,
            $lt: fimOntem
          };
          break;
        case 'semana':
          const semanaPassada = new Date(hoje);
          semanaPassada.setDate(semanaPassada.getDate() - 7);
          filtro = {
            $gte: semanaPassada
          };
          break;
        case 'mes':
          const mesPassado = new Date(hoje);
          mesPassado.setMonth(mesPassado.getMonth() - 1);
          filtro = {
            $gte: mesPassado
          };
          break;
        case 'personalizado':
          if (dataInicio && dataFim) {
            const inicio = new Date(dataInicio);
            const fim = new Date(dataFim);
            fim.setHours(23, 59, 59, 999);
            filtro = {
              $gte: inicio,
              $lte: fim
            };
          }
          break;
      }
      
      return filtro;
    };

    // Arrays para armazenar dados combinados
    let todasVendas: any[] = [];
    let filtroComanda: any = {};
    let filtroBalcao: any = {};

    // Aplicar filtro de data para ambas as coleções
    const filtroData = criarFiltroData();
    if (Object.keys(filtroData).length > 0) {
      filtroComanda.fechadoEm = filtroData;
      filtroBalcao.dataVenda = filtroData;
    }

    // 1. Buscar vendas de comanda
    if (tipoVenda === 'todos' || tipoVenda === 'comanda') {
      const comandasFechadas = await ComandaFechada.find(filtroComanda)
        .sort({ fechadoEm: -1 })
        .lean();
      
      console.log(`✅ ${comandasFechadas.length} vendas de comanda encontradas`);
      
      // Transformar comandas no formato unificado
      comandasFechadas.forEach(comanda => {
        todasVendas.push({
          id: comanda._id,
          tipo: 'comanda',
          numeroMesa: comanda.numeroMesa || 'N/A',
          nomeMesa: comanda.nomeMesa || 'Comanda',
          total: comanda.total || 0,
          itens: comanda.itens || [],
          pagamentos: comanda.pagamentos || [],
          fechadoEm: comanda.fechadoEm,
          operador: comanda.operador || 'Sistema',
          status: 'finalizado'
        });
      });
    }

    // 2. Buscar vendas do balcão
     if (tipoVenda === 'todos' || tipoVenda === 'balcao') {
      // db já está definido aqui
      const vendasBalcao = await db.collection('vendas_balcao_completas')
        .find(filtroBalcao)
        .sort({ dataVenda: -1 })
        .toArray();
      
      console.log(`✅ ${vendasBalcao.length} vendas do balcão encontradas`);
      
      // Transformar vendas do balcão no formato unificado
      vendasBalcao.forEach(venda => {
        todasVendas.push({
          id: venda._id,
          tipo: 'balcao',
          numeroMesa: 'BALCÃO',
          nomeMesa: 'Balcão',
          total: venda.total || 0,
          itens: venda.itens || [],
          pagamentos: venda.pagadores?.map((p: any) => ({
            forma: p.formaPagamento || p.nome || 'Dinheiro',
            valor: p.valor || 0
          })) || [],
          fechadoEm: venda.dataVenda || venda.criadoEm,
          operador: venda.operador || 'Balcão',
          status: venda.status || 'finalizado'
        });
      });
    }

    console.log(`📊 Total de vendas combinadas: ${todasVendas.length}`);
    
    // Se não tem vendas no período, retorna vazio
    if (todasVendas.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalVendas: 0,
          totalComandas: 0,
          totalBalcao: 0,
          ticketMedio: 0,
          produtosMaisVendidos: [],
          categoriasMaisVendidas: [],
          vendasPorPeriodo: [],
          mesasMaisUtilizadas: [],
          comandasFechadas: [],
          resumoPorTipoVenda: {
            comanda: { quantidade: 0, total: 0 },
            balcao: { quantidade: 0, total: 0 }
          },
          distribuiçãoVendas: {
            comanda: 0,
            balcao: 0
          }
        }
      });
    }
    
    // Cálculos
    const produtosMap: Record<string, any> = {};
    const categoriasMap: Record<string, any> = {};
    const mesasMap: Record<string, any> = {};
    const periodoMap: Record<string, any> = {};
    
    let totalVendas = 0;
    let totalComandaVendas = 0;
    let totalBalcaoVendas = 0;
    let comandaCount = 0;
    let balcaoCount = 0;
    
    todasVendas.forEach((venda: any) => {
      const vendaTotal = venda.total || 0;
      totalVendas += vendaTotal;
      
      // Contar por tipo de venda
      if (venda.tipo === 'balcao') {
        totalBalcaoVendas += vendaTotal;
        balcaoCount += 1;
      } else {
        totalComandaVendas += vendaTotal;
        comandaCount += 1;
      }
      
      // Por mesa
      const mesaKey = `${venda.tipo}-${venda.numeroMesa}`;
      if (!mesasMap[mesaKey]) {
        mesasMap[mesaKey] = {
          mesa: venda.numeroMesa,
          nomeMesa: venda.nomeMesa,
          tipo: venda.tipo,
          quantidade: 0,
          total: 0
        };
      }
      mesasMap[mesaKey].quantidade += 1;
      mesasMap[mesaKey].total += vendaTotal;
      
      // Por período
      const data = new Date(venda.fechadoEm);
      let periodoKey: string;
      
      if (periodo === 'hoje') {
        periodoKey = `${data.getHours()}:00`;
      } else {
        periodoKey = data.toLocaleDateString('pt-BR');
      }
      
      if (!periodoMap[periodoKey]) {
        periodoMap[periodoKey] = {
          periodo: periodoKey,
          total: 0,
          quantidade: 0,
          comandas: 0,
          balcao: 0
        };
      }
      periodoMap[periodoKey].total += vendaTotal;
      periodoMap[periodoKey].quantidade += 1;
      
      // Contar por tipo no período
      if (venda.tipo === 'balcao') {
        periodoMap[periodoKey].balcao += 1;
      } else {
        periodoMap[periodoKey].comandas += 1;
      }
      
      // Processa itens
      venda.itens?.forEach((item: any) => {
        if (!item) return;
        
        // Produto
        const produtoId = item.produtoId?.toString() || 
                         item.produto?.id?.toString() || 
                         item.id?.toString() || 
                         'desconhecido';
        
        const produtoNome = item.produtoNome || 
                          item.produto?.nome || 
                          item.nome || 
                          'Produto sem nome';
        
        const produtoCategoria = item.categoria || 
                               item.produto?.categoria || 
                               'Sem categoria';
        
        if (!produtosMap[produtoId]) {
          produtosMap[produtoId] = {
            id: produtoId,
            nome: produtoNome,
            quantidade: 0,
            total: 0,
            categoria: produtoCategoria,
            vendasComanda: 0,
            vendasBalcao: 0
          };
        }
        
        const quantidade = item.quantidade || 1;
        const precoUnitario = item.precoUnitario || item.preco || 0;
        
        produtosMap[produtoId].quantidade += quantidade;
        produtosMap[produtoId].total += precoUnitario * quantidade;
        
        // Contar por tipo de venda no produto
        if (venda.tipo === 'balcao') {
          produtosMap[produtoId].vendasBalcao += quantidade;
        } else {
          produtosMap[produtoId].vendasComanda += quantidade;
        }
        
        // Categoria
        const categoria = produtoCategoria;
        if (!categoriasMap[categoria]) {
          categoriasMap[categoria] = {
            nome: categoria,
            quantidade: 0,
            total: 0,
            vendasComanda: 0,
            vendasBalcao: 0
          };
        }
        categoriasMap[categoria].quantidade += quantidade;
        categoriasMap[categoria].total += precoUnitario * quantidade;
        
        // Contar por tipo de venda na categoria
        if (venda.tipo === 'balcao') {
          categoriasMap[categoria].vendasBalcao += quantidade;
        } else {
          categoriasMap[categoria].vendasComanda += quantidade;
        }
      });
    });
    
    // Converter para arrays ordenados
    const produtosMaisVendidos = Object.values(produtosMap)
      .sort((a: any, b: any) => b.quantidade - a.quantidade)
      .slice(0, 15);
    
    const categoriasMaisVendidas = Object.values(categoriasMap)
      .sort((a: any, b: any) => b.total - a.total);
    
    const mesasMaisUtilizadas = Object.values(mesasMap)
      .sort((a: any, b: any) => b.quantidade - a.quantidade)
      .slice(0, 10);
    
    // Ordenar período
    const vendasPorPeriodo = Object.values(periodoMap).sort((a: any, b: any) => {
      if (periodo === 'hoje') {
        return a.periodo.localeCompare(b.periodo);
      }
      const [diaA, mesA, anoA] = a.periodo.split('/').map(Number);
      const [diaB, mesB, anoB] = b.periodo.split('/').map(Number);
      return new Date(anoA, mesA - 1, diaA).getTime() - new Date(anoB, mesB - 1, diaB).getTime();
    });
    
    const totalVendasCount = todasVendas.length;
    const ticketMedio = totalVendasCount > 0 ? totalVendas / totalVendasCount : 0;
    
    // Resumo por tipo de venda
    const resumoPorTipoVenda = {
      comanda: { 
        quantidade: comandaCount, 
        total: totalComandaVendas,
        ticketMedio: comandaCount > 0 ? totalComandaVendas / comandaCount : 0
      },
      balcao: { 
        quantidade: balcaoCount, 
        total: totalBalcaoVendas,
        ticketMedio: balcaoCount > 0 ? totalBalcaoVendas / balcaoCount : 0
      }
    };
    
    // Preparar dados para a tabela de vendas detalhadas
    const vendasDetalhadas = todasVendas.map(venda => ({
      _id: venda.id,
      tipo: venda.tipo,
      numeroMesa: venda.numeroMesa,
      nomeMesa: venda.nomeMesa,
      total: venda.total,
      itens: venda.itens,
      pagamentos: venda.pagamentos,
      fechadoEm: venda.fechadoEm,
      operador: venda.operador,
      status: venda.status
    }));
    
    console.log('📈 Estatísticas calculadas:', {
      totalVendas,
      totalComandas: comandaCount,
      totalBalcao: balcaoCount,
      totalVendasCount,
      ticketMedio,
      produtos: produtosMaisVendidos.length,
      categorias: categoriasMaisVendidas.length,
      periodos: vendasPorPeriodo.length
    });
    
    return NextResponse.json({
      success: true,
      data: {
        totalVendas,
        totalComandas: comandaCount,
        totalBalcao: balcaoCount,
        ticketMedio,
        produtosMaisVendidos,
        categoriasMaisVendidas,
        vendasPorPeriodo,
        mesasMaisUtilizadas,
        comandasFechadas: vendasDetalhadas.slice(0, 50), // Usando dados combinados
        resumoPorTipoVenda,
        distribuiçãoVendas: {
          comanda: totalVendas > 0 ? Math.round((totalComandaVendas / totalVendas) * 100) : 0,
          balcao: totalVendas > 0 ? Math.round((totalBalcaoVendas / totalVendas) * 100) : 0
        },
        // Adicionar informações extras
        tiposVenda: [
          { tipo: 'comanda', quantidade: comandaCount, total: totalComandaVendas },
          { tipo: 'balcao', quantidade: balcaoCount, total: totalBalcaoVendas }
        ]
      }
    });
    
  } catch (error: any) {
    console.error('❌ Erro completo:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}