"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  ClipboardPaste,
  FileImage,
  Lightbulb,
  ListChecks,
  MapPin,
  Save,
  ScanText,
  Sparkles
} from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  cleanOcrTextForJd,
  createEmptyJd,
  normalizeJd,
  parseJobDescription,
  readStoredJds,
  saveStoredJd
} from "@/lib/jd-data";
import type { JobDescriptionData } from "@/types/jd";

const sampleJd = `岗位：AI 产品经理
公司：某科技公司
地点：上海
薪资：25K-40K

岗位职责：
1. 负责 AI 简历解析、JD 匹配和智能建议模块的产品规划。
2. 与算法、研发、设计协作，推动大模型能力在招聘场景落地。
3. 建立用户反馈和数据指标体系，持续优化转化率和建议采纳率。

任职要求：
1. 3 年以上互联网产品经验，有 AI / AIGC / SaaS 产品经验优先。
2. 熟悉用户研究、需求分析、原型设计和项目管理。
3. 具备良好的数据分析能力，能使用 SQL 分析核心漏斗。

加分项：
1. 了解 LLM、RAG、Prompt Engineering 或 Agent 产品形态。
2. 有招聘、人力资源或 B 端工具产品经验。`;

export default function JobDescriptionPage({
  params
}: {
  params: { resumeId: string };
}) {
  const [jd, setJd] = useState<JobDescriptionData>(() => createEmptyJd(params.resumeId));
  const [draftText, setDraftText] = useState("");
  const [status, setStatus] = useState("尚未解析");
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [isAiParsing, setIsAiParsing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");

  useEffect(() => {
    const stored = readStoredJds()
      .map((item) => normalizeJd(item, params.resumeId))
      .find((item) => item.resumeId === params.resumeId);

    if (stored) {
      setJd(stored);
      setDraftText(stored.rawText);
      setStatus("已载入上次解析结果");
    }
  }, [params.resumeId]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    };
  }, [imagePreviewUrl]);

  const hasParsedContent = useMemo(
    () =>
      Boolean(
        jd.jobTitle ||
          jd.company ||
          jd.responsibilities.length ||
          jd.requirements.length ||
          jd.keywords.length
      ),
    [jd]
  );

  async function parseAndSet(text = draftText, source: JobDescriptionData["source"] = "text") {
    setIsAiParsing(true);
    setStatus(text.trim() ? "正在使用 AI 解析 JD..." : "请输入 JD 文本");

    const parsed = await parseJdWithAi(text, params.resumeId, source);
    setJd({ ...parsed, source });
    setDraftText(text);
    setStatus(parsed.rawText.trim() ? "AI 解析完成，尚未保存" : "请输入 JD 文本");
    setIsAiParsing(false);
  }

  function saveJd() {
    const next = saveStoredJd({
      ...jd,
      rawText: draftText
    });
    setJd(next);
    setStatus("已保存到本地");
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();
    const isImage =
      file.type.startsWith("image/") ||
      ["png", "jpg", "jpeg", "webp", "bmp"].includes(extension ?? "");

    if (extension === "txt" || extension === "md" || extension === "json") {
      const text = await file.text();
      await parseAndSet(text, "file");
      setStatus(`${file.name} 已读取并通过 AI 解析`);
      return;
    }

    if (isImage) {
      await recognizeImage(file);
      return;
    }

    const placeholder = `来自文件：${file.name}
文件类型：${file.type || extension || "未知"}
文件大小：${Math.max(1, Math.round(file.size / 1024))} KB

当前阶段支持 TXT / MD / JSON 文本解析，以及 PNG / JPG / WEBP / BMP 图片 OCR。PDF 和 Word 解析会在后续接入服务端能力。`;
    await parseAndSet(placeholder, "file");
    setStatus(`${file.name} 已创建待解析记录`);
  }

  async function recognizeImage(file: File) {
    setIsOcrRunning(true);
    setOcrProgress(0);
    setStatus(`正在识别图片：${file.name}`);

    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImagePreviewUrl(URL.createObjectURL(file));

    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("chi_sim+eng", 1, {
        logger: (message) => {
          if (message.status === "recognizing text") {
            setOcrProgress(Math.round(message.progress * 100));
          }
        }
      });

      const result = await worker.recognize(file);
      await worker.terminate();

      const rawText = result.data.text.trim();
      const cleanedText = cleanOcrTextForJd(rawText);
      const nextText = cleanedText
        ? cleanedText
        : `来自图片：${file.name}\n未识别到清晰文字，请换一张更清晰的 JD 截图或手动粘贴文本。`;

      await parseAndSet(nextText, "image");
      setStatus(cleanedText ? `${file.name} OCR 完成，已交给 AI 解析` : `${file.name} OCR 未识别到文字`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "未知错误";
      const fallback = `来自图片：${file.name}
OCR 识别失败：${message}

请检查网络或换一张更清晰的图片；也可以手动粘贴 JD 文本。`;
      await parseAndSet(fallback, "image");
      setStatus("图片 OCR 失败");
    } finally {
      setIsOcrRunning(false);
    }
  }

  return (
    <PageShell
      title="JD 输入与解析"
      description="粘贴岗位描述，或上传 JD 截图识别文字，解析职责、要求、加分项和关键词。"
      actions={
        <>
          <Button
            variant="outline"
            onClick={() => {
              setDraftText(sampleJd);
              void parseAndSet(sampleJd);
            }}
            disabled={isAiParsing || isOcrRunning}
          >
            <ClipboardPaste className="h-4 w-4" aria-hidden="true" />
            使用示例
          </Button>
          <Button onClick={() => void parseAndSet()} disabled={isOcrRunning || isAiParsing}>
            <ScanText className="h-4 w-4" aria-hidden="true" />
            {isAiParsing ? "AI 解析中" : "解析 JD"}
          </Button>
          <Button variant="outline" onClick={saveJd} disabled={!hasParsedContent || isOcrRunning || isAiParsing}>
            <Save className="h-4 w-4" aria-hidden="true" />
            保存
          </Button>
        </>
      }
    >
      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-medium" htmlFor="jd-text">
              JD 文本
            </label>
            <span className="text-xs text-muted-foreground">{status}</span>
          </div>
          <textarea
            id="jd-text"
            className="mt-3 min-h-96 w-full resize-y rounded-md border bg-background p-3 text-sm leading-6 outline-none focus:ring-2 focus:ring-ring"
            placeholder="粘贴岗位职责、任职要求和加分项，或上传 JD 截图自动识别..."
            value={draftText}
            onChange={(event) => {
              setDraftText(event.target.value);
              setStatus("有未解析修改");
            }}
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted">
              <FileImage className="h-4 w-4" aria-hidden="true" />
              上传 JD 文件 / 截图
              <input
                className="sr-only"
                type="file"
                accept=".txt,.md,.json,.png,.jpg,.jpeg,.webp,.bmp,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                disabled={isOcrRunning || isAiParsing}
              />
            </label>
            <p className="text-xs text-muted-foreground">
              TXT / MD / JSON 可直接解析；PNG / JPG / WEBP / BMP 会先 OCR、清洗，再解析。
            </p>
          </div>

          {isOcrRunning ? (
            <div className="mt-4 rounded-md border bg-background p-3">
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>图片 OCR 识别中</span>
                <span>{ocrProgress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary" style={{ width: `${ocrProgress}%` }} />
              </div>
            </div>
          ) : null}

          {isAiParsing ? (
            <div className="mt-4 rounded-md border bg-background p-3">
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>DeepSeek 正在整理岗位信息、职责要求和关键词</span>
                <span>解析中</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-2/3 animate-pulse rounded-full bg-primary" />
              </div>
            </div>
          ) : null}

          {imagePreviewUrl ? (
            <div className="mt-4 rounded-md border bg-background p-3">
              <div className="mb-2 text-xs text-muted-foreground">最近上传的 JD 截图</div>
              <img
                src={imagePreviewUrl}
                alt="JD 截图预览"
                className="max-h-72 w-full rounded-md object-contain"
              />
            </div>
          ) : null}
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 font-medium">
              <BriefcaseBusiness className="h-4 w-4 text-primary" aria-hidden="true" />
              岗位概览
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <InfoRow label="岗位" value={jd.jobTitle || "未识别"} />
              <InfoRow label="公司" value={jd.company || "未识别"} />
              <InfoRow label="地点" value={jd.location || "未识别"} />
              <InfoRow label="薪资" value={jd.salary || "未识别"} />
            </div>
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>解析置信度</span>
                <span>{jd.parsedConfidence}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary" style={{ width: `${jd.parsedConfidence}%` }} />
              </div>
            </div>
          </section>

          <ParsedSection title="岗位职责" items={jd.responsibilities} />
          <ParsedSection title="任职要求" items={jd.requirements} />
          <ParsedSection title="加分项" items={jd.preferredQualifications} />
          <JobAnalysisPanel analysis={jd.analysis} />

          <section className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2 font-medium">
              <ListChecks className="h-4 w-4 text-primary" aria-hidden="true" />
              关键词
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {jd.keywords.length ? (
                jd.keywords.map((keyword) => <Badge key={keyword}>{keyword}</Badge>)
              ) : (
                <p className="text-sm text-muted-foreground">解析后会展示关键词。</p>
              )}
            </div>
          </section>

          <Button asChild className="w-full" disabled={!hasParsedContent || isOcrRunning || isAiParsing}>
            <Link href={`/resumes/${params.resumeId}/ai-review`}>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              进入 AI 匹配分析
            </Link>
          </Button>
        </aside>
      </div>
    </PageShell>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2">
      <span className="flex items-center gap-2 text-muted-foreground">
        {label === "地点" ? <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> : null}
        {label}
      </span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function ParsedSection({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-lg border bg-card p-4">
      <h2 className="font-medium">{title}</h2>
      {items.length ? (
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">暂未识别。</p>
      )}
    </section>
  );
}

function JobAnalysisPanel({ analysis }: { analysis: JobDescriptionData["analysis"] }) {
  const hasAnalysis = Boolean(
    analysis?.roleSummary ||
      analysis?.coreSkills.length ||
      analysis?.valuedAbilities.length ||
      analysis?.resumeFocus.length
  );

  if (!hasAnalysis) {
    return (
      <section className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-2 font-medium">
          <Lightbulb className="h-4 w-4 text-primary" aria-hidden="true" />
          岗位解读
        </div>
        <p className="mt-3 text-sm text-muted-foreground">解析后会展示这个岗位的工作内容、核心技能和简历润色方向。</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-2 font-medium">
        <Lightbulb className="h-4 w-4 text-primary" aria-hidden="true" />
        岗位解读
      </div>
      {analysis?.roleSummary ? (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{analysis.roleSummary}</p>
      ) : null}
      <AnalysisBlock title="核心技能" items={analysis?.coreSkills ?? []} />
      <AnalysisBlock title="看重能力" items={analysis?.valuedAbilities ?? []} />
      <AnalysisBlock title="简历润色方向" items={analysis?.resumeFocus ?? []} />
    </section>
  );
}

function AnalysisBlock({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;

  return (
    <div className="mt-4">
      <div className="text-xs font-medium text-muted-foreground">{title}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={item}>{item}</Badge>
        ))}
      </div>
    </div>
  );
}

async function parseJdWithAi(
  text: string,
  resumeId: string,
  source: JobDescriptionData["source"]
) {
  if (!text.trim()) return parseJobDescription(text, resumeId);

  try {
    const response = await fetch("/api/ai/parse-jd", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text, resumeId, source })
    });
    const result = (await response.json()) as {
      jd?: JobDescriptionData;
      error?: string;
    };

    if (!response.ok || !result.jd) {
      return parseJobDescription(text, resumeId);
    }

    return result.jd;
  } catch {
    return parseJobDescription(text, resumeId);
  }
}
