# 从 0 到上线：AI 简历网站开发与部署教程

这份教程记录如何把一个 AI 简历网站从本地项目做成可以在线访问的作品。它适合新手理解完整链路：准备工具、运行项目、配置 AI Key、测试核心功能、推送 GitHub、部署到 Vercel。

项目仓库：

```text
https://github.com/ly-hdy/AI-Resume-Builder
```

## 1. 最终你会得到什么

完成后，你会拥有：

- 一个可以在线访问的 AI 简历网站。
- 一个 GitHub 代码仓库。
- 一个 Vercel 部署地址。
- 一套本地可继续开发的 Next.js 项目。
- 一份产品需求文档 `PRD.md`。

网站主要能力：

- 创建通用简历。
- AI 对话式生成简历草稿。
- 管理所有已保存简历。
- 粘贴或上传 JD 并解析岗位信息。
- 选择简历和岗位进行 AI 匹配分析。
- 编辑、预览并导出 PDF 简历。

## 2. 准备工具

你需要：

1. Node.js
2. Git
3. GitHub 账号
4. GitHub Desktop
5. Vercel 账号
6. DeepSeek API Key

### 安装 Node.js

打开：

```text
https://nodejs.org/
```

下载并安装 LTS 版本。安装后打开 PowerShell：

```powershell
node -v
npm -v
```

能看到版本号就说明安装成功。

### 安装 Git

打开：

```text
https://git-scm.com/download/win
```

安装时大部分选项保持默认即可。

检查：

```powershell
git --version
```

### 注册 GitHub 和 Vercel

GitHub 用于保存代码：

```text
https://github.com/
```

Vercel 用于部署网站：

```text
https://vercel.com/
```

建议使用 GitHub 账号登录 Vercel，后续导入仓库更方便。

## 3. 本地运行项目

进入项目目录：

```powershell
cd "D:\桌面\code\创新\profile web"
```

安装依赖：

```powershell
npm install
```

启动开发服务器：

```powershell
npm run dev
```

浏览器打开：

```text
http://localhost:3000
```

如果 3000 端口被占用：

```powershell
npm run dev -- -p 3001
```

然后打开：

```text
http://localhost:3001
```

## 4. 配置 AI 环境变量

项目根目录创建 `.env.local`：

```text
DEEPSEEK_API_KEY=你的 DeepSeek API Key
DEEPSEEK_MODEL=deepseek-v4-flash
DATABASE_URL=
```

注意：

- `.env.local` 不要上传到 GitHub。
- API Key 只应该放在服务端环境变量里。
- 如果线上 AI 功能不可用，通常是 Vercel 环境变量没有配置或配置后没有重新部署。

## 5. 理解当前产品结构

当前网站最重要的入口是工作台：

```text
/dashboard
```

工作台分成三部分：

```text
我的简历
- 新建通用简历
- AI 智能简历生成
- 我的简历

我的岗位
- 新建岗位 JD
- 我的岗位 JD

AI 匹配分析
- 选择简历和岗位进行匹配
```

推荐体验路径：

```text
工作台 -> AI 智能简历生成 -> 保存简历 -> 新建岗位 JD -> AI 匹配分析 -> 编辑简历 -> 导出 PDF
```

## 6. 核心功能测试

### 测试 1：新建通用简历

打开：

```text
http://localhost:3000/resumes/new
```

测试：

- 手动填写简历。
- 上传文件解析生成草稿。
- 使用示例。
- 从模板开始。

### 测试 2：AI 智能简历生成

打开：

```text
http://localhost:3000/resumes/ai-generate
```

测试：

- 选择学生或职场人。
- 选择模板，观察右侧预览变化。
- 填写姓名和目标岗位。目标岗位可以跳过。
- 分步填写教育、实习、项目、校园、工作、其他经历。
- 每个经历模块使用“AI 帮写”。
- 直接保存或保存并进入编辑器。

### 测试 3：我的简历

打开：

```text
http://localhost:3000/resumes
```

测试：

- 查看所有保存的简历。
- 编辑简历。
- 重命名简历。
- 删除简历。

### 测试 4：岗位 JD 解析

打开：

```text
http://localhost:3000/jds
```

如果还没有岗位，点击“新建 JD”。

测试：

- 粘贴 JD 文本。
- 上传 TXT / MD / JSON 文件。
- 上传 JD 截图做 OCR。
- 查看岗位名称、公司、地点、薪资、职责、要求、关键词。

### 测试 5：AI 匹配分析

打开：

```text
http://localhost:3000/ai-match
```

测试：

- 选择一份简历。
- 选择一个岗位 JD。
- 生成匹配分析。
- 查看匹配度、关键词覆盖、优势、差距和优化建议。
- 接受或拒绝建议。

### 测试 6：预览和导出

在编辑器中点击预览，或打开：

```text
/resumes/[resumeId]/preview
```

点击导出 PDF，浏览器会打开打印面板，选择“另存为 PDF”。

## 7. 提交到 GitHub

推荐使用 GitHub Desktop。

操作步骤：

1. 打开 GitHub Desktop。
2. 选择当前项目仓库。
3. 左侧查看 changed files。
4. 在 Summary 填写提交标题，例如：

```text
Refine resume workflow and docs
```

5. 点击 `Commit to main`。
6. 点击 `Push origin`。

Push 后，GitHub 仓库会更新。

## 8. 部署到 Vercel

第一次部署：

1. 打开 Vercel。
2. 点击 `Add New...`。
3. 选择 `Project`。
4. 导入 GitHub 仓库。
5. Framework Preset 选择 `Next.js`。
6. Build Command 保持：

```text
npm run build
```

7. 添加环境变量：

```text
DEEPSEEK_API_KEY
DEEPSEEK_MODEL
```

8. 点击 Deploy。

后续更新：

```text
本地修改 -> GitHub Desktop commit -> Push origin -> Vercel 自动重新部署
```

## 9. 上线后检查

Vercel 部署完成后，打开线上地址，检查：

1. `/dashboard` 是否显示三块工作台。
2. `/resumes/ai-generate` 是否能分步生成简历。
3. `/resumes` 是否能编辑、重命名、删除简历。
4. `/jds` 是否能新建和查看岗位 JD。
5. `/ai-match` 是否能选择简历和岗位。
6. AI 功能是否能正常返回结果。
7. PDF 导出是否可用。

## 10. 常见问题

### 线上没有本地保存的简历？

简历保存在浏览器 `localStorage`。本地和线上域名不同，数据不会自动同步。

### AI 功能提示 API Key 未配置？

检查 Vercel 环境变量：

```text
DEEPSEEK_API_KEY
DEEPSEEK_MODEL
```

保存后需要重新部署。

### GitHub Pages 可以部署吗？

不推荐。项目使用 Next.js API Routes，需要服务端运行环境，推荐 Vercel。

### PowerShell 里中文显示乱码？

通常是终端编码问题，不代表文件损坏。编辑器和 GitHub 上一般会正常显示 UTF-8 中文。

## 11. 一句话总结

这个项目走通了完整链路：

```text
想法 -> 产品结构 -> Next.js 开发 -> AI 能力接入 -> GitHub 托管 -> Vercel 上线
```

它不只是一个简历页面，而是一个从简历创建、岗位理解、AI 匹配到 PDF 投递的完整求职工具原型。
