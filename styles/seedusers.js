// scripts/seedUsers.js
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function seedUsers() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('restaurante');
    
    // Hash da senha padrão
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash('admin123', salt);
    
    // Usuário admin padrão
    const adminUser = {
      nome: 'Administrador',
      email: 'admin@restaurante.com',
      senhaHash,
      role: 'admin',
      permissoes: {
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
      },
      ativo: true,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    };
    
    // Garantir que o admin existe
    const existingAdmin = await db.collection('usuarios').findOne({ 
      email: 'admin@restaurante.com' 
    });
    
    if (!existingAdmin) {
      await db.collection('usuarios').insertOne(adminUser);
      console.log('✅ Usuário admin criado com sucesso!');
      console.log('📧 Email: admin@restaurante.com');
      console.log('🔑 Senha: admin123');
    } else {
      console.log('✅ Usuário admin já existe');
    }
    
    console.log('✅ Seed de usuários concluído!');
    
  } finally {
    await client.close();
  }
}

seedUsers().catch(console.error);