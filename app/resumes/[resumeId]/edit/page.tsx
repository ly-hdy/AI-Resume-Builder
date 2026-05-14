import Link from "next/link";
import { FileSearch, GitBranch } from "lucide-react";

import { PageShell } from "@/components/layout/page-shell";
import { ResumeEditorShell } from "@/components/resume-editor/editor-shell";
import { Button } from "@/components/ui/button";

export default function ResumeEditPage({
  params
}: {
  params: { resumeId: string };
}) {
  return (
    <PageShell
      title="简历编辑器"
      description={`当前草稿：${params.resumeId}。支持结构化编辑、模块排序、本地保存和实时预览。`}
      actions={
        <>
          <Button asChild variant="outline">
            <Link href={`/resumes/${params.resumeId}/versions`}>
              <GitBranch className="h-4 w-4" aria-hidden="true" />
              版本管理
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/resumes/${params.resumeId}/jd`}>
              <FileSearch className="h-4 w-4" aria-hidden="true" />
              JD 解析
            </Link>
          </Button>
        </>
      }
    >
      <ResumeEditorShell resumeId={params.resumeId} />
    </PageShell>
  );
}
