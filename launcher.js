const { spawn, exec } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const ROOT_DIR = __dirname;
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const NEXT_BIN = path.join(FRONTEND_DIR, 'node_modules', 'next', 'dist', 'bin', 'next');

// Lockfile guard
const LOCK_FILE = path.join(ROOT_DIR, '.launcher.lock');
try {
  if (fs.existsSync(LOCK_FILE)) {
    const stats = fs.statSync(LOCK_FILE);
    if (Date.now() - stats.mtimeMs < 4000) {
      process.exit(0);
    }
  }
  fs.writeFileSync(LOCK_FILE, Date.now().toString());
} catch (e) {}

let nodeExe = process.execPath;
if (!fs.existsSync(nodeExe)) {
  if (fs.existsSync('F:\\Node.js\\node.exe')) {
    nodeExe = 'F:\\Node.js\\node.exe';
  } else {
    nodeExe = 'node';
  }
}

let browserOpened = false;

function openBrowserOnce() {
  if (browserOpened) return;
  browserOpened = true;
  try {
    if (fs.existsSync(LOCK_FILE)) fs.unlinkSync(LOCK_FILE);
  } catch (e) {}

  // Open default browser on Windows
  exec('start http://127.0.0.1:5199');
  setTimeout(() => process.exit(0), 1000);
}

function checkServer(callback) {
  const req = http.get('http://127.0.0.1:5199/api/v1/health', (res) => {
    callback(res.statusCode === 200);
  });
  req.on('error', () => callback(false));
  req.setTimeout(600, () => {
    req.destroy();
    callback(false);
  });
}

function pollAndOpen(attempt = 0) {
  if (attempt > 30) {
    openBrowserOnce();
    return;
  }
  checkServer((ok) => {
    if (ok) {
      openBrowserOnce();
    } else {
      setTimeout(() => pollAndOpen(attempt + 1), 350);
    }
  });
}

checkServer((alreadyRunning) => {
  if (alreadyRunning) {
    openBrowserOnce();
  } else {
    // Launch Next.js via cmd start so it remains alive independently
    const nextCmd = `start "" /min "${nodeExe}" "${NEXT_BIN}" start "${FRONTEND_DIR}" -p 5199 -H 127.0.0.1`;
    exec(nextCmd, { cwd: FRONTEND_DIR });

    // Optional FastAPI backend
    try {
      const pyCmd = `start "" /min python -m uvicorn app.main:app --host 127.0.0.1 --port 8000`;
      exec(pyCmd, { cwd: BACKEND_DIR });
    } catch (e) {}

    // Wait and open exactly once
    pollAndOpen(0);
  }
});
