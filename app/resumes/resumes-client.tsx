"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { ClipboardEdit, FileText, FileUp, Pencil, Plus, Trash2 } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RESUME_STORAGE_KEY, demoResume, normalizeResume } from "@/lib/resume-data";
import type { ResumeData } from "@/types/resume";

export type ResumeFilter = "all" | "manual" | "upload";

const filterLabels: Record<ResumeFilter, string> = {
  all: "全部简历",
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
      description="管理本地保存的简历草稿。每份简历可以继续编辑，也可以从列表中删除。"
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
              新建简历
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

      <section className="mt-5 overflow-hidden rounded-lg border bg-card">
        {visibleResumes.length ? (
          visibleResumes.map((resume) => (
            <div
              key={resume.id}
              className="grid gap-3 border-b p-4 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-muted p-2">
                  <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/resumes/${resume.id}/edit`}
                      className="font-medium hover:text-primary"
                    >
                      {resume.name || resume.basics.name || "未命名简历"}
                    </Link>
                    <Badge>{sourceLabel(resume.source)}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {resume.basics.title || "尚未填写目标职位"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    更新：{formatDate(resume.updatedAt)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/resumes/${resume.id}/edit`}>
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    编辑
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={() => deleteResume(resume)}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  删除
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-sm text-muted-foreground">
            当前没有{filterLabels[filter]}。可以新建简历，或上传文件解析生成草稿。
          </div>
        )}
      </section>
    </PageShell>
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
