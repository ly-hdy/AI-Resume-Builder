"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, FileSearch, FileText, Plus } from "lucide-react";

import { RESUME_STORAGE_KEY, createEmptyResume, demoResume, normalizeResume } from "@/lib/resume-data";
import { resumeTemplateCatalog } from "@/lib/resume-templates";
import type { ResumeData } from "@/types/resume";

export default function DashboardPage() {
  const router = useRouter();
  const [resumes, setResumes] = useState<ResumeData[]>([normalizeResume(demoResume)]);

  useEffect(() => {
    const raw = window.localStorage.getItem(RESUME_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify([demoResume]));
      return;
    }

    try {
      setResumes((JSON.parse(raw) as ResumeData[]).map(normalizeResume));
    } catch {
      setResumes([normalizeResume(demoResume)]);
    }
  }, []);

  const primaryResumeId = resumes[0]?.id ?? demoResume.id;

  function createResumeFromTemplate(templateId: ResumeData["templateId"]) {
    const template = resumeTemplateCatalog.find((item) => item.id === templateId);
    const nextResume = normalizeResume({
      ...createEmptyResume("manual"),
      templateId,
      name: template ? `${template.name}简历` : "新建简历",
      updatedAt: new Date().toISOString()
    });
    const next = [nextResume, ...resumes.filter((item) => item.id !== nextResume.id)];
    window.localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(next));
    setResumes(next);
    router.push(`/resumes/${nextResume.id}/edit`);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">工作台</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            从这里进入你的简历和岗位管理。
          </p>
        </div>
        <Link
          href="/resumes/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          新建简历
        </Link>
      </div>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <ActionCard
          icon={<FileText className="h-5 w-5 text-primary" aria-hidden="true" />}
          title="我的简历"
          description="管理所有简历草稿，继续编辑内容，或删除不需要的简历。"
          href="/resumes"
          cta="进入我的简历"
        />
        <ActionCard
          icon={<BriefcaseBusiness className="h-5 w-5 text-primary" aria-hidden="true" />}
          title="我的岗位"
          description="管理岗位 JD，解析职责、要求、关键词，并进入匹配分析。"
          href="/jds"
          cta="进入我的岗位"
          secondaryHref={`/resumes/${primaryResumeId}/jd`}
          secondaryCta="新建 JD 解析"
        />
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">选择模板开始编辑</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              从工作台直接选择一个模板，会自动创建新简历并进入编辑器。
            </p>
          </div>
          <Link
            href="/resumes/new"
            className="inline-flex h-9 items-center justify-center rounded-md border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            其他创建方式
          </Link>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {resumeTemplateCatalog.slice(0, 8).map((template) => (
            <article key={template.id} className="overflow-hidden rounded-lg border bg-card">
              <TemplatePreviewCard templateId={template.id} />
              <div className="p-4">
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
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function TemplatePreviewCard({ templateId }: { templateId: ResumeData["templateId"] }) {
  const visual = getTemplateVisual(templateId);

  return (
    <div className="border-b bg-muted p-3">
      <div className="mx-auto h-36 max-w-48 overflow-hidden rounded-md border bg-white shadow-sm">
        <div className="h-7" style={{ background: visual.header }} />
        <div className="space-y-2 p-3">
          <div className="h-2 w-20 rounded-full" style={{ backgroundColor: visual.accent }} />
          <div className="h-1.5 w-full rounded-full bg-slate-200" />
          <div className="h-1.5 w-10/12 rounded-full bg-slate-200" />
          <div className="grid grid-cols-[1fr_34%] gap-2 pt-2">
            <div className="space-y-1.5">
              <div className="h-1.5 w-full rounded-full bg-slate-200" />
              <div className="h-1.5 w-11/12 rounded-full bg-slate-200" />
              <div className="h-1.5 w-8/12 rounded-full bg-slate-200" />
            </div>
            <div className="space-y-1 rounded-sm p-1.5" style={{ backgroundColor: visual.soft }}>
              <div className="h-1.5 w-full rounded-full bg-white" />
              <div className="h-1.5 w-4/5 rounded-full bg-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTemplateVisual(templateId: ResumeData["templateId"]) {
  const visuals: Record<ResumeData["templateId"], { header: string; accent: string; soft: string }> = {
    classic: { header: "linear-gradient(135deg, #334155, #0f172a)", accent: "#334155", soft: "#f1f5f9" },
    compact: { header: "linear-gradient(135deg, #1f2937, #111827)", accent: "#1f2937", soft: "#f3f4f6" },
    accent: { header: "linear-gradient(135deg, #0f766e, #115e59)", accent: "#0f766e", soft: "#ccfbf1" },
    ats: { header: "linear-gradient(135deg, #475569, #1e293b)", accent: "#475569", soft: "#f8fafc" },
    modern: { header: "linear-gradient(135deg, #2563eb, #0891b2)", accent: "#2563eb", soft: "#dbeafe" },
    executive: { header: "linear-gradient(135deg, #7c2d12, #334155)", accent: "#7c2d12", soft: "#ffedd5" },
    timeline: { header: "linear-gradient(135deg, #4338ca, #0f766e)", accent: "#4338ca", soft: "#e0e7ff" },
    roseBanner: { header: "linear-gradient(135deg, #be123c, #fb7185)", accent: "#be123c", soft: "#ffe4e6" },
    blueCurve: { header: "linear-gradient(135deg, #2563eb, #60a5fa)", accent: "#2563eb", soft: "#dbeafe" },
    coralPro: { header: "linear-gradient(135deg, #be123c, #f97316)", accent: "#be123c", soft: "#ffe4e6" },
    tealCards: { header: "linear-gradient(135deg, #0f766e, #14b8a6)", accent: "#0f766e", soft: "#ccfbf1" },
    formalScholar: { header: "linear-gradient(135deg, #111827, #334155)", accent: "#111827", soft: "#f8fafc" },
    internRosePro: { header: "linear-gradient(135deg, #be123c, #fb7185)", accent: "#be123c", soft: "#ffe4e6" },
    graduateBluePro: { header: "linear-gradient(135deg, #2563eb, #60a5fa)", accent: "#2563eb", soft: "#dbeafe" },
    socialTealPro: { header: "linear-gradient(135deg, #0f766e, #14b8a6)", accent: "#0f766e", soft: "#ccfbf1" }
  };

  return visuals[templateId];
}

function ActionCard({
  icon,
  title,
  description,
  href,
  cta,
  secondaryHref,
  secondaryCta
}: {
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
  cta: string;
  secondaryHref?: string;
  secondaryCta?: string;
}) {
  return (
    <article className="rounded-lg border bg-card p-5">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">{description}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href={href}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {title === "我的岗位" ? <FileSearch className="h-4 w-4" aria-hidden="true" /> : null}
          {cta}
        </Link>
        {secondaryHref && secondaryCta ? (
          <Link
            href={secondaryHref}
            className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            {secondaryCta}
          </Link>
        ) : null}
      </div>
    </article>
  );
}
