// app/api/usuarios/[id]/route.ts (ATUALIZADO COM canManagePayments)
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

// Mesmas interfaces e templates do arquivo anterior
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
  canManagePayments: boolean; // ✅ NOVA PERMISSÃO
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

// GET - Buscar usuário por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
  
  try {
    console.log(`🔍 GET /api/usuarios/${params.id} - Iniciando...`);
    
    // Validar ObjectId
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: 'ID do usuário inválido' },
        { status: 400 }
      );
    }
    
    await client.connect();
    const db = client.db('restaurante');
    
    const usuario = await db.collection('usuarios').findOne(
      { _id: new ObjectId(params.id) },
      { projection: { senhaHash: 0 } }
    );
    
    if (!usuario) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    // Converter ObjectId para string
    const usuarioFormatado = {
      ...usuario,
      _id: usuario._id.toString(),
      criadoEm: usuario.criadoEm ? new Date(usuario.criadoEm).toISOString() : new Date().toISOString(),
      atualizadoEm: usuario.atualizadoEm ? new Date(usuario.atualizadoEm).toISOString() : new Date().toISOString()
    };
    
    return NextResponse.json({
      success: true,
      data: usuarioFormatado
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao buscar usuário:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao buscar usuário',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

// PUT - Atualizar usuário
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
  
  try {
    const body = await request.json();
    
    console.log(`📝 PUT /api/usuarios/${params.id} - Atualizando...`);
    console.log('📥 Dados recebidos:', {
      nome: body.nome,
      email: body.email,
      temSenha: !!body.senha,
      role: body.role
    });
    
    // Validar ObjectId
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: 'ID do usuário inválido' },
        { status: 400 }
      );
    }
    
    // Validações básicas
    if (!body.nome || !body.email) {
      return NextResponse.json(
        { success: false, error: 'Nome e email são obrigatórios' },
        { status: 400 }
      );
    }
    
    await client.connect();
    const db = client.db('restaurante');
    
    // Verificar se usuário existe
    const usuarioExistente = await db.collection('usuarios').findOne(
      { _id: new ObjectId(params.id) }
    );
    
    if (!usuarioExistente) {
      await client.close();
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se email já existe (e não é o mesmo usuário)
    if (body.email !== usuarioExistente.email) {
      const emailExistente = await db.collection('usuarios').findOne({
        email: body.email.toLowerCase().trim(),
        _id: { $ne: new ObjectId(params.id) }
      });
      
      if (emailExistente) {
        await client.close();
        return NextResponse.json(
          { success: false, error: 'Email já está em uso por outro usuário' },
          { status: 400 }
        );
      }
    }
    
    // Preparar dados para atualização
    const updateData: any = {
      nome: body.nome.trim(),
      email: body.email.toLowerCase().trim(),
      role: body.role || usuarioExistente.role,
      ativo: body.ativo !== undefined ? body.ativo : usuarioExistente.ativo,
      atualizadoEm: new Date().toISOString()
    };
    
    // Se enviou permissões, usar elas, senão usar template do role
    if (body.permissoes) {
      // Garantir que todas as permissões estão presentes
      const role: UserRole = (body.role || usuarioExistente.role) as UserRole;
      const permissoesCompletas = {
        ...roleTemplates[role], // Template padrão para o role
        ...body.permissoes, // Sobrescreve com as permissões enviadas
      };
      updateData.permissoes = permissoesCompletas;
    } else if (body.role && body.role !== usuarioExistente.role) {
      // Se mudou o role mas não enviou permissões específicas, usar template do novo role
      const novoRole: UserRole = body.role as UserRole;
      updateData.permissoes = roleTemplates[novoRole];
    }
    
    // Se enviou senha, fazer hash
    if (body.senha && body.senha.trim()) {
      const salt = await bcrypt.genSalt(10);
      updateData.senhaHash = await bcrypt.hash(body.senha, salt);
      console.log('🔐 Senha atualizada com hash');
    }
    
    console.log('📤 Atualizando usuário no banco...');
    console.log('🔐 Permissões atualizadas:', updateData.permissoes || usuarioExistente.permissoes);
    
    const result = await db.collection('usuarios').updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      await client.close();
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    // Buscar usuário atualizado (sem senha)
    const usuarioAtualizado = await db.collection('usuarios').findOne(
      { _id: new ObjectId(params.id) },
      { projection: { senhaHash: 0 } }
    );
    
    // ✅ CORREÇÃO: Verificar se usuarioAtualizado não é null
    if (!usuarioAtualizado) {
      await client.close();
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar usuário atualizado' },
        { status: 500 }
      );
    }
    
    // Converter ObjectId para string
    const usuarioFormatado = {
      ...usuarioAtualizado,
      _id: usuarioAtualizado._id.toString(),
      criadoEm: usuarioAtualizado.criadoEm ? new Date(usuarioAtualizado.criadoEm).toISOString() : new Date().toISOString(),
      atualizadoEm: usuarioAtualizado.atualizadoEm ? new Date(usuarioAtualizado.atualizadoEm).toISOString() : new Date().toISOString()
    };
    
    await client.close();
    
    return NextResponse.json({
      success: true,
      data: usuarioFormatado,
      message: 'Usuário atualizado com sucesso'
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao atualizar usuário',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

// DELETE - Excluir usuário
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
  
  try {
    console.log(`🗑️ DELETE /api/usuarios/${params.id} - Iniciando...`);
    
    // Validar ObjectId
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: 'ID do usuário inválido' },
        { status: 400 }
      );
    }
    
    await client.connect();
    const db = client.db('restaurante');
    
    // Verificar se é o último admin
    const usuario = await db.collection('usuarios').findOne(
      { _id: new ObjectId(params.id) }
    );
    
    if (!usuario) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    if (usuario.role === 'admin') {
      // Contar quantos admins restam
      const adminCount = await db.collection('usuarios').countDocuments({
        role: 'admin',
        _id: { $ne: new ObjectId(params.id) }
      });
      
      if (adminCount === 0) {
        return NextResponse.json(
          { success: false, error: 'Não é possível excluir o último administrador' },
          { status: 400 }
        );
      }
    }
    
    // Excluir usuário
    const result = await db.collection('usuarios').deleteOne({
      _id: new ObjectId(params.id)
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Usuário excluído com sucesso'
    });
    
  } catch (error: any) {
    console.error('❌ Erro ao excluir usuário:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro ao excluir usuário',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}