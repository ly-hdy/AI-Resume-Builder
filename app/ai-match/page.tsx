"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, BriefcaseBusiness, FileText, Sparkles } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { readStoredJds, saveStoredJd } from "@/lib/jd-data";
import { RESUME_STORAGE_KEY, demoResume, normalizeResume } from "@/lib/resume-data";
import type { JobDescriptionData } from "@/types/jd";
import type { ResumeData } from "@/types/resume";

export default function AiMatchPage() {
  const router = useRouter();
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [jds, setJds] = useState<JobDescriptionData[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [selectedJdId, setSelectedJdId] = useState("");

  useEffect(() => {
    const storedResumes = readStoredResumes();
    const storedJds = readStoredJds();
    setResumes(storedResumes);
    setJds(storedJds);
    setSelectedResumeId(storedResumes[0]?.id ?? "");
    setSelectedJdId(storedJds[0]?.id ?? "");
  }, []);

  const selectedResume = useMemo(
    () => resumes.find((resume) => resume.id === selectedResumeId),
    [resumes, selectedResumeId]
  );
  const selectedJd = useMemo(
    () => jds.find((jd) => jd.id === selectedJdId),
    [jds, selectedJdId]
  );
  const hasResumes = resumes.length > 0;
  const hasJds = jds.length > 0;
  const canAnalyze = Boolean(selectedResume && selectedJd);

  function startAnalysis() {
    if (!selectedResume || !selectedJd) return;

    if (selectedJd.resumeId !== selectedResume.id) {
      saveStoredJd({
        ...selectedJd,
        id: `jd-match-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        resumeId: selectedResume.id
      });
    }

    router.push(`/resumes/${selectedResume.id}/ai-review`);
  }

  return (
    <PageShell
      title="AI 匹配分析"
      description="选择一份简历和一个岗位 JD，生成匹配度、关键词覆盖、优势差距和优化建议。"
      actions={
        <Button onClick={startAnalysis} disabled={!canAnalyze}>
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          生成匹配分析
        </Button>
      }
    >
      {!hasResumes || !hasJds ? (
        <section className="mt-6 grid gap-4 md:grid-cols-2">
          {!hasResumes ? (
            <EmptyRequirement
              icon={<FileText className="h-5 w-5 text-primary" aria-hidden="true" />}
              title="暂无简历"
              description="请先新建通用简历，或使用 AI 智能简历生成创建一份简历初稿。"
              href="/resumes/new"
              cta="新建通用简历"
            />
          ) : null}
          {!hasJds ? (
            <EmptyRequirement
              icon={<BriefcaseBusiness className="h-5 w-5 text-primary" aria-hidden="true" />}
              title="暂无岗位 JD"
              description="请先粘贴或上传目标岗位信息，系统会提取职责、要求和关键词。"
              href={`/resumes/${selectedResumeId || demoResume.id}/jd`}
              cta="新建岗位 JD"
            />
          ) : null}
        </section>
      ) : (
        <section className="mt-6 rounded-lg border bg-card p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm">
              <span className="mb-2 flex items-center gap-2 font-medium">
                <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
                选择简历
              </span>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                value={selectedResumeId}
                onChange={(event) => setSelectedResumeId(event.target.value)}
              >
                {resumes.map((resume) => (
                  <option key={resume.id} value={resume.id}>
                    {resume.name || resume.basics.name || "未命名简历"}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-2 flex items-center gap-2 font-medium">
                <BriefcaseBusiness className="h-4 w-4 text-primary" aria-hidden="true" />
                选择岗位 JD
              </span>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                value={selectedJdId}
                onChange={(event) => setSelectedJdId(event.target.value)}
              >
                {jds.map((jd) => (
                  <option key={jd.id} value={jd.id}>
                    {jd.jobTitle || jd.company || "未命名岗位"}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5 rounded-md border bg-background p-4 text-sm leading-6 text-muted-foreground">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <p>
                匹配分析会进入现有 AI 分析页。若岗位 JD 原本绑定在另一份简历上，系统会为当前简历复制一份岗位记录，避免影响原数据。
              </p>
            </div>
          </div>
        </section>
      )}
    </PageShell>
  );
}

function EmptyRequirement({
  icon,
  title,
  description,
  href,
  cta
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <article className="rounded-lg border bg-card p-5">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
      <Button asChild className="mt-4">
        <Link href={href}>{cta}</Link>
      </Button>
    </article>
  );
}

function readStoredResumes() {
  const raw = window.localStorage.getItem(RESUME_STORAGE_KEY);
  if (!raw) {
    window.localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify([demoResume]));
    return [normalizeResume(demoResume)];
  }

  try {
    const stored = (JSON.parse(raw) as ResumeData[]).map(normalizeResume);
    return stored.length ? stored : [normalizeResume(demoResume)];
  } catch {
    return [normalizeResume(demoResume)];
  }
}
