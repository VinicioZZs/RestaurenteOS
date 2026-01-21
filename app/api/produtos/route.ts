// app/api/produtos/route.ts - VERSÃO OTIMIZADA
import { NextRequest, NextResponse } from 'next/server';
import { WithId, Document } from 'mongodb';
import { getDB } from '@/lib/mongodb'; // Importando a conexão centralizada

// Interface FLEXÍVEL
interface ProdutoDocument extends Document {
  nome: string;
  descricao?: string;
  preco: number;
  precoVenda?: number;
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
  codigo?: string;
  peso?: number;
  volume?: number;
  tags?: string[];
}

// POST - Criar produto
export async function POST(request: NextRequest) {
  try {
    const db = await getDB();
    if (!db) throw new Error("Falha na conexão com o banco");

    const body = await request.json();
    
    // Aceita preco OU precoVenda (prioriza precoVenda se existir)
    const precoVendaRecebido = body.precoVenda || body.preco;
    
    if (!body.nome || !precoVendaRecebido || !body.categoria) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Nome, preço e categoria são obrigatórios'
        },
        { status: 400 }
      );
    }
    
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
    
    const precoVenda = parseFloat(precoVendaRecebido);
    const novoProduto: ProdutoDocument = {
      nome: body.nome.trim(),
      descricao: body.descricao?.trim() || '',
      preco: precoVenda,
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
      codigo: body.codigo?.trim() || undefined,
      peso: body.peso ? parseFloat(body.peso) : undefined,
      volume: body.volume ? parseFloat(body.volume) : undefined,
      tags: body.tags || []
    };
    
    const result = await db.collection('produtos').insertOne(novoProduto);
    
    return NextResponse.json({
      success: true,
      message: 'Produto criado com sucesso',
      data: { ...novoProduto, _id: result.insertedId.toString() }
    });
    
  } catch (error: any) {
    console.error('❌ ERRO AO CRIAR PRODUTO:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar produto', details: error.message },
      { status: 500 }
    );
  }
}

// GET - Listar produtos
export async function GET(request: NextRequest) {
  try {
    const db = await getDB();
    if (!db) throw new Error("Falha na conexão com o banco");
    
    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria');
    const ativos = searchParams.get('ativos');
    
    let query: any = {};
    if (categoria && categoria !== 'todas') query.categoria = categoria;
    if (ativos === 'true') query.ativo = true;
    
    const produtos = await db.collection<ProdutoDocument>('produtos')
      .find(query)
      .sort({ nome: 1 })
      .toArray();
    
    const produtosFormatados = produtos.map((produto: WithId<ProdutoDocument>) => ({
      _id: produto._id.toString(),
      nome: produto.nome,
      descricao: produto.descricao,
      precoVenda: produto.precoVenda || produto.preco,
      preco: produto.preco,
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
    
    return NextResponse.json({ success: true, data: produtosFormatados });
    
  } catch (error: any) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao buscar produtos', details: error.message },
      { status: 500 }
    );
  }
}