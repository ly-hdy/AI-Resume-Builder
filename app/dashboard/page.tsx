"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  Database,
  FileSearch,
  FileText,
  Layers3,
  Plus,
  Sparkles
} from "lucide-react";

import { readStoredJds } from "@/lib/jd-data";
import { RESUME_STORAGE_KEY, demoResume, normalizeResume } from "@/lib/resume-data";
import type { JobDescriptionData } from "@/types/jd";
import type { ResumeData } from "@/types/resume";

export default function DashboardPage() {
  const [resumes, setResumes] = useState<ResumeData[]>([normalizeResume(demoResume)]);
  const [jds, setJds] = useState<JobDescriptionData[]>([]);

  useEffect(() => {
    setResumes(readStoredResumes());
    setJds(readStoredJds());
  }, []);

  const baseResumes = useMemo(() => resumes.filter((resume) => !resume.baseResumeId), [resumes]);
  const targetedResumes = useMemo(() => resumes.filter((resume) => resume.baseResumeId), [resumes]);
  const recentBaseResume = baseResumes[0] ?? resumes[0] ?? normalizeResume(demoResume);
  const recentJd = jds[0];
  const recentTargetedResume = targetedResumes[0];
  const primaryResumeId = recentBaseResume.id ?? demoResume.id;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">工作台</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            维护一份基础简历，围绕不同岗位生成可投递的定制版本。
          </p>
        </div>
        <Link
          href="/resumes/new"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          新建基础简历
        </Link>
      </div>

      <section className="mt-8">
        <SectionTitle icon={<Clock3 className="h-5 w-5 text-primary" aria-hidden="true" />} title="最近使用" />
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <RecentCard
            title="最近编辑的简历"
            label={resumeDisplayName(recentBaseResume)}
            description={recentBaseResume.basics.title || "先把完整经历沉淀成基础简历"}
            href={`/resumes/${recentBaseResume.id}/edit`}
            cta="继续编辑"
          />
          <RecentCard
            title="最近解析的 JD"
            label={recentJd ? jdDisplayName(recentJd) : "还没有岗位 JD"}
            description={
              recentJd
                ? [recentJd.company, recentJd.location, recentJd.salary].filter(Boolean).join(" | ") || "已保存岗位信息"
                : "粘贴招聘信息后，系统会提取职责、要求和关键词"
            }
            href={recentJd ? `/resumes/${recentJd.resumeId}/jd` : `/resumes/${primaryResumeId}/jd`}
            cta={recentJd ? "查看 JD" : "新建 JD"}
          />
          <RecentCard
            title="最近生成的定制版本"
            label={recentTargetedResume ? resumeDisplayName(recentTargetedResume) : "还没有岗位版本"}
            description={
              recentTargetedResume
                ? recentTargetedResume.basics.title || "面向具体岗位的简历版本"
                : "基于基础简历和 JD 生成不同投递版本"
            }
            href={recentTargetedResume ? `/resumes/${recentTargetedResume.id}/edit` : `/resumes/${primaryResumeId}/ai-review`}
            cta={recentTargetedResume ? "编辑版本" : "去匹配分析"}
          />
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle icon={<Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />} title="快捷操作" />
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <ActionCard
            icon={<FileText className="h-5 w-5 text-primary" aria-hidden="true" />}
            title="新建基础简历"
            description="手动填写、上传解析或从模板开始，先建立完整经历库。"
            href="/resumes/new"
            cta="开始创建"
          />
          <ActionCard
            icon={<FileSearch className="h-5 w-5 text-primary" aria-hidden="true" />}
            title="新建 JD"
            description="粘贴岗位信息，自动提取职责、任职要求和关键词。"
            href={`/resumes/${primaryResumeId}/jd`}
            cta="解析岗位"
          />
          <ActionCard
            icon={<Layers3 className="h-5 w-5 text-primary" aria-hidden="true" />}
            title="生成岗位版本"
            description="把基础简历和目标 JD 放在一起，生成可确认的优化建议。"
            href={`/resumes/${primaryResumeId}/ai-review`}
            cta="进入匹配"
          />
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle icon={<Database className="h-5 w-5 text-primary" aria-hidden="true" />} title="我的资产" />
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <AssetCard
            title="基础简历"
            count={baseResumes.length}
            description="用于沉淀完整经历和通用信息。"
            href="/resumes"
          />
          <AssetCard
            title="我的岗位"
            count={jds.length}
            description="已解析和保存的 JD 信息。"
            href="/jds"
          />
          <AssetCard
            title="定制版本简历"
            count={targetedResumes.length}
            description="面向具体岗位的投递版本。"
            href="/resumes"
          />
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <h2 className="text-xl font-semibold">{title}</h2>
    </div>
  );
}

function RecentCard({
  title,
  label,
  description,
  href,
  cta
}: {
  title: string;
  label: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <article className="rounded-lg border bg-card p-5">
      <p className="text-sm text-muted-foreground">{title}</p>
      <h3 className="mt-3 text-base font-semibold">{label}</h3>
      <p className="mt-2 min-h-10 text-sm leading-6 text-muted-foreground">{description}</p>
      <Link
        href={href}
        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
      >
        {cta}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </article>
  );
}

function ActionCard({
  icon,
  title,
  description,
  href,
  cta
}: {
  icon: ReactNode;
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <article className="rounded-lg border bg-card p-5">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      <p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">{description}</p>
      <Link
        href={href}
        className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {cta}
      </Link>
    </article>
  );
}

function AssetCard({
  title,
  count,
  description,
  href
}: {
  title: string;
  count: number;
  description: string;
  href: string;
}) {
  return (
    <Link href={href} className="rounded-lg border bg-card p-5 transition-colors hover:bg-muted/40">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold">{title}</h3>
        <span className="text-2xl font-semibold">{count}</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </Link>
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

function resumeDisplayName(resume: ResumeData) {
  return resume.name || resume.basics.name || "未命名简历";
}

function jdDisplayName(jd: JobDescriptionData) {
  return jd.jobTitle || jd.company || "未命名岗位";
}
