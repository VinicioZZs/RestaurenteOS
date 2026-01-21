// app/api/auth/login/route.ts - VERSÃO DEBUGGADA
import { NextRequest, NextResponse } from 'next/server';

// 🔥 USUÁRIOS CORRETOS (os mesmos do seu auth.ts)
const users = [
  { 
    id: 1, 
    email: 'admin@restaurante.com', 
    name: 'Administrador', 
    role: 'admin', 
    password: '123456' 
  },
  { 
    id: 2, 
    email: 'garcom@restaurante.com', 
    name: 'João Garçom', 
    role: 'garcom', 
    password: '123456' 
  },
  { 
    id: 3, 
    email: 'caixa@restaurante.com', 
    name: 'Maria Caixa', 
    role: 'caixa', 
    password: '123456' 
  },
];

export async function POST(request: NextRequest) {
  console.log('🔐 Login API chamada');
  
  try {
    // 🔥 1. Pegar o body CORRETAMENTE
    let body;
    try {
      body = await request.json();
      console.log('📦 Body recebido:', body);
    } catch (parseError) {
      console.error('❌ Erro ao parsear JSON:', parseError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Formato inválido. Envie JSON.' 
        },
        { status: 400 }
      );
    }
    
    const { email, password } = body;
    
    if (!email || !password) {
      console.log('⚠️ Email ou senha vazios:', { email, password });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email e senha são obrigatórios' 
        },
        { status: 400 }
      );
    }
    
    console.log('🔍 Procurando usuário:', email);
    
    // 🔥 2. Encontrar usuário (case sensitive)
    const user = users.find(u => 
      u.email.toLowerCase() === email.toLowerCase() && 
      u.password === password
    );
    
    console.log('👤 Usuário encontrado?', user ? 'Sim' : 'Não');
    
    if (!user) {
      console.log('❌ Credenciais inválidas para:', email);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email ou senha incorretos' 
        },
        { status: 401 }
      );
    }
    
    // 🔥 3. Criar token SIMPLES
    const tokenData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      iat: Date.now(),
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24h
    };
    
    // 🔥 4. Converter para Base64 CORRETAMENTE
    const token = Buffer.from(JSON.stringify(tokenData)).toString('base64');
    console.log('✅ Token gerado (primeiros 20 chars):', token.substring(0, 20));
    
    // 🔥 5. Criar resposta
    const responseData = {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      message: 'Login realizado com sucesso'
    };
    
    console.log('📤 Enviando resposta:', responseData);
    
    const response = NextResponse.json(responseData);
    
    // 🔥 6. Adicionar cookie
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // 🔥 Mude para 'lax' ao invés de 'strict'
      maxAge: 60 * 60 * 24, // 24h
      path: '/',
    });
    
    console.log('🍪 Cookie configurado');
    
    return response;
    
  } catch (error: any) {
    console.error('💥 Erro completo no login:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erro interno no servidor',
        details: error.message 
      },
      { status: 500 }
    );
  }
}