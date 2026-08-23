# Vultr VPS 部署指南 - HOLGENVY 五金工具网站

## 架构概览

```
用户访问 holgenvy.com
        ↓
   Cloudflare（DNS 解析 + SSL + CDN 加速）
        ↓
   Vultr VPS（1核1G / $5月）
   ┌─────────────────────────────┐
   │  Nginx（80/443端口）         │
   │    ↓                        │
   │  Express（3001端口）         │
   │    ├─ / → 前端静态页面       │
   │    ├─ /admin → Admin 控制台  │
   │    ├─ /api → 后端 API        │
   │    └─ /product-images → 图片  │
   │  SQLite 数据库              │
   │  PM2 进程管理               │
   └─────────────────────────────┘
```

---

## 第一步：购买 Vultr 服务器

### 1.1 注册账号

1. 打开 https://www.vultr.com
2. 点击 **Sign Up**（支持邮箱注册，也支持 GitHub/Google 登录）
3. 填写邮箱和密码，完成注册
4. 验证邮箱

### 1.2 充值

1. 登录后进入 **Billing** 页面
2. 选择支付方式（支持支付宝 Alipay、信用卡、PayPal）
3. 充值 **$10**（够跑 2 个月）

### 1.3 创建服务器

1. 点击左侧 **Products** → **Deploy New Server**
2. 选择类型：**Cloud Compute** → **Shared CPU**
3. 选择配置：

| 项目 | 选择 |
|------|------|
| CPU & Storage | **Regular Performance** → **1 vCPU, 1GB RAM, 25GB SSD ($5/mo)** |
| Location（机房） | 根据主要客户选择（见下表） |
| Image（系统） | **Ubuntu 24.04 LTS** |
| SSH Key | 暂时不用管，后面设置密码也行 |

**机房选择建议：**

| 主要客户地区 | 推荐机房 | 延迟 |
|-------------|---------|------|
| 欧美为主 | **New Jersey** 或 **New York** | ~150-200ms |
| 全球均匀 | **Singapore** | ~50-80ms（亚洲快） |
| 东南亚/日本 | **Tokyo** | ~60-100ms |
| 欧洲为主 | **Frankfurt** 或 **Amsterdam** | ~120-160ms |

4. 点击 **Deploy Now**
5. 等待 1-2 分钟，服务器创建完成

### 1.4 获取服务器信息

服务器创建完成后，在 Products 列表中点击服务器，获取：

- **IP Address**：如 `149.248.xx.xx`
- **Password**：Root 密码（Vultr 会邮件发送，也可以在 Dashboard 重置）

---

## 第二步：连接服务器

### 2.1 通过终端连接

打开 Mac 终端（Terminal），执行：

```bash
ssh root@你的服务器IP
```

首次连接会提示 "Are you sure you want to continue connecting?"，输入 `yes`，然后输入密码。

### 2.2 修改密码（可选但推荐）

```bash
passwd
```

输入新密码两次。

---

## 第三步：安装运行环境

依次执行以下命令（一行一行复制粘贴）：

### 3.1 更新系统

```bash
apt update && apt upgrade -y
```

### 3.2 安装 Node.js 18

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
```

验证安装：

```bash
node -v   # 应该显示 v18.x.x
npm -v    # 应该显示 9.x.x 或 10.x.x
```

### 3.3 安装 Nginx

```bash
apt install -y nginx
```

### 3.4 安装 PM2（进程管理器）

```bash
npm install -g pm2
```

### 3.5 安装 Git

```bash
apt install -y git
```

### 3.6 安装编译工具（better-sqlite3 需要）

```bash
apt install -y build-essential python3
```

---

## 第四步：部署代码

### 4.1 克隆仓库

```bash
cd /var/www
git clone -b feat/cloudflare-pages https://gitee.com/kestrelmetal_0/hadrware-tool.git holgenvy
cd holgenvy
```

> 如果 Gitee 需要认证，使用：`git clone -b feat/cloudflare-pages https://你的用户名:你的密码@gitee.com/kestrelmetal_0/hadrware-tool.git holgenvy`

### 4.2 安装后端依赖

```bash
cd /var/www/holgenvy/backend
npm install --production
```

### 4.3 构建 Admin 前端

```bash
cd /var/www/holgenvy/admin
npm install
npm run build
```

### 4.4 创建数据目录

```bash
mkdir -p /var/www/holgenvy/backend/data
mkdir -p /var/www/holgenvy/product-images
```

### 4.5 配置环境变量

```bash
cat > /var/www/holgenvy/backend/.env << 'EOF'
NODE_ENV=production
PORT=3001
DB_PATH=/var/www/holgenvy/backend/data/holgenvy.db
UPLOAD_DIR=/var/www/holgenvy/product-images
JWT_SECRET=holgenvy-production-secret-change-me
ADMIN_USERNAME_1=admin
ADMIN_PASSWORD_1=admin123
ADMIN_USERNAME_2=manager
ADMIN_PASSWORD_2=manager123
EOF
```

> **重要**：上线前务必修改 `JWT_SECRET`、`ADMIN_PASSWORD_1`、`ADMIN_PASSWORD_2`！

### 4.6 测试启动

```bash
cd /var/www/holgenvy/backend
node server.js
```

如果看到 `🚀 服务已启动: http://localhost:3001`，说明后端正常。按 `Ctrl+C` 停止。

---

## 第五步：使用 PM2 管理进程

### 5.1 启动服务

```bash
cd /var/www/holgenvy/backend
pm2 start server.js --name holgenvy-api
```

### 5.2 设置开机自启

```bash
pm2 startup
# 按照输出的提示执行那条 sudo 命令
pm2 save
```

### 5.3 常用 PM2 命令

```bash
pm2 list              # 查看所有进程
pm2 logs holgenvy-api # 查看日志
pm2 restart holgenvy-api  # 重启
pm2 stop holgenvy-api     # 停止
pm2 delete holgenvy-api   # 删除
```

---

## 第六步：配置 Nginx 反向代理

### 6.1 创建 Nginx 配置

```bash
cat > /etc/nginx/sites-available/holgenvy << 'NGINX'
server {
    listen 80;
    server_name holgenvy.com www.holgenvy.com;

    client_max_body_size 20M;

    # API 接口代理
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 产品图片（静态文件直接返回）
    location /product-images/ {
        alias /var/www/holgenvy/product-images/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Admin 管理台
    location /admin/ {
        alias /var/www/holgenvy/admin/dist/;
        try_files $uri $uri/ /admin/index.html;

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }

    # 前端静态文件
    location / {
        root /var/www/holgenvy;
        index index.html;
        try_files $uri $uri/ =404;
    }
}
NGINX
```

### 6.2 启用配置

```bash
ln -s /etc/nginx/sites-available/holgenvy /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t          # 测试配置语法
systemctl reload nginx   # 重新加载
systemctl enable nginx   # 开机自启
```

### 6.3 测试本地访问

```bash
curl -I http://localhost
```

应该返回 `HTTP/1.1 200 OK`。

---

## 第七步：配置防火墙

```bash
# 安装防火墙
apt install -y ufw

# 允许必要端口
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS

# 启用防火墙
ufw enable
```

---

## 第八步：配置 Cloudflare DNS

1. 登录 https://dash.cloudflare.com
2. 进入 `holgenvy.com` 的 DNS 设置
3. 添加 A 记录：

| 类型 | 名称 | 内容 | 代理状态 |
|------|------|------|---------|
| A | `@` | 你的 Vultr IP（如 `149.248.xx.xx`） | **仅 DNS**（关闭代理） |
| A | `www` | 你的 Vultr IP | **仅 DNS**（关闭代理） |

> **重要**：先选 **仅 DNS**（灰色云朵），等确认 VPS 访问正常后再开启代理（橙色云朵）。

4. 等待 DNS 生效（通常 1-5 分钟）
5. 测试访问：浏览器打开 `http://你的Vultr IP`，应该看到网站首页

---

## 第九步：配置 SSL 证书（HTTPS）

### 方案 A：Cloudflare SSL（推荐，最简单）

1. 在 Cloudflare Dashboard → SSL/TLS → Overview
2. 选择 **Full（Strict）** 模式
3. 在 Vultr 服务器上安装 Cloudflare Origin Certificate：

```bash
# 在 Cloudflare Dashboard → SSL/TLS → Origin Server → Create Certificate
# 复制证书和私钥

mkdir -p /etc/nginx/ssl

# 创建证书文件（将 Cloudflare 给的证书内容粘贴进去）
nano /etc/nginx/ssl/cert.pem
# 粘贴 Certificate 内容，保存

# 创建私钥文件
nano /etc/nginx/ssl/key.pem
# 粘贴 Private Key 内容，保存
```

修改 Nginx 配置添加 SSL：

```bash
cat > /etc/nginx/sites-available/holgenvy << 'NGINX'
server {
    listen 80;
    server_name holgenvy.com www.holgenvy.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name holgenvy.com www.holgenvy.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    client_max_body_size 20M;

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /product-images/ {
        alias /var/www/holgenvy/product-images/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    location /admin/ {
        alias /var/www/holgenvy/admin/dist/;
        try_files $uri $uri/ /admin/index.html;

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }

    location / {
        root /var/www/holgenvy;
        index index.html;
        try_files $uri $uri/ =404;
    }
}
NGINX

nginx -t && systemctl reload nginx
```

### 方案 B：Let's Encrypt（免费证书，不走 Cloudflare 代理时使用）

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d holgenvy.com -d www.holgenvy.com
# 按提示操作，选择自动重定向 HTTP 到 HTTPS
# 证书自动续期（certbot 已设置 cron job）
```

---

## 第十步：验证部署

### 10.1 测试所有功能

| 测试项 | URL | 预期结果 |
|--------|-----|---------|
| 首页 | `https://holgenvy.com/` | 显示五金工具网站首页 |
| 博客页 | `https://holgenvy.com/blog.html` | 显示博客列表 |
| 产品页 | `https://holgenvy.com/resources.html` | 显示资源页面 |
| Admin 登录 | `https://holgenvy.com/admin/` | 显示登录页面 |
| API 健康检查 | `https://holgenvy.com/api/health` | 返回 `{"status":"ok"}` |

### 10.2 测试 Admin 登录

1. 打开 `https://holgenvy.com/admin/`
2. 输入用户名 `admin`，密码 `admin123`
3. 应该成功登录，跳转到帖子管理页面

---

## 第十一步：后续更新代码

当代码有更新时，在服务器上执行：

```bash
cd /var/www/holgenvy

# 拉取最新代码
git pull

# 重新安装后端依赖（如果有新依赖）
cd backend && npm install --production

# 重新构建 Admin（如果有前端修改）
cd ../admin && npm run build

# 重启服务
pm2 restart holgenvy-api
```

---

## 常见问题

### Q: 上传图片失败？
检查上传目录权限：
```bash
chmod -R 755 /var/www/holgenvy/product-images
chown -R www-data:www-data /var/www/holgenvy/product-images
```

### Q: API 返回 502 Bad Gateway？
检查 Express 是否在运行：
```bash
pm2 list
pm2 logs holgenvy-api --lines 20
```

### Q: 内存不够用？
```bash
# 创建 1GB Swap 交换空间
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Q: 如何查看服务器资源使用？
```bash
htop          # 内存和 CPU（需安装：apt install htop）
df -h         # 磁盘使用
free -h       # 内存使用
```

---

## 费用总结

| 项目 | 费用 |
|------|------|
| Vultr VPS（1核1G） | $5/月（$60/年） |
| Cloudflare（DNS + SSL + CDN） | 免费 |
| 域名 holgenvy.com | 已有 |
| **合计** | **$5/月（约 36 元人民币/月）** |