// app/api/mesas/[id]/route.ts - VERSÃO COM MONGODB DRIVER
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'restaurante';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    const mesaId = params.id;
    console.log('🗑️ Tentando deletar mesa:', mesaId);
    
    await client.connect();
    const db = client.db(DB_NAME);
    
    let mesa;
    
    // TENTAR POR _id (ObjectId)
    if (ObjectId.isValid(mesaId)) {
      mesa = await db.collection('mesas').findOne({
        _id: new ObjectId(mesaId)
      });
    }
    
    // SE NÃO ENCONTRAR, TENTAR POR NÚMERO
    if (!mesa) {
      mesa = await db.collection('mesas').findOne({
        numero: mesaId
      });
    }
    
    if (!mesa) {
      console.log('❌ Mesa não encontrada com id/número:', mesaId);
      
      // 🔴 LOG: Mostrar todas as mesas para debug
      const todasMesas = await db.collection('mesas').find({}).toArray();
      console.log('📊 Mesas disponíveis:', todasMesas.map(m => ({
        _id: m._id.toString(),
        numero: m.numero,
        nome: m.nome
      })));
      
      return NextResponse.json(
        { success: false, error: 'Mesa não encontrada' },
        { status: 404 }
      );
    }
    
    console.log('✅ Mesa encontrada para deleção:', {
      _id: mesa._id.toString(),
      numero: mesa.numero,
      nome: mesa.nome
    });
    
    // Deletar a mesa
    const deleteMesaResult = await db.collection('mesas').deleteOne({
      _id: mesa._id
    });
    
    if (deleteMesaResult.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Falha ao deletar mesa' },
        { status: 500 }
      );
    }
    
    // Deletar comandas relacionadas
    const deleteComandasResult = await db.collection('comandas').deleteMany({
      mesaId: mesa._id.toString()
    });
    
    console.log('✅ Deleção concluída:', {
      mesaDeletada: deleteMesaResult.deletedCount,
      comandasDeletadas: deleteComandasResult.deletedCount
    });
    
    return NextResponse.json({
      success: true,
      message: 'Mesa deletada com sucesso',
      deletedId: mesa._id.toString(),
      deletedNumero: mesa.numero,
      comandasDeletadas: deleteComandasResult.deletedCount
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao deletar mesa:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno do servidor',
        details: error.message
      },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}