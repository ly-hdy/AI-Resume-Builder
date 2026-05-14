"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, Check, FileText, Sparkles, X } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createEmptyJd, normalizeJd, readStoredJds } from "@/lib/jd-data";
import { RESUME_STORAGE_KEY, demoResume, normalizeResume } from "@/lib/resume-data";
import type { AiMatchAnalysis, AiSuggestion } from "@/types/ai";
import type { JobDescriptionData } from "@/types/jd";
import type { ResumeData } from "@/types/resume";

export default function AiReviewPage({
  params
}: {
  params: { resumeId: string };
}) {
  const [resume, setResume] = useState<ResumeData>(() => normalizeResume(demoResume));
  const [resumes, setResumes] = useState<ResumeData[]>(() => [normalizeResume(demoResume)]);
  const [jd, setJd] = useState<JobDescriptionData>(() => createEmptyJd(params.resumeId));
  const [analysis, setAnalysis] = useState<AiMatchAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    const storedJd = readStoredJds()
      .map((item) => normalizeJd(item, params.resumeId))
      .find((item) => item.resumeId === params.resumeId);

    if (storedJd) setJd(storedJd);

    const rawResumes = window.localStorage.getItem(RESUME_STORAGE_KEY);
    if (!rawResumes) return;

    try {
      const storedResumes = (JSON.parse(rawResumes) as ResumeData[]).map(normalizeResume);
      const nextResumes = storedResumes.length ? storedResumes : [normalizeResume(demoResume)];
      const selectedResume = nextResumes.find((item) => item.id === params.resumeId) ?? nextResumes[0];
      setResumes(nextResumes);
      setResume(selectedResume);
    } catch {
      const fallback = normalizeResume(demoResume);
      setResumes([fallback]);
      setResume(fallback);
    }
  }, [params.resumeId]);

  const hasJd = Boolean(jd.rawText.trim());
  const fallbackKeywordCoverage = useMemo(() => Math.min(jd.keywords.length, 18), [jd.keywords.length]);
  const fallbackMatchScore = hasJd ? Math.min(92, 52 + jd.parsedConfidence / 2) : 0;

  function selectResume(resumeId: string) {
    const nextResume = resumes.find((item) => item.id === resumeId);
    if (!nextResume) return;

    setResume(nextResume);
    setAnalysis(null);
    setSavedMessage("");
    setError("");
  }

  async function generateAnalysis() {
    if (!hasJd || loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/ai/match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ resume, jd })
      });

      const result = (await response.json()) as {
        analysis?: AiMatchAnalysis;
        error?: string;
      };

      if (!response.ok || !result.analysis) {
        throw new Error(result.error || "AI 分析生成失败。");
      }

      setAnalysis(result.analysis);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "AI 分析生成失败。");
    } finally {
      setLoading(false);
    }
  }

  function updateSuggestionStatus(id: string, status: AiSuggestion["status"]) {
    if (!analysis) return;

    setAnalysis({
      ...analysis,
      suggestions: analysis.suggestions.map((suggestion) =>
        suggestion.id === id ? { ...suggestion, status } : suggestion
      )
    });
  }

  function acceptSuggestion(suggestion: AiSuggestion) {
    if (!analysis) return;

    const nextResume = applySuggestionToResume(resume, suggestion);

    if (!nextResume) {
      setError(`暂时无法自动应用到 ${suggestion.targetPath}，请手动复制建议内容。`);
      return;
    }

    saveResume(nextResume);
    setResume(nextResume);
    setResumes((current) => current.map((item) => (item.id === nextResume.id ? nextResume : item)));
    setError("");
    setSavedMessage("建议已写入简历，可前往编辑页或预览页查看。");
    updateSuggestionStatus(suggestion.id, "accepted");
  }

  return (
    <PageShell
      title="AI 匹配分析"
      description="选择一份简历，与当前 JD 生成岗位匹配度、差距分析与可确认的优化建议。"
      actions={
        <>
          <Button asChild variant="outline">
            <Link href={`/resumes/${params.resumeId}/jd`}>
              <FileText className="h-4 w-4" aria-hidden="true" />
              编辑 JD
            </Link>
          </Button>
          <Button disabled={!hasJd || loading} onClick={generateAnalysis}>
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {loading ? "生成中" : "生成建议"}
          </Button>
        </>
      }
    >
      {error ? (
        <div className="mt-6 flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      {savedMessage ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-md border bg-card p-4 text-sm">
          <span>{savedMessage}</span>
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`/resumes/${resume.id}/edit`}>查看编辑页</Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/resumes/${resume.id}/preview`}>查看预览</Link>
            </Button>
          </div>
        </div>
      ) : null}

      <section className="mt-6 rounded-lg border bg-card p-5">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(220px,320px)] md:items-end">
          <div>
            <h2 className="text-base font-semibold">匹配对象</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              当前将使用「{resume.name || resume.basics.name || "未命名简历"}」与这份 JD 进行分析。
            </p>
          </div>
          <label className="text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">选择简历</span>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              value={resume.id}
              onChange={(event) => selectResume(event.target.value)}
              disabled={loading}
            >
              {resumes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name || item.basics.name || item.id}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {loading ? (
        <section className="mt-6 rounded-lg border bg-card p-5">
          <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
            <span>DeepSeek 正在分析简历与 JD 的匹配关系，并生成优化建议</span>
            <span>生成中</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-primary" />
          </div>
        </section>
      ) : null}

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <Metric
          label="总体匹配度"
          value={analysis ? `${analysis.matchScore}%` : hasJd ? `${Math.round(fallbackMatchScore)}%` : "--"}
        />
        <Metric
          label="关键词覆盖"
          value={
            analysis
              ? `${analysis.keywordCoverage.matched.length}/${analysis.keywordCoverage.matched.length + analysis.keywordCoverage.missing.length}`
              : hasJd
                ? `${fallbackKeywordCoverage}/${jd.keywords.length || 0}`
                : "--"
          }
        />
        <Metric label="JD 解析置信度" value={hasJd ? `${jd.parsedConfidence}%` : "--"} />
      </section>

      <section className="mt-6 rounded-lg border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">{jd.jobTitle || "尚未保存 JD"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {[jd.company, jd.location, jd.salary].filter(Boolean).join(" | ") ||
                "从 JD 页面保存解析结果后显示岗位概览。"}
            </p>
          </div>
          <Badge>{hasJd ? "已解析" : "待输入"}</Badge>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {(analysis?.keywordCoverage.matched.length ? analysis.keywordCoverage.matched : jd.keywords.slice(0, 16)).map(
            (keyword) => (
              <Badge key={keyword}>{keyword}</Badge>
            )
          )}
        </div>
      </section>

      {analysis ? (
        <section className="mt-6 rounded-lg border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold">分析摘要</h2>
            <Badge>{analysis.model}</Badge>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{analysis.summary}</p>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <InsightList title="优势" items={analysis.strengths} />
            <InsightList title="差距" items={analysis.gaps} />
          </div>
          {analysis.keywordCoverage.missing.length ? (
            <div className="mt-5">
              <div className="text-sm font-medium">待补足关键词</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {analysis.keywordCoverage.missing.map((keyword) => (
                  <Badge key={keyword}>{keyword}</Badge>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="mt-6 space-y-4">
        {(analysis?.suggestions ?? fallbackSuggestions(hasJd, jd)).map((suggestion) => (
          <article key={suggestion.id} className="rounded-lg border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-medium">{suggestion.reason}</div>
                <div className="mt-1 text-xs text-muted-foreground">{suggestion.targetPath}</div>
              </div>
              <Badge>{statusLabel(suggestion.status)}</Badge>
            </div>
            {suggestion.originalText ? (
              <div className="mt-4 rounded-md bg-muted p-3 text-sm text-muted-foreground">
                原文：{suggestion.originalText}
              </div>
            ) : null}
            {suggestion.suggestedText ? (
              <div className="mt-3 rounded-md border p-3 text-sm leading-6">{suggestion.suggestedText}</div>
            ) : null}
            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                disabled={!analysis || suggestion.status === "accepted"}
                onClick={() => acceptSuggestion(suggestion)}
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                接受
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!analysis || suggestion.status === "rejected"}
                onClick={() => updateSuggestionStatus(suggestion.id, "rejected")}
              >
                <X className="h-4 w-4" aria-hidden="true" />
                拒绝
              </Button>
            </div>
          </article>
        ))}
      </section>
    </PageShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
    </div>
  );
}

function InsightList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-medium">{title}</h3>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-muted-foreground">
        {items.length ? items.map((item) => <li key={item}>{item}</li>) : <li>暂无</li>}
      </ul>
    </div>
  );
}

function fallbackSuggestions(hasJd: boolean, jd: JobDescriptionData): AiSuggestion[] {
  if (!hasJd) {
    return [
      {
        id: "fallback-empty",
        type: "structure",
        targetPath: "jobDescription",
        originalText: "",
        suggestedText: "请先输入并保存 JD，再生成简历匹配建议。",
        reason: "等待岗位信息",
        status: "pending"
      }
    ];
  }

  return [
    {
      id: "fallback-keywords",
      type: "keyword",
      targetPath: "skills",
      originalText: "",
      suggestedText: jd.keywords.slice(0, 5).join("、") || "补充与岗位要求直接相关的关键词。",
      reason: `围绕「${jd.jobTitle || "目标岗位"}」补充更直接的岗位关键词。`,
      status: "pending"
    }
  ];
}

function statusLabel(status: AiSuggestion["status"]) {
  return {
    pending: "待确认",
    accepted: "已接受",
    rejected: "已拒绝",
    edited: "已编辑"
  }[status];
}

function saveResume(resume: ResumeData) {
  const normalized = normalizeResume({
    ...resume,
    updatedAt: new Date().toISOString()
  });
  const raw = window.localStorage.getItem(RESUME_STORAGE_KEY);

  try {
    const stored = raw ? (JSON.parse(raw) as ResumeData[]).map(normalizeResume) : [];
    const next = [normalized, ...stored.filter((item) => item.id !== normalized.id)];
    window.localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(next));
  } catch {
    window.localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify([normalized]));
  }
}

function applySuggestionToResume(resume: ResumeData, suggestion: AiSuggestion): ResumeData | null {
  const text = suggestion.suggestedText.trim();
  if (!text) return null;

  const path = normalizeTargetPath(suggestion.targetPath);

  if (path === "skills") {
    return {
      ...resume,
      skills: mergeList(resume.skills, splitSuggestionText(text))
    };
  }

  if (path === "awards" || path === "certificates") {
    return {
      ...resume,
      [path]: mergeList(resume[path], splitSuggestionText(text))
    };
  }

  if (path.startsWith("basics.")) {
    const key = path.split(".")[1] as keyof ResumeData["basics"];
    if (!key || !(key in resume.basics)) return null;

    return {
      ...resume,
      basics: {
        ...resume.basics,
        [key]: text
      }
    };
  }

  const entryMatch = path.match(/^(workExperience|internships|projects|campusExperience|education|otherExperience)\.(\d+)\.(title|organization|location|startDate|endDate|description)(?:\.(\d+))?$/);
  if (!entryMatch) return null;

  const [, section, entryIndexValue, field, descriptionIndexValue] = entryMatch;
  const sectionKey = section as keyof Pick<
    ResumeData,
    "workExperience" | "internships" | "projects" | "campusExperience" | "education" | "otherExperience"
  >;
  const entryIndex = Number(entryIndexValue);
  const entries = resume[sectionKey];
  const entry = entries[entryIndex];

  if (!entry) return null;

  const nextEntries = entries.map((item, index) => {
    if (index !== entryIndex) return item;

    if (field === "description") {
      const descriptionIndex = descriptionIndexValue ? Number(descriptionIndexValue) : -1;
      const nextDescription = [...item.description];

      if (descriptionIndex >= 0 && descriptionIndex < nextDescription.length) {
        nextDescription[descriptionIndex] = text;
      } else {
        nextDescription.push(text);
      }

      return {
        ...item,
        description: nextDescription
      };
    }

    return {
      ...item,
      [field]: text
    };
  });

  return {
    ...resume,
    [sectionKey]: nextEntries
  };
}

function normalizeTargetPath(path: string) {
  return path.trim().replace(/\[(\d+)\]/g, ".$1");
}

function splitSuggestionText(text: string) {
  return text
    .split(/[、,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function mergeList(current: string[], next: string[]) {
  return Array.from(new Set([...current, ...next]));
}
