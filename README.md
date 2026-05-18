# AI Resume Builder

AI Resume Builder 是一个面向中文求职场景的 AI 简历工具。它支持通用简历创建、AI 智能简历生成、岗位 JD 解析、简历与岗位匹配分析，以及 A4 简历预览和 PDF 导出。

当前产品心智：

```text
创建/生成简历 -> 保存岗位 JD -> AI 匹配分析 -> 编辑确认 -> 预览导出
```

## 核心功能

### 工作台

工作台分为三个部分：

- 我的简历：新建通用简历、AI 智能简历生成、查看我的简历。
- 我的岗位：新建岗位 JD、查看已保存岗位 JD。
- AI 匹配分析：选择一份简历和一个岗位 JD，生成匹配分析和优化建议。

### 简历创建

- 手动创建简历。
- 上传 JSON / TXT / MD / PDF / Word 文件解析为草稿。
- 从模板开始创建简历。
- 使用示例简历。

### AI 智能简历生成

- 以对话式分步流程收集信息。
- 支持学生 / 职场人身份。
- 目标岗位可选，不填写也可以生成通用简历。
- 支持教育背景、工作经历、实习经历、项目经历、校园经历、其他经历、技能、证书、奖项。
- 每个经历模块都支持“AI 帮写”。
- 右侧固定展示模板预览，填写过程中实时更新。
- 可直接保存，也可保存后进入编辑器继续精修。

### 我的简历

- 展示所有已保存简历。
- 支持编辑、重命名、删除。
- 不再区分通用简历和定制简历，列表更像用户自己的简历文件夹。

### 岗位 JD

- 支持粘贴岗位描述。
- 支持上传 TXT / MD / JSON 文件。
- 支持上传 JD 截图并进行 OCR。
- AI 提取岗位名称、公司、地点、薪资、岗位职责、任职要求、加分项、关键词和岗位解读。

### AI 匹配分析

- 用户选择一份简历和一个岗位 JD。
- 生成整体匹配度、关键词覆盖、优势、差距和优化建议。
- 用户可以接受或拒绝 AI 建议。
- 接受建议后写入简历字段，用户仍保留最终编辑权。

### 预览与导出

- A4 简历预览。
- 多模板展示。
- 字体、字号、行距、页边距、颜色、照片等排版设置。
- 通过浏览器打印另存为 PDF。

## 页面入口

| 页面 | 路由 | 说明 |
| --- | --- | --- |
| 首页 | `/` | 产品介绍和入口 |
| 工作台 | `/dashboard` | 我的简历、我的岗位、AI 匹配分析 |
| 新建简历 | `/resumes/new` | 手动、上传、模板、示例 |
| AI 智能生成 | `/resumes/ai-generate` | 对话式生成简历草稿 |
| 我的简历 | `/resumes` | 所有已保存简历 |
| 简历编辑器 | `/resumes/[resumeId]/edit` | 结构化编辑和实时预览 |
| 简历预览 | `/resumes/[resumeId]/preview` | A4 预览和 PDF 导出 |
| 我的岗位 | `/jds` | 已保存 JD 列表 |
| JD 解析 | `/resumes/[resumeId]/jd` | 粘贴/上传 JD，OCR 与 AI 解析 |
| AI 匹配分析 | `/ai-match` | 选择简历和岗位后进入匹配 |
| AI 分析结果 | `/resumes/[resumeId]/ai-review` | 匹配度、差距和优化建议 |

## 技术栈

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- lucide-react
- Tesseract.js
- Mammoth
- PDF.js
- DeepSeek API

## 本地运行

环境要求：

- Node.js 18.18 或更高版本
- npm

安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

访问：

```text
http://localhost:3000
```

如果 3000 端口被占用：

```bash
npm run dev -- -p 3001
```

## 环境变量

复制 `.env.example` 为 `.env.local`：

```bash
copy .env.example .env.local
```

配置：

```text
DEEPSEEK_API_KEY=你的 DeepSeek API Key
DEEPSEEK_MODEL=deepseek-v4-flash
DATABASE_URL=
```

说明：

- `DEEPSEEK_API_KEY`：用于简历解析、JD 解析、匹配分析和内容润色。
- `DEEPSEEK_MODEL`：可选，默认使用 `deepseek-v4-flash`。
- `DATABASE_URL`：当前版本暂未实际使用。

不要提交 `.env.local`。

## 常用命令

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## 数据存储

当前版本主要使用浏览器 `localStorage`：

- 简历草稿保存在本地浏览器。
- JD 解析结果保存在本地浏览器。
- 上传文件不会被永久保存到云端。

限制：

- 不同浏览器、不同设备之间不会自动同步。
- 清除浏览器数据后，本地草稿会丢失。

## 部署

推荐部署到 Vercel。

流程：

1. 将代码推送到 GitHub。
2. 在 Vercel 中导入 GitHub 仓库。
3. Framework Preset 选择 `Next.js`。
4. 配置环境变量：

```text
DEEPSEEK_API_KEY
DEEPSEEK_MODEL
```

5. 部署完成后，Vercel 会生成线上地址。

## 验收建议

上线后建议检查：

1. 打开 `/dashboard`，确认工作台三块入口正常。
2. 打开 `/resumes/new`，测试手动创建和上传解析。
3. 打开 `/resumes/ai-generate`，测试对话式 AI 生成和模板预览。
4. 打开 `/resumes`，测试编辑、重命名、删除。
5. 打开 `/jds` 和 `/resumes/[resumeId]/jd`，测试 JD 解析。
6. 打开 `/ai-match`，选择简历和岗位进行匹配分析。
7. 打开预览页，使用浏览器导出 PDF。
