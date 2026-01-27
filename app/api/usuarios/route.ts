// app/api/usuarios/route.ts (ATUALIZADO COM canManagePayments)
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

// Interfaces para TypeScript
interface Permissoes {
  canManageUsers: boolean;
  canAccessSettings: boolean;
  canViewReports: boolean;
  canManageProducts: boolean;
  canManageCategories: boolean;
  canManageAdicionais: boolean;
  canOpenComanda: boolean;
  canCloseComanda: boolean;
  canRemoveItem: boolean;
  canClearComanda: boolean;
  canDeleteComanda: boolean;
  canProcessPayment: boolean;
  canGiveDiscount: boolean;
  canCancelPayment: boolean;
  canManagePayments: boolean; // ✅ NOVA PERMISSÃO ADICIONADA
}

type UserRole = 'admin' | 'gerente' | 'garcom' | 'caixa';

const roleTemplates: Record<UserRole, Permissoes> = {
  admin: {
    canManageUsers: true,
    canAccessSettings: true,
    canViewReports: true,
    canManageProducts: true,
    canManageCategories: true,
    canManageAdicionais: true,
    canOpenComanda: true,
    canCloseComanda: true,
    canRemoveItem: true,
    canClearComanda: true,
    canDeleteComanda: true,
    canProcessPayment: true,
    canGiveDiscount: true,
    canCancelPayment: true,
    canManagePayments: true, // ✅ ADMIN TEM ACESSO
  },
  gerente: {
    canManageUsers: true,
    canAccessSettings: true,
    canViewReports: true,
    canManageProducts: true,
    canManageCategories: true,
    canManageAdicionais: true,
    canOpenComanda: true,
    canCloseComanda: true,
    canRemoveItem: true,
    canClearComanda: true,
    canDeleteComanda: false,
    canProcessPayment: true,
    canGiveDiscount: true,
    canCancelPayment: true,
    canManagePayments: true, // ✅ GERENTE TEM ACESSO
  },
  garcom: {
    canManageUsers: false,
    canAccessSettings: false,
    canViewReports: false,
    canManageProducts: false,
    canManageCategories: false,
    canManageAdicionais: false,
    canOpenComanda: true,
    canCloseComanda: false,
    canRemoveItem: true,
    canClearComanda: false,
    canDeleteComanda: false,
    canProcessPayment: false,
    canGiveDiscount: false,
    canCancelPayment: false,
    canManagePayments: false, // ✅ GARÇOM NÃO TEM ACESSO
  },
  caixa: {
    canManageUsers: false,
    canAccessSettings: false,
    canViewReports: true,
    canManageProducts: false,
    canManageCategories: false,
    canManageAdicionais: false,
    canOpenComanda: true,
    canCloseComanda: true,
    canRemoveItem: true,
    canClearComanda: false,
    canDeleteComanda: false,
    canProcessPayment: true,
    canGiveDiscount: true,
    canCancelPayment: true,
    canManagePayments: false, // ✅ CAIXA NÃO TEM ACESSO
  }
};

// GET - Listar todos os usuários
export async function GET(request: NextRequest) {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
  
  try {
    console.log('🔍 GET /api/usuarios - Iniciando...');
    
    await client.connect();
    const db = client.db('restaurante');
    
    console.log('📊 Buscando usuários no banco...');
    
    // Buscar todos os usuários, excluindo o campo senhaHash
    const usuarios = await db.collection('usuarios')
      .find({}, { projection: { senhaHash: 0 } })
      .sort({ criadoEm: -1 })
      .toArray();
    
    console.log(`✅ Encontrados ${usuarios.length} usuários`);
    
    // Converter ObjectId para string
    const usuariosFormatados = usuarios.map(u => ({
      ...u,
      _id: u._id.toString(),
      criadoEm: u.criadoEm ? new Date(u.criadoEm).toISOString() : new Date().toISOString(),
      atualizadoEm: u.atualizadoEm ? new Date(u.atualizadoEm).toISOString() : new Date().toISOString()
    }));
    
    return NextResponse.json({
      success: true,
      count: usuariosFormatados.length,
      data: usuariosFormatados
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao buscar usuários:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao buscar usuários',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

// POST - Criar novo usuário
export async function POST(request: NextRequest) {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
  
  try {
    const body = await request.json();
    
    console.log('📥 Dados recebidos para criar usuário:', {
      nome: body.nome,
      email: body.email,
      temSenha: !!body.senha,
      role: body.role
    });
    
    // Validações
    if (!body.nome || !body.email) {
      return NextResponse.json(
        { success: false, error: 'Nome e email são obrigatórios' },
        { status: 400 }
      );
    }
    
    if (!body.senha) {
      return NextResponse.json(
        { success: false, error: 'Senha é obrigatória para novo usuário' },
        { status: 400 }
      );
    }
    
    await client.connect();
    const db = client.db('restaurante');
    
    // Verificar se email já existe
    const usuarioExistente = await db.collection('usuarios').findOne({ 
      email: body.email.toLowerCase().trim()
    });
    
    if (usuarioExistente) {
      await client.close();
      return NextResponse.json(
        { success: false, error: 'Email já cadastrado' },
        { status: 400 }
      );
    }
    
    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(body.senha, salt);
    
    console.log('🔐 Senha hash criada com sucesso');
    
    // Determinar role e permissões
    const role: UserRole = (body.role || 'garcom') as UserRole;
    const permissoes: Permissoes = body.permissoes || roleTemplates[role];
    
    // Garantir que todas as permissões estão presentes
    const permissoesCompletas = {
      ...roleTemplates[role], // Começa com o template padrão
      ...permissoes, // Sobrescreve com permissões específicas
    };
    
    const usuarioData = {
      nome: body.nome.trim(),
      email: body.email.toLowerCase().trim(),
      senhaHash,
      role,
      permissoes: permissoesCompletas,
      ativo: body.ativo !== undefined ? body.ativo : true,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      ultimoLogin: null
    };
    
    console.log('📤 Salvando usuário no banco...');
    console.log('🔐 Permissões do usuário:', permissoesCompletas);
    
    const result = await db.collection('usuarios').insertOne(usuarioData);
    
    console.log('✅ Usuário criado com ID:', result.insertedId);
    
    // Não retornar a senha hash
    const { senhaHash: _, ...usuarioSemSenha } = usuarioData;
    
    await client.close();
    
    return NextResponse.json({
      success: true,
      data: {
        ...usuarioSemSenha,
        _id: result.insertedId
      },
      message: 'Usuário criado com sucesso'
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao criar usuário:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao criar usuário',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}