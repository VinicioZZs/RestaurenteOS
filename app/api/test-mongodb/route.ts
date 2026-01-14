// /app/api/test-mongodb/route.ts
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

export async function GET() {
  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI) {
    return NextResponse.json({
      status: 'error',
      message: 'MONGODB_URI não configurada no .env.local',
      timestamp: new Date().toISOString(),
    });
  }

  try {
    // Testa a conexão
    await mongoose.connect(MONGODB_URI, {
      dbName: 'restauranteos',
      serverSelectionTimeoutMS: 5000, // Timeout de 5 segundos
    });

    const db = mongoose.connection.db;
    
    if (!db) {
      return NextResponse.json({
        status: 'error',
        message: 'Conectado mas não conseguiu acessar o banco de dados',
        timestamp: new Date().toISOString(),
      });
    }

    // Lista as coleções para verificar
    const collections = await db.listCollections().toArray();
    
    return NextResponse.json({
      status: 'success',
      message: 'Conectado ao MongoDB com sucesso!',
      database: db.databaseName,
      collections: collections.map(c => c.name),
      host: mongoose.connection.host,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: `Falha ao conectar ao MongoDB: ${error.message}`,
      timestamp: new Date().toISOString(),
    });
  }
}