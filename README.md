# SmartNote 📝

SmartNote 是一个集成了大语言模型（基于智谱 AI）的现代化智能全栈笔记应用。它不仅支持基础的笔记记录与分类，还能对文件（如 PDF、PPTX）进行解析、利用 AI 提炼总结，并提供了一个功能完善的社区互动功能（多级评论、公开/私密笔记、个人主页）。

## ✨ 主要特性

- **🤖 AI 智能辅助** - 接入智谱 AI，支持智能化生成笔记摘要、内容补全与灵感扩展。
- **📄 丰富文档解析** - 支持提取并解析 PDF (`PyMuPDF`)、PPTX (`python-pptx`) 等多种格式的文件内容。
- **💬 多级嵌套评论区** - 类似 B 站/微博的现代化评论区交互，支持无线层级回复及扁平化展示，显示用户自定义头像。
- **🧑‍💻 用户系统 & 个人偏好** - 支持基于 JWT 的用户注册、登录、信息修改校验，以及本地自定义头像文件上传。
- **🔒 隐私与分享** - 笔记可以设置为公开或私有，保护个人灵感的同时也可以与他人交流分享。
- **💅 现代化 UI 体验** - 前端基于 React + Tailwind CSS，页面美观，响应式布局适配各种屏幕。

## 🛠 技术栈

### 前端 (Frontend)
- **核心框架**: React (Hooks-based)
- **UI 样式**: Tailwind CSS
- **网络请求**: Axios
- **组件结构**: 基于组件化开发 (`UserProfile`, `CommentSection`,笔记编辑器等)

### 后端 (Backend)
- **服务框架**: FastAPI (高性能异步 Python Web 框架)
- **数据库**: SQLite + SQLAlchemy (ORM)
- **身份验证**: JWT (JSON Web Tokens) 加密与鉴权 (passlib)
- **大模型接入**: ZhipuAI (`zhipuai` SDK)
- **环境管理**: `uv` (新一代极致快速的 Python 包与环境管理器)

---

## 🚀 快速开始

请确保您的电脑上已安装好 [Node.js](https://nodejs.org/) 以及 [uv](https://docs.astral.sh/uv/)（或 standard python + pip）。

### 1. 克隆项目
```bash
git clone https://github.com/your-username/SmartNote.git
cd SmartNote
```

### 2. 后端部署 (Backend)

进入后端目录，准备环境变量及运行服务：

```bash
cd backend

# 配置环境变量
# 复制 .env.example 为 .env (如果存在)，或者手动创建 .env 文件
# 在 .env 文件中添加如下内容：
echo "ZHIPUAI_API_KEY=your_zhipu_api_key_here" > .env

# 使用 uv 安装依赖并启动 FastAPI 接口
uv run main.py
```
> 后端服务默认会运行在 `http://localhost:8000`。
> 接口文档 (Swagger UI) 可以在 `http://localhost:8000/docs` 查看。

### 3. 前端部署 (Frontend)

打开一个新终端，进入前端目录：

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```
> 前端默认运行在本地的 `http://localhost:5173`。

---

## 📁 目录结构

```text
SmartNote/
├── backend/                  # 后端 FastAPI 服务
│   ├── uploads/              # 用户上传的头像与图片文件存储
│   ├── main.py               # FastAPI 核心入口与接口路由
│   ├── requirements.txt      # 依赖列表
│   └── ...                   # SQLite 数据库文件 (被 .gitignore 忽略)
├── frontend/                 # 前端 React 应用
│   ├── src/
│   │   ├── components/       # 核心组件库 (UserProfile, CommentSection 等)
│   │   ├── App.jsx           # 前端根路由与全局状态
│   │   └── main.jsx          # React 入口文件
│   ├── package.json          # 依赖管理
│   ├── tailwind.config.js    # 样式配置
│   └── vite.config.js        # 构建配置
├── .gitignore                # Git 提交忽略规则
└── README.md                 # 项目文档
```

## 🤝 参与贡献

欢迎任何形式的贡献！如果您发现了 Bug 或有激动人心的新想法，可以通过提交 Issue 或者发起 Pull Request 参与本项目。

1. Fork 本仓库
2. 创建您的 Feature 分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 发起 Pull Request

## 📄 开源协议

本项目基于 [MIT License](LICENSE) 开源，请自由使用。
