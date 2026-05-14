# AI Resume Builder

## 当前阶段

阶段四增强：支持 JD 图片 OCR 解析。

## 已完成

- 首页 `/`
- 工作台 `/dashboard`
- 新建简历 `/resumes/new`
- 简历编辑器 `/resumes/[resumeId]/edit`
- 简历预览 `/resumes/[resumeId]/preview`
- 版本管理 `/resumes/[resumeId]/versions`
- JD 输入与解析 `/resumes/[resumeId]/jd`
- AI 匹配分析占位增强 `/resumes/[resumeId]/ai-review`
- API 健康检查 `/api/health`
- 结构化 `ResumeData` 和 `JobDescriptionData` 类型
- 本地 `localStorage` 草稿保存
- 手动创建空白简历
- 上传 JSON / TXT / MD 简历并解析为草稿
- PDF / Word 简历上传后创建待补全草稿
- 三套简历模板：经典单栏、紧凑单栏、强调侧栏
- 模板主题设置：主题色、内容密度、字号
- 预览页支持浏览器打印 / 另存为 PDF
- JD 文本粘贴、示例填充、TXT / MD / JSON 文件读取
- JD 图片 OCR：支持 PNG / JPG / JPEG / WEBP / BMP
- JD 解析岗位、公司、地点、薪资、职责、要求、加分项、关键词和置信度
- JD 解析结果按简历 ID 保存到本地
- AI 匹配分析页读取已保存 JD 并展示初步指标

## 本地运行

当前机器需要 Node.js 18.18+。

```bash
cd "D:\桌面\code\创新\profile web"
npm.cmd install
npm.cmd run dev
```

默认访问：

```text
http://loocalhost:3000
```

## JD 图片解析验收

1. 打开 `http://localhost:3000/resumes/demo-base/jd`。
2. 点击“上传 JD 文件 / 截图”。
3. 选择一张包含 JD 文本的 `.png`、`.jpg`、`.jpeg`、`.webp` 或 `.bmp` 图片。
4. 页面应显示“图片 OCR 识别中”和进度条。
5. OCR 完成后，左侧文本框应出现识别出的文字。
6. 右侧应基于识别文字展示岗位概览、职责、要求、加分项和关键词。
7. 页面下方应显示最近上传的 JD 截图预览。
8. 点击“保存”，刷新页面后识别结果仍然保留。
9. 点击“进入 AI 匹配分析”，`/ai-review` 页面应能读取保存后的 JD。

## 阶段四文本验收

1. 点击“使用示例”，左侧文本框应填入一份 JD，并自动解析。
2. 修改左侧文本后点击“解析 JD”，右侧结果应更新。
3. 上传 `.txt`、`.md` 或 `.json` 文件，应读取文本并解析。
4. 上传 PDF 或 Word 文件，会生成待解析记录，提示后续接入服务端解析。

## 后续阶段

阶段五建议实现 AI 匹配分析和建议确认：基于简历 JSON 与 JD JSON 计算缺口，生成可接受 / 拒绝的简历优化建议。
