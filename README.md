# E-Shop

基于 React 19 的电商前端项目，集成 AI 助手、语义搜索、即时通讯和报价系统。

## 技术栈

| 类别 | 技术 |
|------|------|
| **框架** | React 19 + Create React App 5 |
| **语言** | JavaScript (JSX) |
| **路由** | react-router-dom v7 |
| **样式** | 原生 CSS |
| **构建** | Webpack 5 (react-scripts) |
| **HTTP** | 原生 fetch |

### 第三方服务

| 服务 | 用途 |
|------|------|
| **Supabase** | 商品图片和用户头像的云存储 |
| **DeepSeek** | AI 聊天助手（deepseek-v4-pro，流式输出） |
| **DashScope** | 文本嵌入生成（text-embedding-v4，1024维） |
| **ZhipuAI** | GLM-4.6V-FlashX 视觉识别 + 文件解析 |
| **DiceBear** | 默认头像生成 |

## 快速开始

### 环境变量

创建 `.env` 文件：

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_API_BASE_URL=http://localhost:8080
REACT_APP_DEEPSEEK_API_KEY=sk-your-deepseek-key
REACT_APP_DASHSCOPE_API_KEY=sk-your-dashscope-key
REACT_APP_ZHIPU_API_KEY=your-zhipu-api-key
```

### 启动

```bash
npm install
npm start          # 开发服务器 → http://localhost:3000
npm run build      # 生产构建 → build/
npm test           # 运行测试
```

## 项目结构

```
src/
  api/              # 后端接口封装
    config.js       # API_BASE 配置
    auth.js         # 登录、注册、验证码、密码重置
    product.js      # 商品 CRUD 和列表
    order.js        # 订单/报价（发送、提交、支付、拒绝）
    quotes.js       # 报价列表（已收到/已发送）
    chat.js         # 会话、消息、未读计数
    favorite.js     # 收藏（添加、获取、移除、推荐）
    supabase.js     # Supabase 对象存储
    zhipu.js        # ZhipuAI 文件解析/视觉识别
  components/       # 页面和组件
  aiPrompts.js      # AI 系统提示词
  aiTools.js        # AI 语义搜索（嵌入相似度匹配）
```

## API 概览

所有接口与后端 Spring Boot 服务交互，返回 `{ code, data, message }` 格式。

### 认证 `/user/*`

| 方法 | 接口 | 说明 |
|------|------|------|
| POST | `/user/login` | 邮箱密码登录 |
| POST | `/user/register` | 注册（含验证码） |
| POST | `/user/send-code` | 发送邮箱验证码 |
| POST | `/user/verify-code` | 校验验证码 |
| POST | `/user/reset-password` | 重置密码 |
| GET | `/user/info` | 获取当前用户信息 |
| PUT | `/user/update` | 更新用户信息 |
| GET | `/user/getInfoById/{id}` | 根据 ID 获取用户信息 |

### 商品 `/products/*`

| 方法 | 接口 | 说明 |
|------|------|------|
| POST | `/products/add` | 上架商品 |
| GET | `/products/details/{id}` | 商品详情 |
| POST | `/products/list` | 分页商品列表（支持分类/搜索/排序） |
| POST | `/products/aiList` | AI 商品列表 |
| PUT | `/products/update` | 更新商品 |
| DELETE | `/products/delete/{id}` | 下架商品 |

### 订单/报价 `/orders/*`

| 方法 | 接口 | 说明 |
|------|------|------|
| POST | `/orders/offer` | 发送报价 |
| GET | `/orders/get/{userId}/{otherUserId}` | 获取双方报价 |
| GET | `/orders/detail/{id}` | 订单详情 |
| PUT | `/orders/commit/{id}` | 确认报价 |
| PUT | `/orders/pay/{id}` | 支付 |
| PUT | `/orders/reject/{id}` | 拒绝报价 |
| GET | `/orders/received/{userId}` | 我收到的报价 |
| GET | `/orders/sent/{userId}` | 我发出的报价 |

### 聊天 `/chat/*`

| 方法 | 接口 | 说明 |
|------|------|------|
| GET | `/chat/conversations` | 会话列表 |
| GET | `/chat/messages/{userId}` | 与某人的聊天消息 |
| POST | `/chat/send` | 发送消息 |
| PUT | `/chat/read` | 标记已读 |
| GET | `/chat/unread/total` | 未读总数 |
| GET | `/chat/unread/conversations` | 各会话未读数 |

### 收藏 `/favorites/*`

| 方法 | 接口 | 说明 |
|------|------|------|
| POST | `/favorites/add/{productId}` | 添加收藏 |
| GET | `/favorites/list` | 收藏列表 |
| DELETE | `/favorites/{productId}` | 移除收藏 |
| GET | `/favorites/recommend` | 收藏推荐 |

## 路由

| 路径 | 组件 | 说明 |
|------|------|------|
| `/` | Home | 首页 |
| `/products` | Products | 商品列表 |
| `/product/:id` | ProductDetail | 商品详情 |
| `/product/add` | AddProduct | 上架商品 |
| `/product/edit/:id` | EditProduct | 编辑商品 |
| `/user/login` | Login | 登录 |
| `/user/register` | Register | 注册 |
| `/user` | User | 个人信息 |
| `/user/forgot-password` | ForgotPassword | 重置密码 |
| `/messages` | MessagesBox | 消息列表 |
| `/my-store` | MyStore | 我的店铺 |
| `/store/:userId` | SellerStore | 卖家店铺 |
| `/my-quotes` | MyQuotes | 我的报价 |
| `/order/:id` | OrderDetail | 订单详情 |
| `/favorites` | Favorites | 收藏列表 |
| `/file-parser-test` | FileParserTest | 文件解析测试 |

## 功能说明

- **AI 聊天助手** — 全局浮动的可拖动按钮，发送消息后执行语义搜索，DeepSeek 流式回复，匹配商品以卡片展示。
- **AI 一键上架** — 上传图片或文档，ZhipuAI 自动识别名称、价格、描述、分类。
- **语义搜索** — DeepSeek 优化查询 → DashScope 生成嵌入 → 余弦相似度匹配商品。
- **收藏推荐** — 基于收藏历史的商品名推荐（无收藏时随机推荐），点击自动搜索。
- **报价系统** — 买家发送报价，卖家确认/拒绝，买家支付，完整交易闭环。
- **即时通讯** — 买卖双方实时聊天，30秒轮询未读数，1秒轮询新消息。
