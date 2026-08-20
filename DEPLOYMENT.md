# Store Finder 生产环境部署指南 (Deployment Guide)

本项目针对现代云原生 Serverless 与容器托管进行了针对性优化，支持**前端 Vercel 托管 + 后端轻量实例 + 云端 PostgreSQL + Meilisearch** 架构，可实现完全免费或极低成本部署。

---

## 1. 架构拓扑设计

```
[ 用户端浏览器 / 移动端 ]
         │ (HTTPS)
         ▼
[ Vercel: Next.js Frontend ] ── (REST API) ──▶ [ Railway / Render: FastAPI Backend ]
                                                            │
                                              ┌─────────────┴─────────────┐
                                              ▼                           ▼
                                    [ Supabase / Neon: PG ]     [ Meilisearch Cloud ]
```

---

## 2. 部署步骤详解

### 步骤一：准备云端 PostgreSQL 数据库 (推荐 Supabase / Neon)
1. 注册并登录 [Supabase](https://supabase.com) 或 [Neon](https://neon.tech)（均提供永久免费小型数据库实例）。
2. 创建新项目 `store-finder`。
3. 获取连接字符串（Async SQLAlchemy 格式）：
   ```env
   DATABASE_URL=postgresql+asyncpg://postgres:[YOUR-PASSWORD]@[HOST]:5432/postgres
   ```

### 步骤二：准备 Meilisearch 搜索引擎 (推荐 Meilisearch Cloud / Railway)
1. 方案 A（全托管）：注册 [Meilisearch Cloud](https://www.meilisearch.com/cloud)（提供 14 天免费体验与即开即用实例）。
2. 方案 B（自建轻量容器）：在 [Railway](https://railway.app) 或云主机中直接运行 Docker 镜像 `getmeili/meilisearch:v1.6`。
3. 获取实例地址与 Master Key：
   ```env
   MEILISEARCH_URL=https://ms-xxxx.meilisearch.io
   MEILISEARCH_MASTER_KEY=your_secure_master_key
   ```

### 步骤三：部署 FastAPI 后端 (推荐 Railway / Render / Fly.io)
1. 将代码仓库推送到 GitHub。
2. 登录 [Railway](https://railway.app) 或 [Render](https://render.com)，选择从 GitHub 导入仓库。
3. 设置 Root Directory 为 `backend`。
4. 设置启动命令（Start Command）：
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```
5. 配置环境变量（Environment Variables）：
   - `DATABASE_URL`: 步骤一获取的 Postgres 连接串
   - `MEILISEARCH_URL`: 步骤二获取的 Meilisearch 地址
   - `MEILISEARCH_MASTER_KEY`: 步骤二获取的 Key
   - `ADMIN_API_KEY`: 自定义后台管理密钥 (例如 `MySecureAdminKey_2026!`)
   - `BACKEND_CORS_ORIGINS`: `["https://your-frontend.vercel.app","http://localhost:5199","*"]`
6. 部署完成后，在后台终端执行一次种子数据导入：
   ```bash
   python data/seed_runner.py
   ```
7. 获取后端生产公网域名（例如 `https://store-finder-api.up.railway.app`）。

### 步骤四：部署 Next.js 前端到 Vercel
1. 登录 [Vercel](https://vercel.com)，点击 **Add New Project** 并选择 GitHub 仓库。
2. 在项目设置中：
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
3. 配置环境变量：
   - `NEXT_PUBLIC_API_BASE_URL`: `https://store-finder-api.up.railway.app/api/v1`
   - `BACKEND_INTERNAL_URL`: `https://store-finder-api.up.railway.app`
4. 点击 **Deploy**。约 1 分钟即可完成全球 CDN 部署！

---

## 3. 生产运维与数据维护

### 后台管理
- 访问 `https://your-frontend.vercel.app/admin`
- 输入在后端环境变量中配置的 `ADMIN_API_KEY` 即可安全登录。
- 可随时上传新的品牌门店 CSV，系统会自动完成商场清洗并实时推送至 Meilisearch 索引。

### 搜索引擎全量同步
- 如遇到索引数据与数据库不一致，可在管理后台点击「重构索引」或发起 POST 请求 `/api/v1/admin/search/reindex`，系统将在数秒内完成毫秒级全量重建。
