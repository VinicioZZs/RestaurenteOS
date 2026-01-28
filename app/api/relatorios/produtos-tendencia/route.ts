// app/api/relatorios/produtos-tendencia/route.ts
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const db = await connectDB();
    if (!db) {
      return NextResponse.json({
        success: false,
        error: 'Erro de conexão com o banco de dados'
      }, { status: 500 });
    }
    
    const { searchParams } = new URL(request.url);
    const produtoId = searchParams.get('produtoId');
    const periodo = searchParams.get('periodo') || '30dias'; // 7dias, 30dias, 90dias
    
    if (!produtoId) {
      return NextResponse.json({
        success: false,
        error: 'ID do produto é obrigatório'
      }, { status: 400 });
    }
    
    // Calcular data base
    const hoje = new Date();
    let dataInicio = new Date();
    
    switch (periodo) {
      case '7dias':
        dataInicio.setDate(hoje.getDate() - 7);
        break;
      case '30dias':
        dataInicio.setDate(hoje.getDate() - 30);
        break;
      case '90dias':
        dataInicio.setDate(hoje.getDate() - 90);
        break;
      default:
        dataInicio.setDate(hoje.getDate() - 30);
    }
    
    // Buscar vendas de comanda com este produto
    const vendasComanda = await db.collection('comandas_fechadas').aggregate([
      {
        $match: {
          fechadoEm: { $gte: dataInicio },
          'itens.produtoId': produtoId
        }
      },
      {
        $unwind: '$itens'
      },
      {
        $match: {
          'itens.produtoId': produtoId
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$fechadoEm" }
          },
          quantidade: { $sum: '$itens.quantidade' },
          total: { $sum: { $multiply: ['$itens.quantidade', '$itens.precoUnitario'] } }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]).toArray();
    
    // Buscar vendas do balcão com este produto
    const vendasBalcao = await db.collection('vendas_balcao_completas').aggregate([
      {
        $match: {
          dataVenda: { $gte: dataInicio },
          'itens.produtoId': produtoId
        }
      },
      {
        $unwind: '$itens'
      },
      {
        $match: {
          'itens.produtoId': produtoId
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$dataVenda" }
          },
          quantidade: { $sum: '$itens.quantidade' },
          total: { $sum: { $multiply: ['$itens.quantidade', '$itens.precoUnitario'] } }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]).toArray();
    
    // Combinar resultados
    const vendasPorDia = [...vendasComanda, ...vendasBalcao];
    const vendasAgrupadas: Record<string, any> = {};
    
    vendasPorDia.forEach(venda => {
      const dia = venda._id;
      if (!vendasAgrupadas[dia]) {
        vendasAgrupadas[dia] = {
          periodo: dia,
          quantidade: 0,
          total: 0
        };
      }
      vendasAgrupadas[dia].quantidade += venda.quantidade;
      vendasAgrupadas[dia].total += venda.total;
    });
    
    const resultado = Object.values(vendasAgrupadas).sort((a: any, b: any) => 
      a.periodo.localeCompare(b.periodo)
    );
    
    // Calcular estatísticas
    const quantidades = resultado.map((item: any) => item.quantidade);
    const totalQuantidade = quantidades.reduce((a, b) => a + b, 0);
    const mediaQuantidade = quantidades.length > 0 ? totalQuantidade / quantidades.length : 0;
    
    const totais = resultado.map((item: any) => item.total);
    const totalValor = totais.reduce((a, b) => a + b, 0);
    const mediaValor = totais.length > 0 ? totalValor / totais.length : 0;
    
    // Calcular variação (últimos 7 dias vs anteriores)
    const ultimos7Dias = resultado.slice(-7);
    const anteriores7Dias = resultado.slice(-14, -7);
    
    const mediaUltimos7 = ultimos7Dias.length > 0 ? 
      ultimos7Dias.reduce((sum: number, item: any) => sum + item.quantidade, 0) / ultimos7Dias.length : 0;
    const mediaAnteriores = anteriores7Dias.length > 0 ? 
      anteriores7Dias.reduce((sum: number, item: any) => sum + item.quantidade, 0) / anteriores7Dias.length : 0;
    
    const variacao = mediaAnteriores > 0 ? 
      ((mediaUltimos7 - mediaAnteriores) / mediaAnteriores) * 100 : 0;
    
    return NextResponse.json({
      success: true,
      data: {
        tendencia: resultado,
        estatisticas: {
          totalPeriodo: totalQuantidade,
          mediaDiaria: mediaQuantidade,
          mediaValor: mediaValor,
          variacao: variacao,
          diasComVenda: quantidades.length,
          diasAnalisados: Math.ceil((hoje.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24))
        }
      }
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao buscar tendência:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message
      },
      { status: 500 }
    );
  }
}