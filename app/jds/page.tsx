"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BriefcaseBusiness, FileSearch, Sparkles } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { readStoredJds } from "@/lib/jd-data";
import { RESUME_STORAGE_KEY, demoResume, normalizeResume } from "@/lib/resume-data";
import type { JobDescriptionData } from "@/types/jd";
import type { ResumeData } from "@/types/resume";

export default function JobDescriptionsPage() {
  const [jds, setJds] = useState<JobDescriptionData[]>([]);
  const [resumes, setResumes] = useState<ResumeData[]>([]);

  useEffect(() => {
    setJds(readStoredJds());
    setResumes(readStoredResumes());
  }, []);

  const primaryResumeId = resumes[0]?.id ?? demoResume.id;
  const resumeNameById = useMemo(
    () =>
      new Map(
        resumes.map((resume) => [
          resume.id,
          resume.name || resume.basics.name || "未命名简历"
        ])
      ),
    [resumes]
  );

  return (
    <PageShell
      title="我的岗位"
      description="保存和管理目标岗位 JD。岗位信息会作为 AI 匹配和定制简历的输入。"
      actions={
        <Button asChild>
          <Link href={`/resumes/${primaryResumeId}/jd`}>
            <FileSearch className="h-4 w-4" aria-hidden="true" />
            新建 JD
          </Link>
        </Button>
      }
    >
      <section className="mt-6 overflow-hidden rounded-lg border bg-card">
        {jds.length ? (
          jds.map((jd) => (
            <div
              key={jd.id}
              className="grid gap-3 border-b p-4 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-muted p-2">
                  <BriefcaseBusiness className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/resumes/${jd.resumeId}/jd`} className="font-medium hover:text-primary">
                      {jd.jobTitle || "未命名岗位"}
                    </Link>
                    <Badge>{jd.parsedConfidence}% 置信度</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[jd.company, jd.location, jd.salary].filter(Boolean).join(" | ") ||
                      "尚未识别公司、地点或薪资"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    关联简历：{resumeNameById.get(jd.resumeId) ?? "已删除或不存在"} · 更新：
                    {formatDate(jd.updatedAt)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/resumes/${jd.resumeId}/jd`}>
                    <FileSearch className="h-4 w-4" aria-hidden="true" />
                    编辑 JD
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/resumes/${jd.resumeId}/ai-review`}>
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    匹配分析
                  </Link>
                </Button>
              </div>
            </div>
          ))
        ) : (
          <EmptyJdState resumeId={primaryResumeId} />
        )}
      </section>
    </PageShell>
  );
}

function EmptyJdState({ resumeId }: { resumeId: string }) {
  return (
    <div className="p-8">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-muted">
          <BriefcaseBusiness className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <h2 className="mt-5 text-lg font-semibold">还没有岗位 JD</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          你可以粘贴招聘信息，系统会自动提取岗位名称、公司、地点、薪资、岗位职责、任职要求和关键词。
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          解析后，可以将岗位与基础简历匹配，生成面向该岗位的定制简历建议。
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link href={`/resumes/${resumeId}/jd`}>
              <FileSearch className="h-4 w-4" aria-hidden="true" />
              粘贴或上传 JD
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/resumes">先选择基础简历</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function readStoredResumes() {
  const raw = window.localStorage.getItem(RESUME_STORAGE_KEY);
  if (!raw) {
    window.localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify([demoResume]));
    return [normalizeResume(demoResume)];
  }

  try {
    return (JSON.parse(raw) as ResumeData[]).map(normalizeResume);
  } catch {
    return [normalizeResume(demoResume)];
  }
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "未知";
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}
