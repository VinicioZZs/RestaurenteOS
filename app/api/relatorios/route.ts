import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import ComandaFechada from '@/app/models/comanda_fechada';

export async function GET(request: Request) {
  try {
    console.log('🚀 Iniciando busca de relatórios...');
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo') || 'hoje';
    const dataInicio = searchParams.get('dataInicio');
    const dataFim = searchParams.get('dataFim');
    const tipoVenda = searchParams.get('tipoVenda'); // Novo: 'todos', 'comanda', 'balcao'
    
    console.log('📋 Parâmetros recebidos:', { periodo, dataInicio, dataFim, tipoVenda });
    
    // Conta total de documentos
    const totalGeral = await ComandaFechada.countDocuments();
    console.log(`📊 Total de comandas na coleção: ${totalGeral}`);
    
    if (totalGeral === 0) {
      console.log('⚠️ Coleção "comandas_fechadas" está vazia');
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
          }
        }
      });
    }
    
    // Filtro de data
    let filtroData: any = {};
    const hoje = new Date();
    
    switch (periodo) {
      case 'hoje':
        const inicioHoje = new Date(hoje.setHours(0, 0, 0, 0));
        const fimHoje = new Date();
        fimHoje.setHours(23, 59, 59, 999);
        filtroData = {
          fechadoEm: {
            $gte: inicioHoje,
            $lt: fimHoje
          }
        };
        break;
      case 'ontem':
        const ontem = new Date();
        ontem.setDate(ontem.getDate() - 1);
        const inicioOntem = new Date(ontem.setHours(0, 0, 0, 0));
        const fimOntem = new Date(ontem.setHours(23, 59, 59, 999));
        filtroData = {
          fechadoEm: {
            $gte: inicioOntem,
            $lt: fimOntem
          }
        };
        break;
      case 'semana':
        const semanaPassada = new Date();
        semanaPassada.setDate(semanaPassada.getDate() - 7);
        filtroData = {
          fechadoEm: { $gte: semanaPassada }
        };
        break;
      case 'mes':
        const mesPassado = new Date();
        mesPassado.setMonth(mesPassado.getMonth() - 1);
        filtroData = {
          fechadoEm: { $gte: mesPassado }
        };
        break;
      case 'personalizado':
        if (dataInicio && dataFim) {
          const inicio = new Date(dataInicio);
          const fim = new Date(dataFim);
          fim.setHours(23, 59, 59, 999);
          
          filtroData = {
            fechadoEm: {
              $gte: inicio,
              $lte: fim
            }
          };
        }
        break;
    }
    
    // 🔥 ADICIONAR FILTRO POR TIPO DE VENDA (comanda ou balcão)
    if (tipoVenda && tipoVenda !== 'todos') {
      filtroData.tipo = tipoVenda;
    }
    
    console.log('🔍 Filtro aplicado:', JSON.stringify(filtroData, null, 2));
    
    // Busca comandas fechadas E vendas de balcão
    const comandasFechadas = await ComandaFechada.find(filtroData)
      .sort({ fechadoEm: -1 })
      .lean();
    
    console.log(`✅ ${comandasFechadas.length} vendas encontradas após filtro`);
    
    // Se não tem vendas no período, retorna vazio
    if (comandasFechadas.length === 0) {
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
    
    comandasFechadas.forEach((comanda: any) => {
      const vendaTotal = comanda.total || 0;
      totalVendas += vendaTotal;
      
      // Contar por tipo de venda
      if (comanda.tipo === 'balcao') {
        totalBalcaoVendas += vendaTotal;
        balcaoCount += 1;
      } else {
        totalComandaVendas += vendaTotal;
        comandaCount += 1;
      }
      
      // Por mesa (só para comandas)
      const mesaNum = comanda.numeroMesa || 'BALCÃO';
      if (!mesasMap[mesaNum]) {
        mesasMap[mesaNum] = {
          mesa: mesaNum,
          tipo: comanda.tipo || 'comanda',
          quantidade: 0,
          total: 0
        };
      }
      mesasMap[mesaNum].quantidade += 1;
      mesasMap[mesaNum].total += vendaTotal;
      
      // Por período
      const data = new Date(comanda.fechadoEm);
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
      if (comanda.tipo === 'balcao') {
        periodoMap[periodoKey].balcao += 1;
      } else {
        periodoMap[periodoKey].comandas += 1;
      }
      
      // Processa itens (baseado na sua estrutura REAL)
      comanda.itens?.forEach((item: any) => {
        if (!item) return;
        
        // Produto
        const produtoId = item.produtoId?.toString() || item.produtoNome || item.nome || 'desconhecido';
        const produtoNome = item.produtoNome || item.nome || 'Produto sem nome';
        
        if (!produtosMap[produtoId]) {
          produtosMap[produtoId] = {
            id: produtoId,
            nome: produtoNome,
            quantidade: 0,
            total: 0,
            categoria: item.categoria || 'Sem categoria',
            vendasComanda: 0,
            vendasBalcao: 0
          };
        }
        
        const quantidade = item.quantidade || 1;
        const precoUnitario = item.precoUnitario || 0;
        
        produtosMap[produtoId].quantidade += quantidade;
        produtosMap[produtoId].total += precoUnitario * quantidade;
        
        // Contar por tipo de venda no produto
        if (comanda.tipo === 'balcao') {
          produtosMap[produtoId].vendasBalcao += quantidade;
        } else {
          produtosMap[produtoId].vendasComanda += quantidade;
        }
        
        // Categoria
        const categoria = item.categoria || 'Sem categoria';
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
        if (comanda.tipo === 'balcao') {
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
    
    const totalVendasCount = comandasFechadas.length;
    const ticketMedio = totalVendasCount > 0 ? totalVendas / totalVendasCount : 0;
    
    // Resumo por tipo de venda
    const resumoPorTipoVenda = {
      comanda: { quantidade: comandaCount, total: totalComandaVendas },
      balcao: { quantidade: balcaoCount, total: totalBalcaoVendas }
    };
    
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
        comandasFechadas: comandasFechadas.slice(0, 30), // Aumentei para 30
        resumoPorTipoVenda,
        // Novos campos para gráficos
        distribuiçãoVendas: {
          comanda: Math.round((totalComandaVendas / totalVendas) * 100) || 0,
          balcao: Math.round((totalBalcaoVendas / totalVendas) * 100) || 0
        }
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