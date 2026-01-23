const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const next = require('next');

// --- SISTEMA DE LOGS (Para debug em produção) ---
const logPath = path.join(app.getPath('userData'), 'debug.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const msg = `[${timestamp}] ${message}\n`;
  console.log(msg); // Mostra no terminal se rodar via CLI
  try {
    fs.appendFileSync(logPath, msg); // Salva no arquivo
  } catch (e) {
    // Ignora erro de log
  }
}

// Limpa log antigo ao iniciar
try { fs.writeFileSync(logPath, ''); } catch(e) {}

log("--- INICIANDO APLICAÇÃO ---");
log(`Versão: ${app.getVersion()}`);
log(`UserData: ${app.getPath('userData')}`);

// Configuração do ambiente
const isDev = !app.isPackaged;
const PORT = 3000;

// Configuração do Next.js
const nextApp = next({ 
  dev: isDev, 
  dir: app.getAppPath(),
  conf: {
    distDir: '.next', // Força o diretório
  }
});
const handle = nextApp.getRequestHandler();

let mainWindow;
let mongoProcess;

// Função para iniciar o MongoDB
function startMongoDB() {
  return new Promise((resolve, reject) => {
    try {
      const userDataPath = app.getPath('userData');
      const dbPath = path.join(userDataPath, 'mongo-data');
      
      // Cria pasta do banco se não existir
      if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
        log("Pasta mongo-data criada.");
      }

      // --- CAMINHOS DO EXECUTÁVEL ---
      // Em DEV: bin/mongodb/mongod.exe
      // Em PROD: resources/bin/mongodb/mongod.exe
      let mongoExecPath;
      if (isDev) {
        mongoExecPath = path.join(__dirname, 'bin', 'mongodb', 'mongod.exe');
      } else {
        // process.resourcesPath aponta para a pasta onde os 'extraResources' foram extraídos
        mongoExecPath = path.join(process.resourcesPath, 'bin', 'mongodb', 'mongod.exe');
      }

      log(`Procurando MongoDB em: ${mongoExecPath}`);

      if (!fs.existsSync(mongoExecPath)) {
        log("ERRO CRÍTICO: Executável do MongoDB não encontrado!");
        dialog.showErrorBox("Erro", `MongoDB não encontrado em:\n${mongoExecPath}`);
        return reject(new Error("MongoDB missing"));
      }

      log("Iniciando processo do MongoDB...");
      
      mongoProcess = spawn(mongoExecPath, [
        '--dbpath', dbPath,
        '--port', '27017',
        '--bind_ip', '127.0.0.1',
        '--noauth' 
      ]);

      mongoProcess.stdout.on('data', (data) => log(`[MONGO]: ${data}`));
      mongoProcess.stderr.on('data', (data) => log(`[MONGO ERR]: ${data}`));
      
      mongoProcess.on('spawn', () => {
        log("MongoDB processo iniciado com sucesso (Spawned).");
        // Damos 2 segundos para garantir que o banco subiu antes de resolver
        setTimeout(resolve, 2000);
      });

      mongoProcess.on('error', (err) => {
        log(`Erro ao iniciar processo Mongo: ${err.message}`);
        reject(err);
      });

    } catch (err) {
      log(`Exceção no startMongoDB: ${err.message}`);
      reject(err);
    }
  });
}

// Função para criar a janela
function createWindow() {
  log("Criando Janela...");
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Servyx",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
    show: false // Começa oculta para não piscar branco
  });

  mainWindow.loadURL(`http://localhost:${PORT}`)
    .then(() => log("Página carregada com sucesso."))
    .catch(err => log(`Erro ao carregar URL: ${err.message}`));

  mainWindow.once('ready-to-show', () => {
    log("Janela pronta para exibir.");
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Inicialização da Aplicação
app.whenReady().then(async () => {
  try {
    log("App Ready. Iniciando serviços...");

    // 1. Iniciar MongoDB
    await startMongoDB();
    log("MongoDB iniciado. Preparando Next.js...");

    // 2. Iniciar Servidor Next.js
    await nextApp.prepare();
    log("Next.js preparado. Iniciando servidor HTTP...");
    
    const server = http.createServer((req, res) => {
      return handle(req, res);
    });

    server.listen(PORT, (err) => {
      if (err) throw err;
      log(`> Servidor HTTP rodando em http://localhost:${PORT}`);
      
      // 3. Abrir Janela
      createWindow();
    });

  } catch (error) {
    log(`ERRO FATAL NA INICIALIZAÇÃO: ${error.message}`);
    log(error.stack);
    dialog.showErrorBox("Erro Fatal", `O sistema falhou ao iniciar.\nVerifique o log em: ${logPath}\n\nErro: ${error.message}`);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  log("Encerrando aplicação...");
  if (mongoProcess) {
    mongoProcess.kill();
    log("MongoDB encerrado.");
  }
});