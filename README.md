# ShieldPlate - 高端电商平台 ⚡️

ShieldPlate 是一个基于现代前沿技术栈构建的高端电商平台示例。项目采用全栈异步架构，注重视觉美感与极速交互体验。

## � 项目结构

```text
label-3876/
├── backend/                # 后端代码 (Python FastAPI)
│   ├── app/                # 核心业务逻辑
│   │   ├── main.py         # 应用入口与配置
│   │   ├── routes.py       # API 路由定义
│   │   ├── models.py       # SQLAlchemy 数据库模型
│   │   └── schemas.py       # Pydantic 数据验证模型
│   ├── Dockerfile          # 后端镜像构建
│   └── seed.py             # 数据库初始化脚本
├── frontend/               # 前端代码 (React + Vite)
│   ├── src/
│   │   ├── components/     # 通用 UI 组件
│   │   ├── contexts/       # 全局状态管理 (Auth, Cart, Fav)
│   │   ├── pages/          # 页面组件
│   │   ├── api.ts          # API 请求封装
│   │   ├── mocks.ts        # 模拟数据中心
│   │   └── types.ts        # TypeScript 类型定义
│   ├── Dockerfile          # 前端镜像构建
│   └── nginx.conf          # Nginx 反向代理配置
└── docker-compose.yml       # 多容器编排
```

## �🛠 技术栈
- **Frontend**: React 18 + Tailwind CSS + Vite + Lucide Icons (超清图标)
- **Backend**: Python FastAPI (高性能异步 Web 框架)
- **DB**: PostgreSQL 15 (核心存储) + Redis 7 (缓存/消息)
- **Deployment**: Docker + Docker Compose (一键部署)

## 🚀 快速启动 (Docker)
1. **确保 Docker Desktop 已运行**。
2. **在根目录执行**：
   ```bash
   docker compose up --build
   ```
3. **访问服务**：
   - 🛰 **前端界面**：[http://localhost:3876](http://localhost:3876) (极致流畅的购物体验)
   - ⚙️ **后端文档**：[http://localhost:8876/docs](http://localhost:8876/docs) (Swagger UI 交互式文档)
   - 🗄 **数据库端口**：`5876` (内部 5432)

## 🧪 测试账号
本项目目前采用模拟认证机制，您可以使用任何用户名进行登录测试：
- **用户名**: `admin`
- **密码**: `password123` (任意输入即可)

> [!TIP]
> 登录后，您可以体验完整的个人中心、订单历史以及在线聊天功能。

## 📸 功能介绍

### 1. 极速商品展示
- **动态分类**: 涵盖潮流服装、智能数码、美妆护肤等六大热点分类。
- **智能搜索**: 实时过滤商品，毫秒级响应。
- **视觉反馈**: 悬停动画、毛玻璃效果、流畅的页面转场。

### 2. 精品详情页
- **规格联动**: 支持颜色、配置等多种规格实时切换。
- **库存感知**: 根据选定规格动态更新价格与实时库存。
- **沉浸式图库**: 支持多图预览与缩放功能。

### 3. 智能购物车
- **动态计算**: 实时结算总额。
- **持久化**: 同步至本地存储与云端状态（可选）。

### 4. 实时互动
- **在线客服**: 内置实时的在线客服聊天界面，支持模拟消息往返。
- **收藏系统**: 快速收藏心仪商品，全站状态实时同步。

### 5. 高端个人中心
- **订单追踪**: 完整模拟订单生命周期展示。
- **安全设置**: 包含账号、偏好及通知设置。

---

> [!NOTE]
> *本项目通过 `docker compose` 进行全环境容器化部署，包含数据库自动初始化与 Seed 数据填充，非常适合新手作为全栈项目学习参考。*
