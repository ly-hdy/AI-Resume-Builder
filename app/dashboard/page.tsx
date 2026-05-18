"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  FileSearch,
  Library,
  PenLine,
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold">工作台</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          先创建或生成简历，再保存目标岗位，最后用 AI 做匹配分析和优化建议。
        </p>
      </div>

      <DashboardSection
        title="我的简历"
        description="支持传统方式创建，也可以让 AI 根据你的信息生成一份简历初稿。"
      >
        <DashboardCard
          icon={<Plus className="h-5 w-5 text-primary" aria-hidden="true" />}
          title="新建通用简历"
          description="通过手动填写、上传解析或选择模板，创建一份可直接使用的完整简历。"
          href="/resumes/new"
          cta="开始创建"
        />
        <DashboardCard
          icon={<Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />}
          title="AI 智能简历生成"
          description="填写身份、目标岗位和经历素材，AI 帮你生成简历初稿，并可辅助改写经历。"
          href="/resumes/ai-generate"
          cta="AI 帮我写"
        />
        <DashboardCard
          icon={<Library className="h-5 w-5 text-primary" aria-hidden="true" />}
          title="我的简历"
          description={`集中查看所有已保存简历，包括通用简历、AI 生成简历和定制版本。当前 ${resumes.length} 份。`}
          href="/resumes"
          cta="查看简历"
        />
      </DashboardSection>

      <DashboardSection
        title="我的岗位"
        description="保存目标岗位 JD，作为后续匹配分析和简历优化的输入。"
      >
        <DashboardCard
          icon={<FileSearch className="h-5 w-5 text-primary" aria-hidden="true" />}
          title="新建岗位 JD"
          description="粘贴招聘信息，或上传文件/截图，系统会提取职位、公司、职责、要求和关键词。"
          href={`/resumes/${resumes[0]?.id ?? demoResume.id}/jd`}
          cta="解析岗位"
        />
        <DashboardCard
          icon={<BriefcaseBusiness className="h-5 w-5 text-primary" aria-hidden="true" />}
          title="我的岗位 JD"
          description={`查看已保存的岗位信息，并进入编辑或匹配分析。当前 ${jds.length} 个岗位。`}
          href="/jds"
          cta="查看岗位"
        />
      </DashboardSection>

      <DashboardSection
        title="AI 匹配分析"
        description="当你已经有简历和岗位后，可以直接选择一份简历和一个岗位进行匹配。"
      >
        <DashboardCard
          icon={<PenLine className="h-5 w-5 text-primary" aria-hidden="true" />}
          title="开始匹配分析"
          description="选择简历和岗位 JD，生成匹配度、关键词覆盖、优势差距和可确认的优化建议。"
          href="/ai-match"
          cta="选择并分析"
        />
      </DashboardSection>
    </div>
  );
}

function DashboardSection({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-8">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  );
}

function DashboardCard({
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
        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
      >
        {cta}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
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
