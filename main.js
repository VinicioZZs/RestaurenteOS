const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let nextServer;
let mongoServer;

// Configuração de portas e caminhos
const NEXT_PORT = 3000;
const MONGO_PORT = 27017;
const DB_PATH = path.join(__dirname, 'bin', 'mongodb', 'data');
const MONGO_BIN = path.join(__dirname, 'bin', 'mongodb', 'mongod.exe');

// Garante que a pasta de dados existe
if (!fs.existsSync(DB_PATH)){
    fs.mkdirSync(DB_PATH, { recursive: true });
}

function startMongoDB() {
  console.log('Iniciando MongoDB...');
  // Inicia o MongoDB apontando para a pasta local 'data'
  mongoServer = spawn(MONGO_BIN, [
    '--dbpath', DB_PATH,
    '--port', MONGO_PORT.toString(),
    '--bind_ip', '127.0.0.1'
  ]);

  mongoServer.stdout.on('data', (data) => console.log(`MongoDB: ${data}`));
  mongoServer.stderr.on('data', (data) => console.error(`MongoDB Error: ${data}`));
}

function startNextServer() {
  console.log('Iniciando Next.js...');
  
  // Define a URI do Mongo para o Next.js usar
  const env = { 
    ...process.env, 
    MONGODB_URI: `mongodb://127.0.0.1:${MONGO_PORT}/restaurante`,
    PORT: NEXT_PORT 
  };

  // Executa o comando 'next start'
  nextServer = spawn('npm', ['run', 'start'], {
    cwd: __dirname,
    env: env,
    shell: true
  });

  nextServer.stdout.on('data', (data) => console.log(`NextJS: ${data}`));
  nextServer.stderr.on('data', (data) => console.error(`NextJS Error: ${data}`));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
    },
    autoHideMenuBar: true, // Oculta a barra de menu padrão
  });

  // Aguarda o servidor subir antes de carregar (delay simples ou use wait-on)
  setTimeout(() => {
    mainWindow.loadURL(`http://localhost:${NEXT_PORT}/dashboard`);
  }, 5000); // Aguarda 5 segundos para garantir que o Next subiu

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', () => {
  startMongoDB();
  startNextServer();
  createWindow();
});

// Encerra os processos filhos quando fechar a janela
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    // Matar MongoDB e Next.js
    if (mongoServer) mongoServer.kill();
    if (nextServer) nextServer.kill(); // Em Windows pode precisar de tree-kill
    app.quit();
  }
});