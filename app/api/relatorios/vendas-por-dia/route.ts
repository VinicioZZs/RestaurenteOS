// app/api/relatorios/vendas-por-dia/route.ts
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
    const diasSelecionados = searchParams.get('dias')?.split(',').map(Number) || [0,1,2,3,4,5,6]; // 0=Domingo, 1=Segunda...
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
    
    // Buscar vendas de comanda
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
        $addFields: {
          diaSemana: { $dayOfWeek: '$fechadoEm' } // 1=Domingo, 2=Segunda...
        }
      },
      {
        $group: {
          _id: '$diaSemana',
          quantidade: { $sum: '$itens.quantidade' },
          total: { $sum: { $multiply: ['$itens.quantidade', '$itens.precoUnitario'] } },
          diasCount: { $addToSet: { $dateToString: { format: "%Y-%m-%d", date: "$fechadoEm" } } }
        }
      },
      {
        $project: {
          diaSemana: '$_id',
          quantidade: 1,
          total: 1,
          diasUnicos: { $size: '$diasCount' }
        }
      }
    ]).toArray();
    
    // Buscar vendas do balcão
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
        $addFields: {
          diaSemana: { $dayOfWeek: '$dataVenda' }
        }
      },
      {
        $group: {
          _id: '$diaSemana',
          quantidade: { $sum: '$itens.quantidade' },
          total: { $sum: { $multiply: ['$itens.quantidade', '$itens.precoUnitario'] } },
          diasCount: { $addToSet: { $dateToString: { format: "%Y-%m-%d", date: "$dataVenda" } } }
        }
      },
      {
        $project: {
          diaSemana: '$_id',
          quantidade: 1,
          total: 1,
          diasUnicos: { $size: '$diasCount' }
        }
      }
    ]).toArray();
    
    // Combinar resultados
    const vendasPorDia: Record<number, any> = {};
    
    [...vendasComanda, ...vendasBalcao].forEach(venda => {
      const dia = venda.diaSemana;
      if (!vendasPorDia[dia]) {
        vendasPorDia[dia] = {
          diaSemana: dia,
          quantidade: 0,
          total: 0,
          diasUnicos: new Set()
        };
      }
      vendasPorDia[dia].quantidade += venda.quantidade;
      vendasPorDia[dia].total += venda.total;
      // Adicionar dias únicos
      if (venda.diasCount) {
        venda.diasCount.forEach((diaStr: string) => {
          vendasPorDia[dia].diasUnicos.add(diaStr);
        });
      }
    });
    
    // Converter para array e calcular médias
    const resultado = Object.values(vendasPorDia)
      .map((dia: any) => ({
        ...dia,
        diasUnicos: Array.from(dia.diasUnicos),
        quantidadeDias: dia.diasUnicos.size,
        mediaPorDia: dia.diasUnicos.size > 0 ? dia.quantidade / dia.diasUnicos.size : 0,
        mediaValorPorDia: dia.diasUnicos.size > 0 ? dia.total / dia.diasUnicos.size : 0
      }))
      .filter(dia => diasSelecionados.includes(dia.diaSemana - 1)) // Converter 1-7 para 0-6
      .sort((a: any, b: any) => a.diaSemana - b.diaSemana);
    
    // Calcular totais e médias gerais
    const totalQuantidade = resultado.reduce((sum: number, dia: any) => sum + dia.quantidade, 0);
    const totalValor = resultado.reduce((sum: number, dia: any) => sum + dia.total, 0);
    const totalDiasUnicos = new Set(
      resultado.flatMap((dia: any) => dia.diasUnicos)
    ).size;
    
    const diasDaSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    
    const resultadoFormatado = resultado.map((dia: any) => ({
      ...dia,
      nomeDia: diasDaSemana[dia.diaSemana - 1] || 'Desconhecido',
      diaAbreviado: diasDaSemana[dia.diaSemana - 1]?.substring(0, 3) || '???'
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        vendasPorDia: resultadoFormatado,
        resumo: {
          totalQuantidade,
          totalValor,
          totalDiasUnicos,
          mediaGeralPorDia: totalDiasUnicos > 0 ? totalQuantidade / totalDiasUnicos : 0,
          periodo: {
            inicio: dataInicio.toISOString(),
            fim: hoje.toISOString(),
            dias: Math.ceil((hoje.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24))
          }
        },
        filtros: {
          produtoId,
          diasSelecionados: diasSelecionados.map(d => diasDaSemana[d]),
          periodo
        }
      }
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao buscar vendas por dia:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message
      },
      { status: 500 }
    );
  }
}