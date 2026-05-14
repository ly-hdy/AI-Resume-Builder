"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Eye, FileText, Pencil, Trash2 } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RESUME_STORAGE_KEY, demoResume, normalizeResume } from "@/lib/resume-data";
import type { ResumeData } from "@/types/resume";

export default function ResumeVersionsPage({
  params
}: {
  params: { resumeId: string };
}) {
  const router = useRouter();
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [activeId, setActiveId] = useState(params.resumeId);

  useEffect(() => {
    setActiveId(params.resumeId);
    setResumes(readResumes(params.resumeId));
  }, [params.resumeId]);

  const activeResume = useMemo(
    () => resumes.find((resume) => resume.id === activeId) ?? resumes[0] ?? normalizeResume(demoResume),
    [activeId, resumes]
  );
  const rootId = getRootId(activeResume);
  const versions = useMemo(
    () =>
      resumes
        .filter((resume) => resume.id === rootId || resume.baseResumeId === rootId || resume.id === activeId)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [activeId, resumes, rootId]
  );

  function persist(next: ResumeData[], nextActiveId = activeId) {
    window.localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(next));
    setResumes(next);
    setActiveId(nextActiveId);
  }

  function createVersion() {
    const now = new Date().toISOString();
    const copy: ResumeData = normalizeResume({
      ...activeResume,
      id: `resume-${Date.now().toString(36)}`,
      baseResumeId: rootId,
      name: `${activeResume.name || activeResume.basics.name || "未命名简历"} 副本`,
      source: "manual",
      updatedAt: now
    });
    const next = [copy, ...resumes.filter((resume) => resume.id !== copy.id)];
    persist(next, copy.id);
  }

  function renameVersion(resume: ResumeData) {
    const nextName = window.prompt("请输入新的版本名称", resume.name || resume.basics.name || "未命名简历");
    if (!nextName?.trim()) return;

    const next = resumes.map((item) =>
      item.id === resume.id
        ? normalizeResume({
            ...item,
            name: nextName.trim(),
            updatedAt: new Date().toISOString()
          })
        : item
    );
    persist(next);
  }

  function deleteVersion(resume: ResumeData) {
    if (versions.length <= 1) {
      window.alert("至少保留一个版本。");
      return;
    }

    const confirmed = window.confirm(`确定删除「${resume.name || "未命名简历"}」吗？此操作不会影响其他版本。`);
    if (!confirmed) return;

    const next = resumes.filter((item) => item.id !== resume.id);
    const nextActive = resume.id === activeId ? versions.find((item) => item.id !== resume.id)?.id : activeId;
    persist(next, nextActive);

    if (resume.id === params.resumeId && nextActive) {
      router.replace(`/resumes/${nextActive}/versions`);
    }
  }

  return (
    <PageShell
      title="版本管理"
      description="复制当前简历为新版本，或打开、重命名、删除同一组岗位定制版本。"
      actions={
        <>
          <Button asChild variant="outline">
            <Link href={`/resumes/${activeResume.id}/edit`}>
              <FileText className="h-4 w-4" aria-hidden="true" />
              返回编辑
            </Link>
          </Button>
          <Button onClick={createVersion}>
            <Copy className="h-4 w-4" aria-hidden="true" />
            复制当前版本
          </Button>
        </>
      }
    >
      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <Metric label="版本数量" value={versions.length.toString()} />
        <Metric label="当前版本" value={activeResume.name || activeResume.basics.name || "未命名"} compact />
        <Metric label="最近更新" value={formatDate(activeResume.updatedAt)} />
      </section>

      <section className="mt-6 overflow-hidden rounded-lg border bg-card">
        {versions.map((resume) => {
          const isActive = resume.id === activeResume.id;

          return (
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
                    <Link href={`/resumes/${resume.id}/edit`} className="font-medium hover:text-primary">
                      {resume.name || resume.basics.name || "未命名简历"}
                    </Link>
                    {isActive ? <Badge>当前</Badge> : null}
                    <Badge>{resume.source === "upload" ? "上传草稿" : "本地版本"}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {resume.basics.title || "尚未填写目标职位"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    更新：{formatDate(resume.updatedAt)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/resumes/${resume.id}/edit`}>打开</Link>
                </Button>
                <Button asChild variant="outline" size="icon" aria-label="预览">
                  <Link href={`/resumes/${resume.id}/preview`}>
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button variant="outline" size="icon" aria-label="重命名" onClick={() => renameVersion(resume)}>
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button variant="outline" size="icon" aria-label="删除" onClick={() => deleteVersion(resume)}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          );
        })}
      </section>
    </PageShell>
  );
}

function readResumes(resumeId: string) {
  const raw = window.localStorage.getItem(RESUME_STORAGE_KEY);

  try {
    const stored = raw ? (JSON.parse(raw) as ResumeData[]).map(normalizeResume) : [];
    if (stored.length) return stored;
  } catch {
    return [normalizeResume(demoResume)];
  }

  return [normalizeResume({ ...demoResume, id: resumeId })];
}

function getRootId(resume: ResumeData) {
  return resume.baseResumeId || resume.id;
}

function Metric({ label, value, compact }: { label: string; value: string; compact?: boolean }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={compact ? "mt-2 text-lg font-semibold" : "mt-2 text-3xl font-semibold"}>{value}</div>
    </div>
  );
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
