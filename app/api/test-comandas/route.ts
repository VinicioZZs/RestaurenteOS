import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import ComandaFechada from '@/app/models/comanda_fechada';

export async function GET() {
  try {
    await connectDB();
    
    // Teste: conta quantas comandas existem
    const totalComandas = await ComandaFechada.countDocuments();
    
    // Pega algumas comandas de exemplo
    const exemplos = await ComandaFechada.find()
      .limit(3)
      .lean();
    
    return NextResponse.json({
      success: true,
      totalComandas,
      exemplos,
      mensagem: totalComandas === 0 
        ? 'Nenhuma comanda encontrada na coleção "comandas_fechadas"'
        : `${totalComandas} comandas encontradas`
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      totalComandas: 0,
      exemplos: []
    }, { status: 500 });
  }
}