import mongoose from 'mongoose'

// String DIRETA - sem dotenv
const MONGODB_URI = 'mongodb+srv://restaurante:restaurante123@cluster0.nibimvl.mongodb.net/'

async function seed() {
  try {
    console.log('🔗 Conectando ao MongoDB...')
    
    await mongoose.connect(MONGODB_URI, {
      dbName: 'restaurante'
    })
    
    console.log('✅ Conectado!')
    
    // Modelo
    const Mesa = mongoose.model('Mesa', new mongoose.Schema({
      numero: String,
      nome: String,
      status: String,
      capacidade: Number
    }))
    
    // Cria 2 mesas
    await Mesa.deleteMany({})
    await Mesa.create([
      { numero: '01', nome: 'Mesa 01', status: 'ocupada', capacidade: 4 },
      { numero: '02', nome: 'Mesa 02', status: 'livre', capacidade: 4 }
    ])
    
    console.log('✅ 2 mesas criadas no MongoDB!')
    
    await mongoose.disconnect()
    console.log('🎉 Pronto!')
    process.exit(0)
    
  } catch (error: any) {
    console.error('❌ Erro:', error.message)
    
    // Verifica se o IP está liberado
    if (error.message.includes('getaddrinfo') || error.message.includes('ENOTFOUND')) {
      console.log('\n💡 IP não liberado no MongoDB Atlas:')
      console.log('1. Acesse: https://cloud.mongodb.com')
      console.log('2. Vá em: Network Access')
      console.log('3. Clique: Add IP Address')
      console.log('4. Digite: 0.0.0.0/0')
      console.log('5. Clique: Confirm')
    }
    
    process.exit(1)
  }
}

seed()
