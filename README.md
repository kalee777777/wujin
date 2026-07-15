# HOLGENVY 管理后台

## 项目结构

```
├── backend/                # 后端服务
│   ├── config/             # 配置文件
│   │   └── database.js     # 数据库配置
│   ├── middleware/         # 中间件
│   │   └── auth.js         # JWT 认证
│   ├── routes/             # API 路由
│   │   ├── auth.js         # 认证接口
│   │   ├── products.js     # 产品管理
│   │   ├── posts.js        # 帖子管理
│   │   ├── categories.js   # 分类管理
│   │   ├── upload.js       # 文件上传
│   │   └── stats.js        # 数据统计
│   ├── scripts/            # 脚本
│   │   ├── initDatabase.js     # 初始化数据库
│   │   └── migrateProducts.js  # 迁移产品数据
│   ├── data/               # SQLite 数据库文件（自动生成）
│   ├── .env                # 环境变量
│   ├── package.json
│   └── server.js           # 入口文件
│
└── admin/                  # 管理后台前端
    ├── public/             # 静态资源
    │   └── tracking.js     # 访问统计埋点脚本
    ├── src/
    │   ├── layouts/        # 布局组件
    │   ├── views/          # 页面组件
    │   ├── stores/         # Pinia 状态管理
    │   ├── router/         # 路由配置
    │   ├── utils/          # 工具函数
    │   └── styles/         # 样式文件
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## 快速开始

### 1. 安装依赖

```bash
# 后端
cd backend
npm install

# 前端
cd admin
npm install
```

### 2. 初始化数据库

```bash
cd backend
npm run init-db
```

这将创建 SQLite 数据库并初始化：
- 默认分类
- 两个管理员账号

### 3. 迁移现有产品数据

```bash
npm run migrate-products
```

将 `products.json` 中的数据导入数据库。

### 4. 启动服务

```bash
# 启动后端（端口 3001）
cd backend
npm run dev

# 启动前端（端口 5173）
cd admin
npm run dev
```

### 5. 访问管理后台

打开浏览器访问：http://localhost:5173

**默认账号：**
- 管理员：admin / admin123
- 管理员：manager / manager123

## API 接口文档

### 认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/login | 登录 |
| GET | /api/auth/me | 获取当前用户信息 |
| PUT | /api/auth/password | 修改密码 |
| POST | /api/auth/logout | 退出登录 |

### 产品接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/products | 获取产品列表 |
| GET | /api/products/:id | 获取单个产品 |
| POST | /api/products | 创建产品 |
| PUT | /api/products/:id | 更新产品 |
| DELETE | /api/products/:id | 删除产品 |
| POST | /api/products/batch-delete | 批量删除 |

### 帖子接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/posts | 获取帖子列表 |
| GET | /api/posts/:id | 获取单个帖子 |
| POST | /api/posts | 创建帖子 |
| PUT | /api/posts/:id | 更新帖子 |
| DELETE | /api/posts/:id | 删除帖子 |
| POST | /api/posts/batch-delete | 批量删除 |

### 分类接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/categories | 获取分类列表 |
| POST | /api/categories | 创建分类 |
| PUT | /api/categories/:id | 更新分类 |
| DELETE | /api/categories/:id | 删除分类 |

### 上传接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/upload/image | 单图上传 |
| POST | /api/upload/images | 多图上传 |
| DELETE | /api/upload/image | 删除图片 |

### 统计接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/stats/log | 记录访问日志 |
| GET | /api/stats/dashboard | 获取看板数据 |

## 使用外部 API

所有需要认证的接口都需要在请求头中携带 Token：

```javascript
fetch('/api/products', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    name: '新产品',
    folder: 'new-product',
    // ...
  })
})
```

### 示例：使用 curl 发布产品

```bash
# 1. 登录获取 Token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 2. 使用 Token 创建产品
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "新产品",
    "folder": "new-product",
    "category_id": 1,
    "description": "产品描述",
    "specs": {"电压": "36V"},
    "images": ["product-images/new-product/image1.jpg"]
  }'
```

## 访问统计埋点

在官网页面中引入埋点脚本：

```html
<script src="/tracking.js"></script>
```

埋点脚本会自动：
- 记录页面访问（PV）
- 记录产品详情页浏览
- 记录来源页面

## 部署到服务器

### 1. 构建前端

```bash
cd admin
npm run build
```

生成的文件在 `admin/dist` 目录。

### 2. 生产环境配置

修改 `backend/.env`：

```env
NODE_ENV=production
PORT=3001
JWT_SECRET=your-strong-secret-key
UPLOAD_DIR=/path/to/product-images
```

### 3. 使用 PM2 管理进程

```bash
npm install -g pm2
cd backend
pm2 start server.js --name holgenvy-api
```

### 4. Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端
    location / {
        root /path/to/admin/dist;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 图片
    location /product-images {
        alias /path/to/product-images;
    }
}
```

## 功能清单

- ✅ 管理员登录/退出
- ✅ 修改密码
- ✅ 数据看板（产品统计、访问趋势、分类分布）
- ✅ 产品管理（增删改查、批量删除、图片上传）
- ✅ 帖子管理（富文本编辑器、分类、发布状态）
- ✅ 分类管理
- ✅ 图片上传
- ✅ 访问统计埋点
- ✅ RESTful API 接口