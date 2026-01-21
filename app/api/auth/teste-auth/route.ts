// app/api/test-auth/route.ts - CRIE ESTE ARQUIVO
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🔐 Test Auth API chamada');
  
  const token = request.cookies.get('auth_token')?.value;
  
  if (!token) {
    console.log('❌ Sem token no cookie');
    return NextResponse.json(
      { 
        success: false, 
        error: 'Não autenticado - Cookie não encontrado' 
      },
      { status: 401 }
    );
  }
  
  try {
    console.log('🔍 Token encontrado:', token.substring(0, 30) + '...');
    
    // Decodificar base64
    const decodedStr = Buffer.from(token, 'base64').toString('utf-8');
    console.log('📖 Token decodificado string:', decodedStr);
    
    const decoded = JSON.parse(decodedStr);
    console.log('👤 Usuário do token:', decoded);
    
    return NextResponse.json({
      success: true,
      message: 'Autenticado com sucesso!',
      user: {
        id: decoded.id,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role
      },
      tokenInfo: {
        length: token.length,
        expires: decoded.exp ? new Date(decoded.exp).toLocaleString() : 'Não definido'
      }
    });
    
  } catch (error: any) {
    console.error('💥 Erro ao processar token:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Token inválido',
        details: error.message 
      },
      { status: 401 }
    );
  }
}