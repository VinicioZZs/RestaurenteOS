// /app/api/comandas/pagamento-parcial/route.ts - VERSÃO SUPER SIMPLES
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      console.log('⚠️ MongoDB URI não configurada');
      return NextResponse.json(
        { success: false, message: 'Banco de dados não configurado' },
        { status: 503 }
      );
    }

    // Conecta diretamente
    await mongoose.connect(MONGODB_URI, {
      dbName: 'restauranteos',
    });

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Não foi possível acessar o banco de dados');
    }

    const body = await request.json();
    const { comandaId, dados } = body;

    if (!comandaId || !dados) {
      return NextResponse.json(
        { success: false, message: 'Dados incompletos' },
        { status: 400 }
      );
    }

    const comandasCollection = db.collection('comandas');
    
    // Salva de forma simples
    await comandasCollection.updateOne(
      { id: comandaId },
      { 
        $set: {
          ...dados,
          atualizadoEm: new Date(),
          id: comandaId,
        }
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Pagamento salvo com sucesso',
      comandaId,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('❌ Erro:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
} 