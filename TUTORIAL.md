# 从 0 到上线：做一个 AI 简历网站的小白教程

这是一份面向新手的完整教程，记录如何从一个想法开始，做出一个可以在线访问的 AI 简历网站，并部署到 Vercel。你不需要一开始就懂很多工程概念，只要跟着步骤走，就能把一个本地项目变成别人也能打开的网站。

本教程对应项目：

```text
https://github.com/ly-hdy/AI-Resume-Builder
```

## 你最终会得到什么

完成后，你会拥有：

- 一个可以在线访问的简历网站
- 一个 GitHub 代码仓库
- 一个 Vercel 部署地址
- 一套本地可继续开发的项目文件
- 一个可以配置 AI Key 的线上环境

网站能力包括：

- 新建和编辑中文简历
- 上传简历文件生成草稿
- 多模板 A4 预览
- 调整字体、字号、行距、颜色、页边距、照片位置等
- 导出 PDF
- 粘贴或上传 JD
- 使用 DeepSeek API 做 JD 解析、简历匹配分析和内容润色

## 第 1 步：准备工具

你需要安装这些东西：

1. Node.js
2. Git
3. GitHub 账号
4. Vercel 账号
5. DeepSeek API Key

### 安装 Node.js

打开：

```text
https://nodejs.org/
```

下载安装 LTS 版本。安装完成后，打开 Windows PowerShell，输入：

```powershell
node -v
npm -v
```

如果能看到版本号，说明安装成功。

### 安装 Git

打开：

```text
https://git-scm.com/download/win
```

安装过程中大部分选项保持默认即可。遇到 `Choosing HTTPS transport backend` 时，普通 Windows 用户可以选择：

```text
Use the native Windows Secure Channel library
```

安装完成后，重新打开 PowerShell，输入：

```powershell
git --version
```

如果命令识别不到，也可以使用完整路径：

```powershell
D:\Git\cmd\git.exe --version
```

实际路径以你电脑安装位置为准。

### 注册 GitHub

打开：

```text
https://github.com/
```

注册或登录账号。GitHub 用来存放项目代码。

### 注册 Vercel

打开：

```text
https://vercel.com/
```

建议直接用 GitHub 账号登录。Vercel 用来把代码部署成可访问的网站。

### 获取 DeepSeek API Key

打开 DeepSeek 平台，创建 API Key。这个 Key 后面会配置到本地 `.env.local` 和 Vercel 环境变量里。

注意：API Key 不要发给别人，也不要提交到 GitHub。

## 第 2 步：创建项目

这个项目使用的是 Next.js。新建项目时可以用：

```powershell
npx create-next-app@latest ai-resume-builder
```

推荐选项：

```text
TypeScript: Yes
ESLint: Yes
Tailwind CSS: Yes
App Router: Yes
src directory: No
import alias: Yes
```

进入项目：

```powershell
cd ai-resume-builder
```

启动开发服务：

```powershell
npm run dev
```

浏览器打开：

```text
http://localhost:3000
```

看到页面后，说明项目跑起来了。

## 第 3 步：逐步做出网站

不要一上来就想把所有功能写完。可以按阶段做。

### 阶段 1：基础页面

先做这些页面：

```text
/
/dashboard
/resumes
/resumes/new
```

目标是让用户能进入网站、看到工作台、创建简历。

### 阶段 2：简历数据结构

定义简历数据类型，比如：

```text
ResumeData
ResumeEntry
ResumeTheme
```

简历通常包括：

- 基本信息
- 教育经历
- 工作经历
- 实习经历
- 项目经历
- 校园经历
- 技能
- 获奖
- 证书
- 自定义经历

### 阶段 3：本地保存

新手一开始不一定要接数据库，可以先使用浏览器本地存储：

```text
localStorage
```

优点：

- 简单
- 不需要数据库
- 很适合单人简历编辑器

缺点：

- 不同浏览器之间不同步
- 换设备后数据不会自动带过去

### 阶段 4：简历编辑器

实现一个左侧编辑、右侧预览的界面。

常见功能：

- 编辑基本信息
- 添加/删除经历
- 调整模块顺序
- 自定义模块名称
- 实时保存
- 实时预览

### 阶段 5：简历模板

先做一个最简单的 A4 模板，再逐步增加模板。

模板可以包括：

- 经典单栏
- 紧凑单栏
- 侧栏模板
- 正式学术模板
- 实习生模板
- 应届生模板
- 社招模板

新手建议先把一个模板打磨好，再复制扩展。

### 阶段 6：排版工具条

为了让简历刚好放进一页，需要增加排版控制。

常用设置包括：

- 字体
- 姓名字号
- 联系方式字号
- 模块标题字号
- 正文字号
- 行距
- 页边距
- 证件照大小
- 证件照位置
- 正文整体上移/下移
- 标题粗细
- 正文字色
- 标题色

这些设置可以保存到 `resume.theme` 里。

### 阶段 7：预览和导出 PDF

浏览器自带打印功能就能导出 PDF。

可以做一个预览页：

```text
/resumes/[resumeId]/preview
```

然后放一个按钮：

```text
导出 PDF
```

点击后调用：

```ts
window.print()
```

用户在浏览器打印面板里选择“另存为 PDF”即可。

### 阶段 8：JD 解析

增加 JD 页面：

```text
/resumes/[resumeId]/jd
```

支持：

- 粘贴 JD 文本
- 上传 TXT / MD / JSON 文件
- 上传 JD 截图
- OCR 识别截图文字
- 保存 JD 解析结果

OCR 可以用：

```text
tesseract.js
```

### 阶段 9：AI 功能

用 DeepSeek API 做这些事情：

- 解析简历
- 解析 JD
- 匹配分析
- 经历润色

在 Next.js 里可以放到 API Routes：

```text
app/api/ai/parse-resume/route.ts
app/api/ai/parse-jd/route.ts
app/api/ai/match/route.ts
app/api/ai/optimize-entry/route.ts
```

前端不要直接暴露 API Key。Key 应该只放在服务端环境变量中。

## 第 4 步：配置本地环境变量

项目根目录新建：

```text
.env.local
```

写入：

```text
DEEPSEEK_API_KEY=你的 DeepSeek API Key
DEEPSEEK_MODEL=deepseek-v4-flash
```

同时准备一个 `.env.example`，只放变量名，不放真实 Key：

```text
DEEPSEEK_API_KEY=
DEEPSEEK_MODEL=deepseek-v4-flash
DATABASE_URL=
```

`.gitignore` 里一定要写：

```text
.env.local
node_modules
.next
.next-dev
*.log
```

这样密钥和构建产物不会被提交到 GitHub。

## 第 5 步：本地检查

提交前建议运行：

```powershell
npm run lint
npm run build
```

如果 build 成功，说明项目基本可以部署。

如果出现 `<img>` 警告，通常不是阻塞错误，只是 Next.js 建议使用 `next/image`。

## 第 6 步：上传到 GitHub

先在 GitHub 创建一个空仓库，比如：

```text
AI-Resume-Builder
```

然后在本地项目目录运行：

```powershell
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/AI-Resume-Builder.git
git push -u origin main
```

如果 `git` 命令识别不到，可以使用完整路径：

```powershell
D:\Git\cmd\git.exe push -u origin main
```

如果命令行 push 网络不稳定，可以用 GitHub Desktop：

1. 打开 GitHub Desktop
2. `File -> Add local repository`
3. 选择项目文件夹
4. 点击 `Push origin`

## 第 7 步：部署到 Vercel

打开：

```text
https://vercel.com/
```

操作步骤：

1. 用 GitHub 登录 Vercel。
2. 点击 `Add New...`。
3. 选择 `Project`。
4. 导入 GitHub 仓库。
5. Framework Preset 选择 `Next.js`。
6. Install Command 保持 `npm install`。
7. Build Command 保持 `npm run build`。
8. 点击 Deploy。

部署成功后，Vercel 会给你一个网址：

```text
https://xxx.vercel.app
```

别人就可以通过这个网址访问你的网站。

## 第 8 步：配置 Vercel 环境变量

如果 AI 功能需要 DeepSeek API Key，就必须在 Vercel 配环境变量。

进入 Vercel 项目：

```text
Project Settings
```

找到环境变量入口，添加：

```text
DEEPSEEK_API_KEY=你的 DeepSeek API Key
DEEPSEEK_MODEL=deepseek-v4-flash
```

保存后一定要重新部署：

```text
Deployments -> Redeploy
```

否则旧部署不会读取新变量。

## 第 9 步：测试线上网站

部署后建议测试：

1. 打开首页。
2. 新建简历。
3. 编辑基本信息和经历。
4. 调整排版。
5. 打开预览页。
6. 导出 PDF。
7. 上传或粘贴 JD。
8. 测试 AI 匹配分析。

如果 AI 功能提示 API Key 未配置，说明 Vercel 环境变量没有生效，需要检查变量名和重新部署。

## 常见问题

### 1. 为什么线上没有我本地保存的简历？

因为简历草稿存在浏览器 `localStorage`。本地和线上是不同域名，数据不会自动同步。

### 2. 为什么 GitHub Pages 不适合这个项目？

GitHub Pages 只能托管静态页面。本项目使用了 Next.js API Routes，AI 接口需要服务端运行，所以推荐 Vercel。

### 3. 为什么 push 到 GitHub 失败？

常见原因：

- 网络连不上 GitHub
- 代理没有作用到 Git
- GitHub 登录凭据异常

解决方式：

- 开启代理的 TUN 模式
- 使用 GitHub Desktop
- 换网络后重新 push

### 4. 为什么 Vercel 部署后 AI 功能不能用？

通常是环境变量没配好。检查：

```text
DEEPSEEK_API_KEY
DEEPSEEK_MODEL
```

配完后记得 Redeploy。

### 5. 为什么 README 在 PowerShell 里显示乱码？

这是 PowerShell 控制台编码问题，不代表文件坏了。GitHub 上一般会按 UTF-8 正常显示。

## 给小白的建议

- 不要一开始就做所有功能，先做能跑起来的最小版本。
- 每完成一个阶段就提交一次 Git。
- API Key 永远不要发给别人，也不要上传到 GitHub。
- 本地能 `npm run build` 成功，再去部署。
- 出问题时先看报错最后几行，通常最有用。

## 一句话总结

这个项目的完整路径是：

```text
想法 -> Next.js 本地开发 -> localStorage 保存 -> AI API -> GitHub 托管代码 -> Vercel 部署上线
```

做完这条链路，你就不仅有一个网站，也真正走通了一次从 0 到上线的完整产品开发流程。
