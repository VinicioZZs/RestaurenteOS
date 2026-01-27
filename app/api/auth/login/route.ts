// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  console.log('🔐 Login API chamada');
  
  try {
    const body = await request.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }
    
    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
    await client.connect();
    const db = client.db('restaurante');
    
    console.log('🔍 Buscando usuário:', email);
    
    // Buscar usuário (case insensitive)
    const user = await db.collection('usuarios').findOne({
      email: { $regex: new RegExp(`^${email}$`, 'i') },
      ativo: true
    });
    
    if (!user) {
      console.log('❌ Usuário não encontrado ou inativo:', email);
      await client.close();
      return NextResponse.json(
        { success: false, error: 'E-mail ou senha incorretos' },
        { status: 401 }
      );
    }
    
    console.log('✅ Usuário encontrado:', user.email);
    
    // Verificar senha com bcrypt
    const senhaValida = await bcrypt.compare(password, user.senhaHash);
    
    if (!senhaValida) {
      console.log('❌ Senha inválida para:', email);
      await client.close();
      return NextResponse.json(
        { success: false, error: 'E-mail ou senha incorretos' },
        { status: 401 }
      );
    }
    
    console.log('✅ Login bem-sucedido para:', user.nome);
    
    // Atualizar último login
    await db.collection('usuarios').updateOne(
      { _id: user._id },
      { $set: { ultimoLogin: new Date().toISOString() } }
    );
    
    // Criar token (remover senha hash dos dados)
    const { senhaHash, ...userSemSenha } = user;
    
    const tokenData = {
      id: user._id.toString(),
      email: user.email,
      nome: user.nome,
      role: user.role,
      permissoes: user.permissoes || {},
      iat: Date.now(),
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24h
    };
    
    const token = Buffer.from(JSON.stringify(tokenData)).toString('base64');
    
    const responseData = {
      success: true,
      user: {
        id: user._id.toString(),
        nome: user.nome,
        email: user.email,
        role: user.role,
        permissoes: user.permissoes || {}
      },
      message: 'Login realizado com sucesso'
    };
    
    const response = NextResponse.json(responseData);
    
    // Adicionar cookie
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });
    
    await client.close();
    return response;
    
  } catch (error: any) {
    console.error('💥 Erro completo no login:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno no servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}