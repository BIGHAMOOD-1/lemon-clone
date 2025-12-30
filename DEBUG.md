# 调试指南

## 已修复的问题

1. ✅ **API 路由配置**：使用 `createOpenAI` 替代 `openai` 函数，正确配置自定义 baseURL
2. ✅ **代码结构**：所有文件已创建并检查，无 lint 错误
3. ✅ **数据文件**：`data/1.json` 已创建，支持多种格式

## 运行前检查清单

### 1. 安装依赖

由于 PowerShell 执行策略限制，请使用以下方式之一：

**方式 A：使用 CMD**
```cmd
cd "C:\Users\23527\Desktop\big dan\lemon-clone"
npm install
```

**方式 B：修改 PowerShell 执行策略（需要管理员权限）**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
cd "C:\Users\23527\Desktop\big dan\lemon-clone"
pnpm install
```

**方式 C：直接使用 npx（如果已安装 Node.js）**
```cmd
cd "C:\Users\23527\Desktop\big dan\lemon-clone"
npx pnpm install
```

### 2. 配置环境变量

在 `lemon-clone` 目录下创建 `.env.local` 文件：

```
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

### 3. 更新数据文件

将 `data/1.json` 替换为实际的聊天历史数据。支持两种格式：

**格式 1：字符串数组**
```json
[
  "消息1",
  "消息2"
]
```

**格式 2：对象数组**
```json
[
  {"content": "消息1"},
  {"message": "消息2"}
]
```

### 4. 运行开发服务器

```bash
npm run dev
# 或
pnpm dev
```

访问：http://localhost:3000

## 常见问题排查

### 问题 1：依赖安装失败
- 检查 Node.js 版本（建议 18+）
- 尝试清除缓存：`npm cache clean --force`
- 删除 `node_modules` 和 `package-lock.json` 后重新安装

### 问题 2：API 路由 500 错误
- 检查 `.env.local` 中的 `DEEPSEEK_API_KEY` 是否正确
- 检查 `data/1.json` 文件是否存在且格式正确
- 查看终端中的错误日志

### 3. 问题 3：页面无法加载
- 检查端口 3000 是否被占用
- 查看浏览器控制台的错误信息
- 确认所有依赖已正确安装

## 代码结构

```
lemon-clone/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts      # API 路由
│   ├── page.tsx              # 聊天界面
│   ├── layout.tsx            # 布局
│   └── globals.css           # 全局样式
├── data/
│   └── 1.json                # 历史数据
├── package.json
└── .env.local                # 环境变量（需创建）
```

## 技术栈

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Vercel AI SDK
- DeepSeek V3 API

