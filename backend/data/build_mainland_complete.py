"""
Complete 31-Province Mainland China Store Builder (1,150+ Stores).
Outputs:
- backend/data/nb_stores_seed.csv
- frontend/src/data/stores.json
- backend/store_finder.db
"""

import os
import csv
import json
import random
import sqlite3
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent
BACKEND_DIR = DATA_DIR.parent
FRONTEND_JSON = BACKEND_DIR.parent / "frontend" / "src" / "data" / "stores.json"
CSV_PATH = DATA_DIR / "nb_stores_seed.csv"
DB_PATH = BACKEND_DIR / "store_finder.db"

def gen_phone(prefix: str) -> str:
    if len(prefix) == 3:
        return f"{prefix}-{random.randint(5000, 8999)}{random.randint(1000, 9999)}"
    return f"{prefix}-{random.randint(6000, 8999)}{random.randint(100, 999)}"

def gen_hours(mall: str) -> str:
    if "奥莱" in mall or "奥特莱斯" in mall:
        return "09:30 - 21:30"
    return "10:00 - 22:00"

def m(mall: str, dist: str, addr: str, sname: str, floor: str, tags: str):
    return (mall, dist, addr, sname, floor, tags)
