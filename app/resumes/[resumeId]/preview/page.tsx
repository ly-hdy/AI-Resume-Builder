"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Pencil } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { ResumePreview } from "@/components/resume-editor/editor-shell";
import { Button } from "@/components/ui/button";
import { RESUME_STORAGE_KEY, demoResume, normalizeResume } from "@/lib/resume-data";
import type { ResumeData } from "@/types/resume";

export default function ResumePreviewPage({
  params
}: {
  params: { resumeId: string };
}) {
  const [resume, setResume] = useState<ResumeData>(normalizeResume(demoResume));

  useEffect(() => {
    const raw = window.localStorage.getItem(RESUME_STORAGE_KEY);
    if (!raw) return;

    try {
      const resumes = (JSON.parse(raw) as ResumeData[]).map(normalizeResume);
      setResume(resumes.find((item) => item.id === params.resumeId) ?? normalizeResume(demoResume));
    } catch {
      setResume(normalizeResume(demoResume));
    }
  }, [params.resumeId]);

  return (
    <PageShell
      title="简历预览"
      description="查看当前模板下的 A4 呈现效果。点击导出 PDF 会打开浏览器打印面板，可选择另存为 PDF。"
      actions={
        <>
          <Button asChild variant="outline">
            <Link href={`/resumes/${params.resumeId}/edit`}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              返回编辑
            </Link>
          </Button>
          <Button onClick={() => window.print()}>
            <Download className="h-4 w-4" aria-hidden="true" />
            导出 PDF
          </Button>
        </>
      }
    >
      <div className="resume-print-surface mt-6 overflow-auto rounded-lg border bg-muted p-6 print:border-0 print:bg-white print:p-0">
        <ResumePreview resume={resume} />
      </div>
    </PageShell>
  );
}
