const { spawn, exec } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = __dirname;
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const NEXT_BIN = path.join(FRONTEND_DIR, 'node_modules', 'next', 'dist', 'bin', 'next');

// Find Node.js executable path
let nodeExe = process.execPath;
if (!fs.existsSync(nodeExe)) {
  if (fs.existsSync('F:\\Node.js\\node.exe')) {
    nodeExe = 'F:\\Node.js\\node.exe';
  } else {
    nodeExe = 'node';
  }
}

console.log('======================================================');
console.log('       Store Finder 品牌门店与专柜搜索引擎');
console.log('======================================================');
console.log('[*] 正在检查并启动后台服务...');

// 1. Helper to check if 127.0.0.1:5199 is responding
function checkServer(callback) {
  const req = http.get('http://127.0.0.1:5199/', (res) => {
    callback(res.statusCode === 200);
  });
  req.on('error', () => callback(false));
  req.setTimeout(500, () => {
    req.destroy();
    callback(false);
  });
}

// 2. Open browser once ready
function openBrowser() {
  console.log('[OK] 服务已就绪 (http://127.0.0.1:5199)，正在唤起浏览器！');
  exec('start http://127.0.0.1:5199');
  setTimeout(() => process.exit(0), 1000);
}

// 3. Poll loop
function pollUntilReady(attempts = 0) {
  if (attempts > 30) {
    console.log('[!] 正在尝试直接打开主页...');
    openBrowser();
    return;
  }
  checkServer((ready) => {
    if (ready) {
      openBrowser();
    } else {
      setTimeout(() => pollUntilReady(attempts + 1), 500);
    }
  });
}

// Check initial status
checkServer((isRunning) => {
  if (isRunning) {
    console.log('[i] 服务已在运行中');
    openBrowser();
  } else {
    console.log('[*] 正在启动 Next.js 前端核心服务 (端口 5199)...');
    try {
      const frontend = spawn(nodeExe, [NEXT_BIN, 'start', '-p', '5199', '-H', '127.0.0.1'], {
        cwd: FRONTEND_DIR,
        stdio: 'ignore',
        detached: true,
        windowsHide: true
      });
      frontend.unref();
    } catch (err) {
      console.error('[!] 启动 Next.js 失败:', err);
    }

    // Optional FastAPI backend
    try {
      const backend = spawn('python', ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000'], {
        cwd: BACKEND_DIR,
        stdio: 'ignore',
        detached: true,
        windowsHide: true
      });
      backend.unref();
    } catch (err) {}

    // Wait and poll until server is 100% 200 OK
    pollUntilReady(0);
  }
});
