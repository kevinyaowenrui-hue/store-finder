# Store Finder 品牌门店搜索引擎 🏬

一款极简主义、毫秒级响应、信息高准确度的线下实体品牌门店/专柜精准检索与导航平台。
首期精选 **New Balance（新百伦）** 全国核心商圈门店作为种子试点，架构支持多品牌无缝扩展。

---

## 🌟 核心特性

- 🔍 **极简居中搜索**：单一核心输入框，占位文字 *「搜索品牌、商场、城市」*，支持拼音、别名、缩写及错别字容错。
- ⚡ **毫秒级响应**：基于 **Meilisearch** 倒排索引与分面加速，支持 `<20ms` 实时检索（附带无依赖 SQL 智能降级兜底）。
- 📇 **全要素门店卡片**：展示品牌 Logo、门店全称、所属商场、省市/行政区、具体楼层、官方直线电话、营业时间与更新时间戳。
- 🎯 **一键快捷行动点**：
  - 📞 **一键呼叫**：移动端直接调起系统拨号面板 (`tel:`)
  - 📋 **复制电话**：一键写入剪贴板并弹出优雅 Toast 提示
  - 🧭 **地图导航**：智能生成高德地图坐标导航或精准搜索链接
  - 🔗 **官网核实**：直达品牌官方认证网页
- 🏙️ **多维联动筛选**：动态提取数据库已收录省市级联菜单与热门城市药丸标签。
- 🛡️ **B 端数据治理后台 (`/admin`)**：
  - 门店增删改查（CRUD）
  - CSV 模板一键批量导入（自动匹配与创建商场，自动同步索引）
  - CSV 全量导出备份
  - 搜索引擎一键 Reindex 全量重构
  - 简易 API Key 安全鉴权

---

## 🛠️ 技术栈

| 层次 | 技术选型 | 说明 |
| :--- | :--- | :--- |
| **前端** | Next.js 14 (App Router) + Tailwind CSS + Lucide Icons | 服务端渲染、极简原子化样式、响应式布局 |
| **后端** | FastAPI (Python 3.11+) + Pydantic v2 | 异步高性能 ASGI，自动生成 OpenAPI / Swagger 文档 |
| **持久层** | PostgreSQL 15+ / SQLite + SQLAlchemy 2.0 (Async) | 强关系约束、ACID、省市商圈多表建模 |
| **检索层** | Meilisearch v1.6+ | 交互式全文检索、分面过滤、拼音与容错匹配 |
| **部署** | Vercel (前端) + 云端容器/小型实例 (后端+DB) | 边缘 CDN 加速、低成本/零成本上云 |

---

## 🚀 5 秒快速开始

### 1. 启动后端 (FastAPI)
```bash
cd backend
python -m pip install -r requirements.txt
python data/seed_runner.py  # 导入 New Balance 种子数据
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
后端 API 文档：`http://127.0.0.1:8000/docs`

### 2. 启动前端 (Next.js)
```bash
cd frontend
npm install
npm run dev
```
前端主页：`http://127.0.0.1:5199`
管理后台：`http://127.0.0.1:5199/admin`（默认密钥：`admin123456`）

---

## 📂 项目文件结构

```
store finder/
├── backend/                        # FastAPI 后端源码
│   ├── app/
│   │   ├── main.py                 # FastAPI 入口与生命周期
│   │   ├── core/config.py          # 环境变量与配置
│   │   ├── core/security.py        # Admin 鉴权中间件
│   │   ├── db/models.py            # Brand, Mall, Store ORM 模型
│   │   ├── db/session.py           # 异步 SQLAlchemy 会话
│   │   ├── schemas/store.py        # Pydantic 校验与响应 DTO
│   │   ├── services/meili_service.py # Meilisearch 检索与降级适配
│   │   ├── services/store_service.py # 门店业务逻辑与 CSV 解析
│   │   └── api/v1/                 # 搜索、元数据与管理 API
│   ├── data/
│   │   ├── nb_stores_seed.csv      # New Balance 32+ 全国核心门店数据
│   │   └── seed_runner.py          # 数据库初始化与数据导入脚本
│   ├── tests/test_api.py           # 自动化测试用例 (100% 通过)
│   └── requirements.txt
├── frontend/                       # Next.js 前端源码
│   ├── src/
│   │   ├── app/page.tsx            # 极简搜索主页
│   │   ├── app/admin/page.tsx      # 管理后台 (CRUD + CSV 导入导出)
│   │   ├── components/             # SearchBar, FilterBar, StoreCard, Header, Toast
│   │   └── lib/                    # API 客户端与 TypeScript 类型
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── docker-compose.yml              # 可选：PostgreSQL + Meilisearch 一键启动
├── LOCAL_DEV.md                    # 本地开发与调试详尽指南
├── DEPLOYMENT.md                   # Vercel + 云端实例生产部署指南
└── README.md
```

---

## 📄 详细文档
- 📘 [本地开发指南 (LOCAL_DEV.md)](./LOCAL_DEV.md)
- 🚀 [生产部署与上云方案 (DEPLOYMENT.md)](./DEPLOYMENT.md)
