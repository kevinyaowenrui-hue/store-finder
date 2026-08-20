# Store Finder 本地开发指南 (Local Development Guide)

本项目采用 **Next.js (前端) + FastAPI (后端) + PostgreSQL / SQLite (数据库) + Meilisearch (全文检索)** 架构，设计为**零门槛开箱即用**与**全量引擎高可用**两种模式。

---

## 1. 端口与网络分配规范

根据系统分配规则，本地服务运行端口如下：
- **前端 Next.js 服务**：`http://127.0.0.1:5199`（严格绑定 IPv4 loopback，避免 TUN/代理冲突）
- **后端 FastAPI 服务**：`http://127.0.0.1:8000`（API 文档：`http://127.0.0.1:8000/docs`）
- **可选 Meilisearch 服务**：`http://127.0.0.1:7700`

---

## 2. 极简快速启动 (零门槛模式)

系统内置了 SQLite + 数据库智能模糊检索的自动降级兜底方案，**无需安装 Docker 或配置本地 PostgreSQL / Meilisearch 即可直接启动前后端体验全部功能**！

### 第一步：启动后端服务 (FastAPI)
```bash
cd backend

# 1. 安装 Python 依赖
python -m pip install -r requirements.txt

# 2. 导入 New Balance 试点门店种子数据
python data/seed_runner.py

# 3. 启动 FastAPI 后端 (127.0.0.1:8000)
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

启动后可在浏览器访问交互式 API 文档：`http://127.0.0.1:8000/docs`

### 第二步：启动前端应用 (Next.js)
```bash
cd frontend

# 1. 安装前端依赖
npm install

# 2. 启动开发服务器 (自动绑定 127.0.0.1:5199)
npm run dev
```

在浏览器打开 `http://127.0.0.1:5199` 即可畅享极简搜索体验！
管理后台访问：`http://127.0.0.1:5199/admin`（默认管理密钥：`admin123456`）

---

## 3. 生产级全套环境启动 (Docker Compose + Meilisearch + PostgreSQL)

如果你想体验 Meilisearch 毫秒级拼音/倒排检索与 PostgreSQL，可通过根目录下的 `docker-compose.yml` 快速拉起：

```bash
# 在项目根目录下启动 PostgreSQL 与 Meilisearch
docker-compose up -d

# 修改 backend/.env:
# DATABASE_URL=postgresql+asyncpg://postgres:password123@127.0.0.1:5432/store_finder
# MEILISEARCH_URL=http://127.0.0.1:7700
# MEILISEARCH_MASTER_KEY=masterKey

# 重新导入种子数据并同步 Meilisearch 索引
cd backend
python data/seed_runner.py
```

---

## 4. 后台管理与 CSV 导入规范

进入 `/admin` 管理面板后，可以：
1. **新建/修改门店**：录入名称、商场、城市、楼层、电话、营业时间、坐标与官方来源。
2. **批量导入 CSV**：使用标准 CSV 文件上传，系统自动创建未收录商场，并即时同步更新搜索索引。
3. **导出 CSV**：一键导出所有门店数据备份。
4. **一键 Reindex**：当更换或重置搜索引擎时，一键从数据库重新索引全量门店。

---

## 5. 自动化测试运行

后端已编写完整的自动化测试套件：
```bash
cd backend
python -m pytest tests/test_api.py -v
```
