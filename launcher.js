const { spawn, exec } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = __dirname;
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const LOADING_HTML = path.join(ROOT_DIR, 'loading.html');
const NEXT_BIN = path.join(FRONTEND_DIR, 'node_modules', 'next', 'dist', 'bin', 'next');

// 1. Open the instant loading screen immediately (opens within 0.05s)
try {
  exec(`start "" "${LOADING_HTML}"`);
} catch (e) {}

// 2. Check if Next.js is already running
function checkNextJs(callback) {
  const req = http.get('http://127.0.0.1:5199/api/v1/health', (res) => {
    callback(res.statusCode === 200);
  });
  req.on('error', () => {
    callback(false);
  });
  req.setTimeout(500, () => {
    req.destroy();
    callback(false);
  });
}

checkNextJs((isRunning) => {
  if (!isRunning) {
    // 3. Start Next.js Production Server using direct Node binary
    try {
      const frontend = spawn(process.execPath, [NEXT_BIN, 'start', '-p', '5199', '-H', '127.0.0.1'], {
        cwd: FRONTEND_DIR,
        stdio: 'ignore',
        detached: true,
        windowsHide: true
      });
      frontend.unref();
    } catch (e) {
      console.error('Failed to spawn Next.js:', e);
    }

    // 4. Start FastAPI Backend
    try {
      const backend = spawn('python', ['-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', '8000'], {
        cwd: BACKEND_DIR,
        stdio: 'ignore',
        detached: true,
        windowsHide: true
      });
      backend.unref();
    } catch (e) {}
  }
});
