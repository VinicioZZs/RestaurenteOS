// app/api/relatorios/produtos-periodo/route.ts
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
    const periodo = searchParams.get('periodo') || 'semana'; // dia, semana, mes
    const diaSemana = searchParams.get('diaSemana'); // 0-6 (Domingo-Sábado)
    
    // Calcular data base
    const hoje = new Date();
    let dataInicio = new Date();
    
    switch (periodo) {
      case 'dia':
        dataInicio.setDate(hoje.getDate() - 1);
        break;
      case 'semana':
        dataInicio.setDate(hoje.getDate() - 7);
        break;
      case 'mes':
        dataInicio.setDate(hoje.getDate() - 30);
        break;
      default:
        dataInicio.setDate(hoje.getDate() - 7);
    }
    
    // Construir pipeline de agregação
    const pipeline: any[] = [
      {
        $match: {
          fechadoEm: { $gte: dataInicio }
        }
      },
      {
        $unwind: '$itens'
      },
      {
        $group: {
          _id: '$itens.produtoId',
          nome: { $first: '$itens.produtoNome' },
          categoria: { $first: '$itens.categoria' },
          quantidade: { $sum: '$itens.quantidade' },
          total: { $sum: { $multiply: ['$itens.quantidade', '$itens.precoUnitario'] } }
        }
      },
      {
        $sort: { quantidade: -1 }
      },
      {
        $limit: 20
      }
    ];
    
    // Adicionar filtro por dia da semana se especificado
    if (diaSemana !== null) {
      pipeline[0].$match.$expr = {
        $eq: [{ $dayOfWeek: '$fechadoEm' }, parseInt(diaSemana) + 1]
      };
    }
    
    const produtosComanda = await db.collection('comandas_fechadas').aggregate(pipeline).toArray();
    
    // Buscar do balcão também
    const pipelineBalcao: any[] = [
      {
        $match: {
          dataVenda: { $gte: dataInicio }
        }
      },
      {
        $unwind: '$itens'
      },
      {
        $group: {
          _id: '$itens.produtoId',
          nome: { $first: '$itens.produtoNome' },
          categoria: { $first: '$itens.categoria' },
          quantidade: { $sum: '$itens.quantidade' },
          total: { $sum: { $multiply: ['$itens.quantidade', '$itens.precoUnitario'] } }
        }
      },
      {
        $sort: { quantidade: -1 }
      },
      {
        $limit: 20
      }
    ];
    
    if (diaSemana !== null) {
      pipelineBalcao[0].$match.$expr = {
        $eq: [{ $dayOfWeek: '$dataVenda' }, parseInt(diaSemana) + 1]
      };
    }
    
    const produtosBalcao = await db.collection('vendas_balcao_completas').aggregate(pipelineBalcao).toArray();
    
    // Combinar resultados
    const produtosMap: Record<string, any> = {};
    
    [...produtosComanda, ...produtosBalcao].forEach(produto => {
      if (!produtosMap[produto._id]) {
        produtosMap[produto._id] = {
          id: produto._id,
          nome: produto.nome || 'Produto desconhecido',
          categoria: produto.categoria || 'Sem categoria',
          quantidade: 0,
          total: 0
        };
      }
      produtosMap[produto._id].quantidade += produto.quantidade;
      produtosMap[produto._id].total += produto.total;
    });
    
    const produtos = Object.values(produtosMap)
      .sort((a: any, b: any) => b.quantidade - a.quantidade)
      .slice(0, 15);
    
    return NextResponse.json({
      success: true,
      data: {
        produtos,
        periodo: periodo,
        diaSemana: diaSemana ? getDiaNome(parseInt(diaSemana)) : null,
        dataInicio: dataInicio.toISOString(),
        dataFim: hoje.toISOString()
      }
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao buscar produtos por período:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message
      },
      { status: 500 }
    );
  }
}

function getDiaNome(diaNumero: number): string {
  const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  return dias[diaNumero] || 'Dia desconhecido';
}