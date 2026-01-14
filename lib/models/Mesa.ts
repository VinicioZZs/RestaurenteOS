// lib/models/Mesa.ts - VERSÃO MOCK
// Não usa mongoose, só retorna dados mock

const mesasMock = [
  { _id: 'mesa-01', numero: '01', nome: 'Mesa 01', status: 'ocupada', capacidade: 4 },
  { _id: 'mesa-02', numero: '02', nome: 'Mesa 02', status: 'livre', capacidade: 4 },
  { _id: 'mesa-03', numero: '03', nome: 'Mesa 03', status: 'livre', capacidade: 6 }
]

export default {
  find: () => Promise.resolve(mesasMock),
  findById: (id: string) => {
    const mesa = mesasMock.find(m => m._id === id)
    return Promise.resolve(mesa || null)
  },
  findOne: (query: any) => {
    // Se query tem numero, busca por numero
    if (query.numero) {
      const mesa = mesasMock.find(m => m.numero === query.numero)
      return Promise.resolve(mesa || null)
    }
    return Promise.resolve(null)
  },
  create: (data: any) => {
    const novaMesa = { _id: `mesa-${Date.now()}`, ...data }
    mesasMock.push(novaMesa)
    return Promise.resolve(novaMesa)
  },
  deleteMany: () => Promise.resolve({ deletedCount: 0 }),
  insertMany: (data: any[]) => {
    data.forEach(item => mesasMock.push(item))
    return Promise.resolve(data)
  }
}