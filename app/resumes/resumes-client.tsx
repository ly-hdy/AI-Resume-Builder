"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  ClipboardEdit,
  FileSearch,
  FileText,
  FileUp,
  Layers3,
  Pencil,
  Plus,
  Trash2
} from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RESUME_STORAGE_KEY, demoResume, normalizeResume } from "@/lib/resume-data";
import type { ResumeData } from "@/types/resume";

export type ResumeFilter = "all" | "manual" | "upload";

const filterLabels: Record<ResumeFilter, string> = {
  all: "我的简历",
  manual: "手动创建",
  upload: "上传解析"
};

export default function ResumesClient({ filter }: { filter: ResumeFilter }) {
  const [resumes, setResumes] = useState<ResumeData[]>([]);

  useEffect(() => {
    setResumes(readStoredResumes());
  }, []);

  const visibleResumes = useMemo(() => {
    if (filter === "all") return resumes;
    return resumes.filter((resume) => resume.source === filter);
  }, [filter, resumes]);

  const baseResumes = visibleResumes.filter((resume) => !resume.baseResumeId);
  const targetedResumes = visibleResumes.filter((resume) => resume.baseResumeId);

  function deleteResume(resume: ResumeData) {
    const displayName = resume.name || resume.basics.name || "未命名简历";
    const confirmed = window.confirm(`确定删除「${displayName}」吗？删除后无法从列表恢复。`);
    if (!confirmed) return;

    const next = resumes.filter((item) => item.id !== resume.id);
    window.localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(next));
    setResumes(next);
  }

  return (
    <PageShell
      title={filterLabels[filter]}
      description="基础简历用于沉淀完整经历；岗位定制版本用于围绕某个 JD 做筛选、改写和投递。"
      actions={
        <>
          <Button asChild variant="outline">
            <Link href="/resumes/new">
              <FileUp className="h-4 w-4" aria-hidden="true" />
              上传解析
            </Link>
          </Button>
          <Button asChild>
            <Link href="/resumes/new">
              <Plus className="h-4 w-4" aria-hidden="true" />
              新建基础简历
            </Link>
          </Button>
        </>
      }
    >
      <div className="mt-6 flex flex-wrap gap-2">
        <FilterLink active={filter === "all"} href="/resumes" icon={<FileText className="h-4 w-4" />}>
          全部简历
        </FilterLink>
        <FilterLink
          active={filter === "manual"}
          href="/resumes?source=manual"
          icon={<ClipboardEdit className="h-4 w-4" />}
        >
          手动创建
        </FilterLink>
        <FilterLink
          active={filter === "upload"}
          href="/resumes?source=upload"
          icon={<FileUp className="h-4 w-4" />}
        >
          上传解析
        </FilterLink>
      </div>

      <ResumeSection
        title="基础简历"
        description="像一份完整经历库，先把教育、项目、实习、工作和技能都整理进去。"
        emptyText={`当前没有${filterLabels[filter]}。可以新建基础简历，或上传文件解析生成草稿。`}
      >
        {baseResumes.map((resume) => (
          <ResumeRow key={resume.id} resume={resume} type="base" onDelete={deleteResume} />
        ))}
      </ResumeSection>

      <ResumeSection
        title="岗位定制版本"
        description="面向具体岗位，从基础简历中挑选、排序和优化内容，用于正式投递。"
        emptyText="还没有岗位定制版本。先选择一份基础简历和一个 JD，进入 AI 匹配分析后生成优化建议。"
      >
        {targetedResumes.map((resume) => (
          <ResumeRow key={resume.id} resume={resume} type="targeted" onDelete={deleteResume} />
        ))}
      </ResumeSection>
    </PageShell>
  );
}

function ResumeSection({
  title,
  description,
  emptyText,
  children
}: {
  title: string;
  description: string;
  emptyText: string;
  children: ReactNode[];
}) {
  const items = Array.isArray(children) ? children.filter(Boolean) : [];

  return (
    <section className="mt-6">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="mt-4 overflow-hidden rounded-lg border bg-card">
        {items.length ? items : <div className="p-6 text-sm leading-6 text-muted-foreground">{emptyText}</div>}
      </div>
    </section>
  );
}

function ResumeRow({
  resume,
  type,
  onDelete
}: {
  resume: ResumeData;
  type: "base" | "targeted";
  onDelete: (resume: ResumeData) => void;
}) {
  const isTargeted = type === "targeted";

  return (
    <div className="grid gap-3 border-b p-4 last:border-b-0 lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-muted p-2">
          {isTargeted ? (
            <BriefcaseBusiness className="h-5 w-5 text-primary" aria-hidden="true" />
          ) : (
            <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
          )}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/resumes/${resume.id}/edit`} className="font-medium hover:text-primary">
              {resume.name || resume.basics.name || "未命名简历"}
            </Link>
            <Badge>{isTargeted ? "岗位版本" : "基础简历"}</Badge>
            <Badge>{sourceLabel(resume.source)}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {resume.basics.title || (isTargeted ? "尚未填写目标岗位" : "尚未填写职业方向")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">更新：{formatDate(resume.updatedAt)}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {isTargeted ? (
          <>
            <Button asChild variant="outline" size="sm">
              <Link href={`/resumes/${resume.id}/edit`}>
                <Pencil className="h-4 w-4" aria-hidden="true" />
                编辑版本
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/resumes/${resume.id}/preview`}>
                <FileText className="h-4 w-4" aria-hidden="true" />
                预览导出
              </Link>
            </Button>
          </>
        ) : (
          <>
            <Button asChild variant="outline" size="sm">
              <Link href={`/resumes/${resume.id}/edit`}>
                <Pencil className="h-4 w-4" aria-hidden="true" />
                编辑基础简历
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/resumes/${resume.id}/jd`}>
                <FileSearch className="h-4 w-4" aria-hidden="true" />
                创建岗位版本
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/resumes/${resume.id}/versions`}>
                <Layers3 className="h-4 w-4" aria-hidden="true" />
                查看版本
              </Link>
            </Button>
          </>
        )}
        <Button variant="outline" size="sm" onClick={() => onDelete(resume)}>
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          删除
        </Button>
      </div>
    </div>
  );
}

function FilterLink({
  active,
  href,
  icon,
  children
}: {
  active: boolean;
  href: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={[
        "inline-flex h-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background hover:bg-muted"
      ].join(" ")}
    >
      {icon}
      {children}
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
    return (JSON.parse(raw) as ResumeData[]).map(normalizeResume);
  } catch {
    return [normalizeResume(demoResume)];
  }
}

function sourceLabel(source: ResumeData["source"]) {
  return {
    demo: "示例草稿",
    manual: "手动创建",
    upload: "上传解析"
  }[source];
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
