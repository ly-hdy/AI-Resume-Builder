# AI Resume Builder

AI Resume Builder 是一个基于 Next.js 的中文简历生成与优化工具。它支持简历结构化编辑、模板预览、PDF 导出、JD 解析、AI 匹配分析和简历内容润色，适合用于求职简历制作、岗位匹配和简历版本管理。

## 功能概览

- 简历工作台：`/dashboard`
- 简历列表：`/resumes`
- 新建或上传简历：`/resumes/new`
- 简历编辑器：`/resumes/[resumeId]/edit`
- A4 简历预览与浏览器打印导出 PDF：`/resumes/[resumeId]/preview`
- 简历版本管理：`/resumes/[resumeId]/versions`
- JD 输入、上传与解析：`/resumes/[resumeId]/jd`
- AI 匹配分析与优化建议：`/resumes/[resumeId]/ai-review`
- API 健康检查：`/api/health`

## 核心能力

- 本地保存简历草稿，数据存储在浏览器 `localStorage`。
- 支持手动创建简历，也支持上传 JSON / TXT / MD / PDF / Word 文件生成草稿。
- 支持 JD 文本粘贴、示例填充、TXT / MD / JSON 文件读取。
- 支持 JD 截图 OCR，文件类型包括 PNG / JPG / JPEG / WEBP / BMP。
- 支持多种中文简历模板，包括正式学术模板、实习生模板、应届生模板、社招模板、经典单栏、紧凑单栏、侧栏模板等。
- 支持字体、字号、行距、页边距、照片位置、正文位置、标题粗细、正文颜色、标题颜色等排版设置。
- 支持 DeepSeek API 驱动的简历解析、JD 解析、匹配分析和经历润色。

## 技术栈

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Tesseract.js
- Mammoth
- PDF.js
- DeepSeek API

## 环境要求

- Node.js 18.18 或更高版本
- npm

## 本地运行

```bash
cd "D:\桌面\code\创新\profile web"
npm install
npm run dev
```

默认访问：

```text
http://localhost:3000
```

如果 3000 端口被占用，可以指定端口：

```bash
npm run dev -- -p 3001
```

## 环境变量

复制 `.env.example` 为 `.env.local`：

```bash
copy .env.example .env.local
```

本项目主要使用以下环境变量：

```text
DEEPSEEK_API_KEY=你的 DeepSeek API Key
DEEPSEEK_MODEL=deepseek-v4-flash
DATABASE_URL=
```

说明：

- `DEEPSEEK_API_KEY`：必填，用于 AI 简历解析、JD 解析、匹配分析和内容润色。
- `DEEPSEEK_MODEL`：可选，默认使用 `deepseek-v4-flash`。
- `DATABASE_URL`：当前项目暂未实际使用，可以先留空。

不要提交 `.env.local`，该文件已经在 `.gitignore` 中忽略。

## 常用脚本

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## 部署到 Vercel

1. 将项目推送到 GitHub。
2. 登录 Vercel。
3. 新建项目并导入 GitHub 仓库。
4. Framework Preset 选择 `Next.js`。
5. Install Command 使用默认值：

```text
npm install
```

6. Build Command 使用默认值：

```text
npm run build
```

7. 在 Vercel 项目的环境变量中添加：

```text
DEEPSEEK_API_KEY
DEEPSEEK_MODEL
```

8. 保存环境变量后重新部署。

部署成功后，Vercel 会生成一个 `*.vercel.app` 域名，其他人可以通过该网址访问网站。

## 部署注意事项

- 线上网站和本地网站的 `localStorage` 不互通，部署后不会自动带上本地浏览器里保存的简历草稿。
- 如果 AI 功能提示 API Key 未配置，请检查 Vercel 的 `Environment Variables` 是否填写正确，并在保存后重新部署。
- GitHub Pages 不适合直接部署完整项目，因为本项目使用了 Next.js API Routes。推荐使用 Vercel。

## 项目结构

```text
app/
  api/                  # AI 与健康检查 API
  dashboard/            # 工作台
  jds/                  # JD 管理入口
  resumes/              # 简历列表、新建、编辑、预览、版本、JD、AI 分析
components/
  layout/               # 页面布局组件
  resume-editor/        # 简历编辑器与预览核心
  ui/                   # 基础 UI 组件
lib/
  jd-data.ts            # JD 数据结构与本地存储
  resume-data.ts        # 简历默认数据、归一化、本地存储 key
  resume-file-parser.ts # 简历文件解析
  resume-templates.ts   # 模板目录
types/
  ai.ts
  jd.ts
  resume.ts
public/
  pdfjs/                # PDF.js 浏览器资源
```

## 数据存储

当前版本主要使用浏览器本地存储：

- 简历草稿：`localStorage`
- JD 解析结果：`localStorage`
- 上传文件不会自动上传到云端数据库

这意味着不同浏览器、不同设备之间的数据不会自动同步。

## 验收建议

本地或线上部署后，可以按以下步骤检查主要功能：

1. 打开 `/resumes/new`，新建一份简历。
2. 进入编辑器，填写基本信息、教育经历、项目经历等。
3. 调整字体、字号、行距、页边距、正文位置、正文颜色和标题颜色。
4. 打开预览页，检查 A4 页面效果。
5. 使用浏览器打印功能另存为 PDF。
6. 打开 JD 页面，粘贴或上传 JD 文本。
7. 保存 JD 后进入 AI 匹配分析页面，检查分析结果。

## GitHub 仓库

```text
https://github.com/ly-hdy/AI-Resume-Builder
```

## 从 0 到上线教程

如果你想了解这个项目从本地开发到 GitHub、Vercel 上线的完整过程，可以阅读：

```text
TUTORIAL.md
```
