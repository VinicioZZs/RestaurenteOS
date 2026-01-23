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
    
    console.log('📋 Parâmetros recebidos:', { periodo, dataInicio, dataFim });
    
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
          ticketMedio: 0,
          produtosMaisVendidos: [],
          categoriasMaisVendidas: [],
          vendasPorPeriodo: [],
          mesasMaisUtilizadas: [],
          comandasFechadas: []
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
    
    console.log('🔍 Filtro aplicado:', JSON.stringify(filtroData, null, 2));
    
    // Busca comandas fechadas
    const comandasFechadas = await ComandaFechada.find(filtroData)
      .sort({ fechadoEm: -1 })
      .lean();
    
    console.log(`✅ ${comandasFechadas.length} comandas encontradas após filtro`);
    
    // Se não tem comandas no período, retorna vazio
    if (comandasFechadas.length === 0) {
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
    
    // Cálculos
    const produtosMap: Record<string, any> = {};
    const categoriasMap: Record<string, any> = {};
    const mesasMap: Record<string, any> = {};
    const periodoMap: Record<string, any> = {};
    
    let totalVendas = 0;
    
    comandasFechadas.forEach((comanda: any) => {
      totalVendas += comanda.total || 0;
      
      // Por mesa
      const mesaNum = comanda.numeroMesa || 'N/A';
      if (!mesasMap[mesaNum]) {
        mesasMap[mesaNum] = {
          mesa: mesaNum,
          quantidade: 0,
          total: 0
        };
      }
      mesasMap[mesaNum].quantidade += 1;
      mesasMap[mesaNum].total += comanda.total || 0;
      
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
          quantidade: 0
        };
      }
      periodoMap[periodoKey].total += comanda.total || 0;
      periodoMap[periodoKey].quantidade += 1;
      
      // Processa itens (baseado na sua estrutura REAL)
      comanda.itens?.forEach((item: any) => {
        if (!item) return;
        
        // Produto
        const produtoId = item.produtoId?.toString() || item.nome || 'desconhecido';
        const produtoNome = item.nome || 'Produto sem nome';
        
        if (!produtosMap[produtoId]) {
          produtosMap[produtoId] = {
            id: produtoId,
            nome: produtoNome,
            quantidade: 0,
            total: 0,
            categoria: item.categoria || 'Sem categoria'
          };
        }
        
        const quantidade = item.quantidade || 1;
        const precoUnitario = item.precoUnitario || 0;
        
        produtosMap[produtoId].quantidade += quantidade;
        produtosMap[produtoId].total += precoUnitario * quantidade;
        
        // Categoria
        const categoria = item.categoria || 'Sem categoria';
        if (!categoriasMap[categoria]) {
          categoriasMap[categoria] = {
            nome: categoria,
            quantidade: 0,
            total: 0
          };
        }
        categoriasMap[categoria].quantidade += quantidade;
        categoriasMap[categoria].total += precoUnitario * quantidade;
      });
    });
    
    // Converter para arrays ordenados
    const produtosMaisVendidos = Object.values(produtosMap)
      .sort((a: any, b: any) => b.quantidade - a.quantidade)
      .slice(0, 10);
    
    const categoriasMaisVendidas = Object.values(categoriasMap)
      .sort((a: any, b: any) => b.total - a.total);
    
    const mesasMaisUtilizadas = Object.values(mesasMap)
      .sort((a: any, b: any) => b.quantidade - a.quantidade)
      .slice(0, 5);
    
    // Ordenar período
    const vendasPorPeriodo = Object.values(periodoMap).sort((a: any, b: any) => {
      if (periodo === 'hoje') {
        return a.periodo.localeCompare(b.periodo);
      }
      const [diaA, mesA, anoA] = a.periodo.split('/').map(Number);
      const [diaB, mesB, anoB] = b.periodo.split('/').map(Number);
      return new Date(anoA, mesA - 1, diaA).getTime() - new Date(anoB, mesB - 1, diaB).getTime();
    });
    
    const totalComandas = comandasFechadas.length;
    const ticketMedio = totalComandas > 0 ? totalVendas / totalComandas : 0;
    
    console.log('📈 Estatísticas calculadas:', {
      totalVendas,
      totalComandas,
      ticketMedio,
      produtos: produtosMaisVendidos.length,
      categorias: categoriasMaisVendidas.length,
      periodos: vendasPorPeriodo.length
    });
    
    return NextResponse.json({
      success: true,
      data: {
        totalVendas,
        totalComandas,
        ticketMedio,
        produtosMaisVendidos,
        categoriasMaisVendidas,
        vendasPorPeriodo,
        mesasMaisUtilizadas,
        comandasFechadas: comandasFechadas.slice(0, 20) // Limita para performance
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