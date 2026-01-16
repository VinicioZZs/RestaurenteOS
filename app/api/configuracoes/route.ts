// app/api/configuracoes/route.ts - API COMPLETA (REVISADO)
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

// Defina as variáveis de ambiente corretamente
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'restaurante';

// GET - Buscar configurações
export async function GET(request: NextRequest) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔍 Buscando configurações do sistema...');
    
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Buscar configurações
    const config = await db.collection('configuracoes').findOne({ 
      tipo: 'sistema' 
    });
    
    console.log('📥 Configurações encontradas:', config ? 'Sim' : 'Não');
    
    if (!config) {
      // Se não existir, criar padrão
      const configPadrao = {
        tipo: 'sistema',
        presetComanda: 'comanda',
        mostrarGarcom: true,
        mostrarMesaNumero: true,
        controleEstoqueGlobal: false,
        mostrarAlertaEstoque: true,
        simboloEstoqueMinimo: '⚠️',
        corAlertaEstoque: '#f59e0b',
        temaSistema: 'claro',
        corPrimaria: '#2563eb',
        corSecundaria: '#7c3aed',
        tempoAutoSave: 30,
        mostrarDicas: true,
        confirmarExclusao: true,
        atualizadoEm: new Date().toISOString(),
        atualizadoPor: 'Sistema',
        criadoEm: new Date().toISOString()
      };
      
      console.log('📝 Criando configurações padrão...');
      await db.collection('configuracoes').insertOne(configPadrao);
      
      return NextResponse.json({
        success: true,
        data: configPadrao
      });
    }
    
    return NextResponse.json({
      success: true,
      data: config
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao buscar configurações:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao buscar configurações',
        details: error.message 
      },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

// PUT - Atualizar configurações (CORRIGIDO)
export async function PUT(request: NextRequest) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('✏️ Atualizando configurações...');
    const body = await request.json();
    
    console.log('📥 Dados recebidos:', body);
    
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Dados não fornecidos' },
        { status: 400 }
      );
    }
    
    await client.connect();
    const db = client.db(DB_NAME);
    
    // REMOVER O _id ANTES DE ATUALIZAR
    const { _id, ...dadosParaAtualizar } = body;
    
    const updateData = {
      ...dadosParaAtualizar, // ← Agora sem o _id
      tipo: 'sistema',
      atualizadoEm: new Date().toISOString()
    };
    
    console.log('📤 Atualizando no MongoDB...', updateData);
    
    const result = await db.collection('configuracoes').updateOne(
      { tipo: 'sistema' },
      { 
        $set: updateData 
      },
      { upsert: true }
    );
    
    console.log('✅ MongoDB atualizado:', {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedId: result.upsertedId
    });
    
    // Buscar o documento atualizado para retornar
    const configAtualizada = await db.collection('configuracoes').findOne({ 
      tipo: 'sistema' 
    });
    
    return NextResponse.json({
      success: true,
      message: 'Configurações salvas com sucesso',
      data: configAtualizada
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao salvar configurações:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao salvar configurações',
        details: error.message 
      },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}