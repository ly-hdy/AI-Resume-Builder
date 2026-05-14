import Link from "next/link";
import { ArrowRight, FileUp, Sparkles, Workflow } from "lucide-react";

import { Button } from "@/components/ui/button";

const capabilities = [
  {
    icon: FileUp,
    title: "导入或手动创建",
    description: "支持从已有简历开始，也可以逐项填写结构化信息。"
  },
  {
    icon: Workflow,
    title: "岗位定制版本",
    description: "同一份基础简历可以复制出多个面向不同 JD 的版本。"
  },
  {
    icon: Sparkles,
    title: "AI 建议确认",
    description: "AI 只生成建议，用户确认后才应用到简历内容。"
  }
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="grid gap-10 py-8 lg:grid-cols-[1fr_520px] lg:items-center">
        <div>
          <p className="mb-4 text-sm font-medium text-primary">AI Resume Builder</p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-normal sm:text-5xl">
            针对不同岗位制作、优化并导出专业简历
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            用结构化数据管理简历内容，围绕 JD 生成可解释的优化建议，保留用户的最终编辑权。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/dashboard">
                进入工作台
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/resumes/new">创建简历</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="a4-page mx-auto bg-white p-8 shadow-sm">
            <div className="border-b pb-4">
              <div className="text-2xl font-semibold">张晨</div>
              <div className="mt-2 text-xs text-muted-foreground">
                产品经理 | 138 0000 0000 | zhangchen@example.com | 上海
              </div>
            </div>
            <div className="mt-6 space-y-5 text-sm">
              <div>
                <div className="mb-2 text-base font-semibold">工作经历</div>
                <div className="font-medium">某科技公司 | AI 产品经理</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                  <li>负责简历解析与岗位匹配模块，从 0 到 1 设计核心流程。</li>
                  <li>结合用户反馈迭代 AI 建议确认机制，降低误改风险。</li>
                </ul>
              </div>
              <div>
                <div className="mb-2 text-base font-semibold">项目经历</div>
                <div className="font-medium">JD 匹配分析系统</div>
                <p className="mt-2 text-muted-foreground">
                  提取岗位关键词、候选人画像和经历匹配信号，用于生成简历优化建议。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 py-8 md:grid-cols-3">
        {capabilities.map((item) => (
          <article key={item.title} className="rounded-lg border bg-card p-5">
            <item.icon className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="mt-4 text-base font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {item.description}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
