# Cloudflare Pages 部署指南

将 HOLGENVY 管理控制台和 API 部署到 Cloudflare 全家桶（Pages + D1 + R2）。

---

## 架构概览

| 组件 | Cloudflare 服务 | 用途 |
|------|----------------|------|
| 静态网站 | Pages Assets | 前端页面 (index.html, blog.html 等) |
| 帖子详情页 | Pages Assets + R2 Fallback | 已有帖子走 Assets，新帖子从 R2 读取 |
| Admin 控制台 | Pages Assets + SPA 路由 | Vue 3 管理后台 (/admin/) |
| API 后端 | Pages Functions | Express API 路由迁移 |
| 数据库 | D1 (SQLite 兼容) | 替代本地 SQLite |
| 图片存储 | R2 Object Storage | 替代本地磁盘上传 |
| 帖子 HTML | R2 Object Storage | 新创建的帖子静态 HTML 存储在 R2 |

---

## 帖子静态 HTML 方案

帖子始终以静态 HTML 形式提供服务：

1. **已有帖子**（迁移到 Cloudflare 之前创建的）：随 Pages Assets 一起部署，直接由 Pages CDN 服务。
2. **新帖子**（通过 admin 后台发布后）：
   - API 将帖子数据保存到 D1
   - 后端生成 `blog-post-{slug}.html` 静态文件并上传到 R2
   - 同时重建 `blog.html` 和 `resources.html` 并上传到 R2
   - Cloudflare Pages 的 `blog-post-[slug].js` Function 作为 R2 fallback，当 Assets 中找不到文件时从 R2 读取

这种方案确保了 SEO 友好的纯静态 HTML 输出，同时支持动态管理。

---

## 前置条件

1. 安装 Node.js >= 18
2. 安装 Wrangler CLI：
   ```bash
   npm install -g wrangler
   ```
3. 登录 Cloudflare：
   ```bash
   wrangler login
   ```

---

## 步骤 1：创建 D1 数据库

```bash
# 在项目根目录执行
wrangler d1 create holgenvy
```

执行后会输出类似：
```
✅ Successfully created DB 'holgenvy'
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**将输出的 `database_id` 填入 `wrangler.toml` 中替换 `YOUR_D1_DATABASE_ID`。**

然后初始化数据库 schema：
```bash
wrangler d1 execute holgenvy --file=schema.sql
```

---

## 步骤 2：创建 R2 存储桶

```bash
wrangler r2 bucket create holgenvy-images
```

---

## 步骤 3：迁移现有数据到 D1

从本地 SQLite 导出数据：
```bash
npm install  # 安装 bcryptjs 等依赖
node scripts/migrate-to-d1.js > d1-data.sql
```

导入到 D1：
```bash
wrangler d1 execute holgenvy --file=d1-data.sql
```

---

## 步骤 4：构建 Admin 控制台

```bash
cd admin
npm install
npm run build
cd ..
```

确保 `admin/dist/` 目录存在且包含构建产物。

---

## 步骤 5：本地测试

```bash
wrangler pages dev . --compatibility-date=2024-09-01
```

测试以下功能：
- 访问 `http://localhost:8788/` 看到前端网站
- 访问 `http://localhost:8788/blog.html` 看到博客列表
- 访问 `http://localhost:8788/blog-post-*.html` 看到已有帖子
- 访问 `http://localhost:8788/admin/` 看到管理后台登录页
- 登录后发布新帖子，验证静态 HTML 已生成

---

## 步骤 6：部署到 Cloudflare Pages

```bash
wrangler pages deploy . --project-name=wujin
```

如果项目不存在，Wrangler 会提示创建。选择 Yes 即可。

---

## 步骤 7：绑定 D1 和 R2 到 Pages 项目

在 Cloudflare Dashboard 中操作：

1. 打开 Cloudflare Dashboard → Pages
2. 选择你的项目（如 `wujin`）
3. 进入 Settings → Functions
4. 在 D1 Database Bindings 中添加：
   - Variable name: `DB`
   - D1 database: `holgenvy`
5. 在 R2 Bucket Bindings 中添加：
   - Variable name: `BUCKET`
   - R2 bucket: `holgenvy-images`

---

## 环境变量（可选）

在 Cloudflare Dashboard → Pages → Settings → Environment variables 中设置：

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| JWT_SECRET | JWT 签名密钥 | holgenvy-admin-secret-key-2024 |

建议修改默认密钥以提高安全性。

---

## 文件结构说明

```
/
├── functions/                         # Cloudflare Pages Functions
│   ├── _middleware.js                 # 全局 CORS 中间件
│   ├── _lib/                          # 共享库
│   │   ├── utils.js                   # 工具函数
│   │   ├── auth.js                    # JWT 认证 + bcrypt
│   │   └── routes/                    # 路由处理模块
│   │       ├── auth.js                # 登录/认证
│   │       ├── posts.js               # 帖子 CRUD + 静态 HTML 生成
│   │       ├── inquiries.js           # 询盘管理
│   │       ├── products.js            # 产品管理
│   │       ├── categories.js          # 分类管理
│   │       ├── upload.js              # 图片上传到 R2
│   │       └── stats.js               # 访问统计
│   ├── api/[...path].js              # API catch-all 路由
│   ├── blog-post-[slug].js           # 帖子 R2 fallback（Assets 中无文件时从 R2 读取）
│   └── product-images/[...path].js   # R2 图片代理
├── admin/                             # Vue 3 管理后台
│   └── dist/                          # 构建产物
├── _redirects                         # Admin SPA 路由重写
├── _routes.json                       # Functions 路由配置
├── wrangler.toml                      # Cloudflare 配置
├── schema.sql                         # D1 数据库 schema
├── *.html                             # 前端静态页面
├── blog-post-*.html                   # 已有帖子静态 HTML（Pages Assets）
├── product-images/                    # 已有产品图片（Pages Assets）
└── scripts/
    └── migrate-to-d1.js               # 数据迁移脚本
```

---

## 数据流

```
用户访问 /blog-post-xxx.html
    │
    ├─ 1. Pages Assets 查找 → 找到？→ 直接返回（最快）
    │
    └─ 2. blog-post-[slug].js Function → 从 R2 读取 → 返回
```

```
Admin 发布新帖子
    │
    ├─ 1. POST /api/posts/publish → 保存到 D1
    │
    ├─ 2. 生成 blog-post-{slug}.html → 上传到 R2
    │
    └─ 3. 重建 blog.html + resources.html → 上传到 R2
```

---

## 注意事项

1. **帖子始终是静态 HTML**：无论是通过 Pages Assets 还是 R2 代理，帖子页面都是纯静态 HTML，SEO 友好。

2. **发布即生效**：在 admin 后台发布帖子后，会自动生成静态 HTML 并上传到 R2，用户刷新即可看到。

3. **前端同步**：`POST /api/posts/sync-frontend` 可重新生成所有帖子的静态 HTML，适用于需要批量更新的场景。

4. **图片上传到 R2**：新图片通过 R2 存储，已有图片通过 Pages Assets 直接服务。

5. **Admin 控制台**：前端代码不变，API 调用路径不变（`/api/*`），部署到 `/admin/` 路径。

6. **CORS**：全局中间件已配置允许跨域，支持前后端分离部署。
