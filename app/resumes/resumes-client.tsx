"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Pencil, Plus, Trash2, Type } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { RESUME_STORAGE_KEY, demoResume, normalizeResume } from "@/lib/resume-data";
import type { ResumeData } from "@/types/resume";

export default function ResumesClient() {
  const [resumes, setResumes] = useState<ResumeData[]>([]);

  useEffect(() => {
    setResumes(readStoredResumes());
  }, []);

  function saveResumes(next: ResumeData[]) {
    window.localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(next));
    setResumes(next);
  }

  function renameResume(resume: ResumeData) {
    const currentName = resume.name || resume.basics.name || "未命名简历";
    const nextName = window.prompt("请输入新的简历名称", currentName);
    if (nextName === null) return;

    const trimmedName = nextName.trim();
    if (!trimmedName) return;

    saveResumes(
      resumes.map((item) =>
        item.id === resume.id
          ? normalizeResume({
              ...item,
              name: trimmedName,
              updatedAt: new Date().toISOString()
            })
          : item
      )
    );
  }

  function deleteResume(resume: ResumeData) {
    const displayName = resume.name || resume.basics.name || "未命名简历";
    const confirmed = window.confirm(`确定删除「${displayName}」吗？删除后无法从列表恢复。`);
    if (!confirmed) return;

    saveResumes(resumes.filter((item) => item.id !== resume.id));
  }

  return (
    <PageShell
      title="我的简历"
      description="这里展示所有保存过的简历。你可以继续编辑、重命名或删除不需要的草稿。"
      actions={
        <Button asChild>
          <Link href="/resumes/new">
            <Plus className="h-4 w-4" aria-hidden="true" />
            新建简历
          </Link>
        </Button>
      }
    >
      <section className="mt-6 overflow-hidden rounded-lg border bg-card">
        {resumes.length ? (
          resumes.map((resume) => (
            <ResumeRow
              key={resume.id}
              resume={resume}
              onRename={renameResume}
              onDelete={deleteResume}
            />
          ))
        ) : (
          <div className="p-6 text-sm leading-6 text-muted-foreground">
            当前还没有保存的简历。你可以新建简历、上传解析，或使用 AI 智能生成一份草稿。
          </div>
        )}
      </section>
    </PageShell>
  );
}

function ResumeRow({
  resume,
  onRename,
  onDelete
}: {
  resume: ResumeData;
  onRename: (resume: ResumeData) => void;
  onDelete: (resume: ResumeData) => void;
}) {
  return (
    <div className="grid gap-3 border-b p-4 last:border-b-0 lg:grid-cols-[1fr_auto] lg:items-center">
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-muted p-2">
          <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <div>
          <Link href={`/resumes/${resume.id}/edit`} className="font-medium hover:text-primary">
            {resume.name || resume.basics.name || "未命名简历"}
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">
            {resume.basics.title || "尚未填写职业方向"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">更新：{formatDate(resume.updatedAt)}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/resumes/${resume.id}/edit`}>
            <Pencil className="h-4 w-4" aria-hidden="true" />
            编辑
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={() => onRename(resume)}>
          <Type className="h-4 w-4" aria-hidden="true" />
          重命名
        </Button>
        <Button variant="outline" size="sm" onClick={() => onDelete(resume)}>
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          删除
        </Button>
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
