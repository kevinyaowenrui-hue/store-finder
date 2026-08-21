const { spawn, exec } = require('child_process');
const http = require('http');
const path = require('path');

const ROOT_DIR = __dirname;
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');

// 1. Spawn FastAPI backend in background
try {
  const backend = spawn('python', ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000'], {
    cwd: BACKEND_DIR,
    stdio: 'ignore',
    detached: true,
    windowsHide: true
  });
  backend.unref();
} catch (e) {}

// 2. Spawn Next.js production/dev server in background
try {
  const isWindows = process.platform === 'win32';
  const npmCmd = isWindows ? 'npm.cmd' : 'npm';
  const frontend = spawn(npmCmd, ['run', 'start'], {
    cwd: FRONTEND_DIR,
    stdio: 'ignore',
    detached: true,
    windowsHide: true
  });
  frontend.unref();
} catch (e) {}

// 3. Poll and open browser
function checkAndOpen(count = 0) {
  if (count > 30) {
    exec('start http://127.0.0.1:5199');
    return;
  }
  const req = http.get('http://127.0.0.1:5199/', (res) => {
    if (res.statusCode === 200) {
      exec('start http://127.0.0.1:5199');
    } else {
      setTimeout(() => checkAndOpen(count + 1), 400);
    }
  });
  req.on('error', () => {
    setTimeout(() => checkAndOpen(count + 1), 400);
  });
}

setTimeout(() => checkAndOpen(0), 600);
