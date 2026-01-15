// app/api/comandas/[id]/route.ts 
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'restaurante';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    const { id } = params;
    const body = await request.json();
    
    console.log('📝 Fechando comanda:', { id, body });
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID da comanda é obrigatório' },
        { status: 400 }
      );
    }
    
    await client.connect();
    const db = client.db(DB_NAME);
    
    const agora = new Date();
    
    // Atualizar comanda
    const resultado = await db.collection('comandas').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: body.status || 'fechada',
          fechadoEm: body.fechadoEm || agora,
          atualizadoEm: agora,
          ...(body.status === 'fechada' && { 
            totalPago: body.totalPago || 0,
            formasPagamento: body.formasPagamento || []
          })
        }
      }
    );
    
    if (resultado.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Comanda não encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Comanda atualizada',
      data: {
        _id: id,
        status: body.status || 'fechada',
        atualizadoEm: agora.toISOString()
      }
    });
    
  } catch (error) {
    console.error('Erro ao fechar comanda:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao fechar comanda',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
