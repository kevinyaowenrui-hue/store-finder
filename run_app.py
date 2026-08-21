"""
Store Finder Native Windows Silent Launcher (PythonW + Node.js).
"""

import os
import sys
import time
import urllib.request
import webbrowser
import subprocess
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = ROOT_DIR / "frontend"
BACKEND_DIR = ROOT_DIR / "backend"
NODE_EXE = "F:/Node.js/node.exe"
NEXT_BIN = FRONTEND_DIR / "node_modules" / "next" / "dist" / "bin" / "next"

def is_ready() -> bool:
    try:
        req = urllib.request.Request("http://127.0.0.1:5199/api/v1/health", headers={"User-Agent": "StoreFinderLauncher"})
        with urllib.request.urlopen(req, timeout=1) as res:
            return res.status == 200
    except Exception:
        return False

def main():
    if not is_ready():
        # Start Next.js detached process
        flags = subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP | subprocess.CREATE_NO_WINDOW
        try:
            subprocess.Popen(
                [str(NODE_EXE), str(NEXT_BIN), "start", "-p", "5199", "-H", "127.0.0.1"],
                cwd=str(FRONTEND_DIR),
                stdin=subprocess.DEVNULL,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                creationflags=flags
            )
        except Exception:
            pass

        # Poll until server is 100% ready
        for _ in range(35):
            time.sleep(0.25)
            if is_ready():
                break

    # Open default browser directly to http://127.0.0.1:5199
    webbrowser.open("http://127.0.0.1:5199")

if __name__ == "__main__":
    main()
