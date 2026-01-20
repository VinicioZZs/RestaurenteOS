// /lib/mongodb.ts - VERSÃO DEFINITIVA
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || '';

if (!MONGODB_URI) {
  console.warn('⚠️ MONGODB_URI não configurada - Modo offline');
}

// Interface para tipagem
interface MongooseCache {
  conn: mongoose.Connection | null;
  promise: Promise<mongoose.Connection> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectDB(): Promise<mongoose.Connection | null> {
  if (!MONGODB_URI) {
    console.log('📭 MongoDB URI não configurada');
    return null;
  }

  if (cached.conn) {
    console.log('♻️ Reutilizando conexão MongoDB existente');
    return cached.conn;
  }

  if (!cached.promise) {
    console.log('🔌 Conectando ao MongoDB...');
    
    const opts = {
      bufferCommands: false,
      dbName: 'restaurante',
    };

    try {
      cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
        console.log('✅ Conectado ao MongoDB com sucesso');
        return mongoose.connection;
      });
      
      cached.conn = await cached.promise;
      return cached.conn;
      
    } catch (error) {
      console.error('❌ Falha ao conectar ao MongoDB:', error);
      cached.promise = null;
      return null;
    }
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

// Função helper para obter db de forma segura
export async function getDB() {
  const conn = await connectDB();
  if (!conn) return null;
  
  return conn.db;
}

// Função para verificar status
export async function checkMongoDBStatus() {
  try {
    const conn = await connectDB();
    if (!conn) {
      return { connected: false, message: 'Não conectado' };
    }
    
    return {
      connected: true,
      message: 'Conectado e respondendo',
      host: conn.host,
      port: conn.port,
      name: conn.name,
    };
  } catch (error) {
    return {
      connected: false,
      message: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    };
  }
}