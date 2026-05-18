"use client";

import { ChangeEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardEdit, FileJson, FileText, FileUp, LayoutTemplate } from "lucide-react";

import { Button } from "@/components/ui/button";
import { extractResumeTextFromFile } from "@/lib/resume-file-parser";
import {
  RESUME_STORAGE_KEY,
  createEmptyResume,
  demoResume,
  normalizeResume,
  parseResumeText
} from "@/lib/resume-data";
import { resumeTemplateCatalog } from "@/lib/resume-templates";
import type { ResumeData } from "@/types/resume";

export default function NewResumePage() {
  const router = useRouter();
  const [status, setStatus] = useState("请选择一种创建方式。");

  function readResumes(): ResumeData[] {
    const raw = window.localStorage.getItem(RESUME_STORAGE_KEY);
    if (!raw) return [demoResume];

    try {
      return (JSON.parse(raw) as ResumeData[]).map(normalizeResume);
    } catch {
      return [demoResume];
    }
  }

  function saveAndOpen(resume: ResumeData) {
    const resumes = readResumes();
    const nextResume = normalizeResume({
      ...resume,
      updatedAt: new Date().toISOString()
    });
    const next = [nextResume, ...resumes.filter((item) => item.id !== nextResume.id)];
    window.localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(next));
    router.push(`/resumes/${nextResume.id}/edit`);
  }

  function handleManualCreate() {
    saveAndOpen(createEmptyResume("manual"));
  }

  function createResumeFromTemplate(templateId: ResumeData["templateId"]) {
    const template = resumeTemplateCatalog.find((item) => item.id === templateId);
    saveAndOpen({
      ...createEmptyResume("manual"),
      templateId,
      name: template ? `${template.name}简历` : "新建基础简历"
    });
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();
    setStatus(`正在读取 ${file.name}...`);

    try {
      const text = await extractResumeTextFromFile(file);
      const shouldUseAiParser = extension !== "json";
      if (!shouldUseAiParser) {
        saveAndOpen(parseResumeText(text, file.name));
        return;
      }

      setStatus("正在使用 AI 结构化解析简历...");
      const resume = await parseResumeWithAi(text, file.name);
      saveAndOpen(resume);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "文件解析失败，请换一个文件重试。");
    }
    event.target.value = "";
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold">新建基础简历</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          基础简历更像一份完整经历库。创建后可以继续手动编辑，再围绕不同 JD 生成岗位定制版本。
        </p>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <article className="rounded-lg border bg-card p-6">
          <FileUp className="h-6 w-6 text-primary" aria-hidden="true" />
          <h2 className="mt-5 text-lg font-semibold">上传并解析简历</h2>
          <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">
            支持 JSON、TXT、MD、PDF、DOCX 解析为结构化草稿。生成后建议再人工检查和补充。
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
              <FileText className="h-4 w-4" aria-hidden="true" />
              选择文件
              <input
                className="sr-only"
                type="file"
                accept=".json,.txt,.md,.pdf,.doc,.docx"
                onChange={handleFileChange}
              />
            </label>
            <Button variant="outline" type="button" onClick={() => saveAndOpen(demoResume)}>
              <FileJson className="h-4 w-4" aria-hidden="true" />
              使用示例
            </Button>
          </div>
        </article>

        <article className="rounded-lg border bg-card p-6">
          <ClipboardEdit className="h-6 w-6 text-primary" aria-hidden="true" />
          <h2 className="mt-5 text-lg font-semibold">手动填写基础简历</h2>
          <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">
            从空白结构化表单开始，逐项填写基础信息、教育、经历、项目和技能。
          </p>
          <div className="mt-6">
            <Button onClick={handleManualCreate}>开始填写</Button>
          </div>
        </article>
      </section>

      <section className="mt-8">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="text-xl font-semibold">从模板开始</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          模板只是起点。先选一个适合的版式，再进入编辑器补充内容和调整排版。
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {resumeTemplateCatalog.slice(0, 8).map((template) => (
            <article key={template.id} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold leading-5">{template.name}</h3>
                {template.isHighFidelity ? (
                  <span className="rounded-md border px-2 py-1 text-xs text-muted-foreground">高保真</span>
                ) : null}
              </div>
              <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-muted-foreground">
                {template.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                {template.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded-sm bg-muted px-1.5 py-1 text-xs text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
              <button
                className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                onClick={() => createResumeFromTemplate(template.id)}
              >
                使用此模板
              </button>
            </article>
          ))}
        </div>
      </section>

      <p className="mt-4 text-sm text-muted-foreground">{status}</p>
    </div>
  );
}

async function parseResumeWithAi(text: string, fileName: string) {
  const response = await fetch("/api/ai/parse-resume", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text, fileName })
  });
  const result = (await response.json()) as {
    resume?: ResumeData;
    error?: string;
  };

  if (!response.ok || !result.resume) {
    return parseResumeText(text, fileName);
  }

  return result.resume;
}
