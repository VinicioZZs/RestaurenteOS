// app/api/produtos/route.ts - VERSÃO DEFINITIVA
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, WithId, Document } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'restaurante';

// Interface FLEXÍVEL - aceita preco OU precoVenda
interface ProdutoDocument extends Document {
  nome: string;
  descricao?: string;
  preco: number; // Campo obrigatório para compatibilidade
  precoVenda?: number; // Opcional
  precoCusto?: number;
  categoria: string;
  imagem?: string;
  estoqueAtual?: number;
  estoqueMinimo?: number;
  controlarEstoque?: boolean;
  adicionais?: string[];
  unidadeMedida?: string;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
  // Campos extras opcionais
  codigo?: string;
  peso?: number;
  volume?: number;
  tags?: string[];
}

// POST - Criar produto
export async function POST(request: NextRequest) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    const body = await request.json();
    
    console.log('📥 CORPO RECEBIDO NA API:', body);
    
    // Aceita preco OU precoVenda (prioriza precoVenda se existir)
    const precoVendaRecebido = body.precoVenda || body.preco;
    
    if (!body.nome || !precoVendaRecebido || !body.categoria) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Nome, preço e categoria são obrigatórios',
          debug: {
            nome: body.nome,
            precoRecebido: body.preco,
            precoVendaRecebido: body.precoVenda,
            categoria: body.categoria
          }
        },
        { status: 400 }
      );
    }
    
    await client.connect();
    const db = client.db(DB_NAME);
    
    // Verificar se produto já existe
    const produtoExistente = await db.collection<ProdutoDocument>('produtos').findOne({
      nome: body.nome.trim()
    });
    
    if (produtoExistente) {
      return NextResponse.json(
        { success: false, error: 'Produto com este nome já existe' },
        { status: 409 }
      );
    }
    
    // CORREÇÃO AQUI: Criar objeto com ambos preco e precoVenda
    const precoVenda = parseFloat(precoVendaRecebido);
    const novoProduto: ProdutoDocument = {
      nome: body.nome.trim(),
      descricao: body.descricao?.trim() || '',
      // Campo obrigatório 'preco' (usa precoVenda como valor)
      preco: precoVenda,
      // Campo opcional 'precoVenda' (mesmo valor)
      precoVenda: precoVenda,
      precoCusto: body.precoCusto ? parseFloat(body.precoCusto) : undefined,
      categoria: body.categoria,
      imagem: body.imagem || '',
      estoqueAtual: parseInt(body.estoqueAtual) || 0,
      estoqueMinimo: parseInt(body.estoqueMinimo) || 0,
      controlarEstoque: body.controlarEstoque || false,
      adicionais: body.adicionais || [],
      unidadeMedida: body.unidadeMedida || 'unidade',
      ativo: body.ativo !== undefined ? body.ativo : true,
      criadoEm: new Date(),
      atualizadoEm: new Date(),
      // Campos extras
      codigo: body.codigo?.trim() || undefined,
      peso: body.peso ? parseFloat(body.peso) : undefined,
      volume: body.volume ? parseFloat(body.volume) : undefined,
      tags: body.tags || []
    };
    
    console.log('💾 PRODUTO QUE SERÁ SALVO:', novoProduto);
    
    const result = await db.collection('produtos').insertOne(novoProduto);
    
    return NextResponse.json({
      success: true,
      message: 'Produto criado com sucesso',
      data: {
        ...novoProduto,
        _id: result.insertedId.toString()
      }
    });
    
  } catch (error: any) {
    console.error('❌ ERRO AO CRIAR PRODUTO:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao criar produto',
        details: error.message
      },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

// GET - Listar produtos
export async function GET(request: NextRequest) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    
    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria');
    const ativos = searchParams.get('ativos');
    
    let query: any = {};
    
    if (categoria && categoria !== 'todas') {
      query.categoria = categoria;
    }
    
    if (ativos === 'true') {
      query.ativo = true;
    }
    
    const produtos = await db.collection<ProdutoDocument>('produtos')
      .find(query)
      .sort({ nome: 1 })
      .toArray();
    
    // Garantir que todos os produtos tenham precoVenda
    const produtosFormatados = produtos.map((produto: WithId<ProdutoDocument>) => ({
      _id: produto._id.toString(),
      nome: produto.nome,
      descricao: produto.descricao,
      // Mostra precoVenda se existir, senão usa preco
      precoVenda: produto.precoVenda || produto.preco,
      preco: produto.preco, // Mantém por compatibilidade
      precoCusto: produto.precoCusto,
      categoria: produto.categoria,
      imagem: produto.imagem,
      estoqueAtual: produto.estoqueAtual || 0,
      estoqueMinimo: produto.estoqueMinimo || 0,
      controlarEstoque: produto.controlarEstoque || false,
      adicionais: produto.adicionais || [],
      unidadeMedida: produto.unidadeMedida || 'unidade',
      ativo: produto.ativo,
      codigo: produto.codigo,
      peso: produto.peso,
      volume: produto.volume,
      tags: produto.tags || [],
      criadoEm: produto.criadoEm,
      atualizadoEm: produto.atualizadoEm
    }));
    
    return NextResponse.json({
      success: true,
      data: produtosFormatados
    });
    
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar produtos' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}