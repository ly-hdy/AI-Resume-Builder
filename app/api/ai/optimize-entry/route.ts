import { NextResponse } from "next/server";

import type { JobDescriptionData } from "@/types/jd";
import type { ResumeData } from "@/types/resume";
import type { ResumeEntry } from "@/types/resume";

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const DEFAULT_MODEL = "deepseek-v4-flash";

interface OptimizeEntryRequestBody {
  sectionTitle?: string;
  entry?: ResumeEntry;
  resume?: ResumeData;
  jd?: JobDescriptionData | null;
}

interface DeepSeekResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
}

export async function POST(request: Request) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const model = process.env.DEEPSEEK_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    return NextResponse.json(
      { error: "DeepSeek API Key 尚未配置，请在 .env.local 中设置 DEEPSEEK_API_KEY。" },
      { status: 500 }
    );
  }

  let body: OptimizeEntryRequestBody;

  try {
    body = (await request.json()) as OptimizeEntryRequestBody;
  } catch {
    return NextResponse.json({ error: "请求体不是有效 JSON。" }, { status: 400 });
  }

  if (!body.entry) {
    return NextResponse.json({ error: "缺少需要优化的经历内容。" }, { status: 400 });
  }

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: buildSystemPrompt()
          },
          {
            role: "user",
            content: JSON.stringify({
              sectionTitle: body.sectionTitle || "简历经历",
              entry: body.entry,
              resumeContext: summarizeResume(body.resume),
              jobDescription: body.jd
            })
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.25,
        max_tokens: 1200,
        stream: false
      })
    });

    const result = (await response.json()) as DeepSeekResponse;

    if (!response.ok) {
      return NextResponse.json(
        { error: result.error?.message || "DeepSeek 优化请求失败。" },
        { status: response.status }
      );
    }

    const content = result.choices?.[0]?.message?.content;
    if (!content) return NextResponse.json({ error: "DeepSeek 返回内容为空。" }, { status: 502 });

    const optimizedEntry = normalizeEntry(JSON.parse(content), body.entry);

    return NextResponse.json({ entry: optimizedEntry, model });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI 优化失败。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildSystemPrompt() {
  return `你是资深中文简历顾问，熟悉招聘方筛选简历的真实逻辑。请只输出严格 JSON，不要输出 markdown。

目标：在不编造事实的前提下，结合目标 JD 和候选人整体背景，优化用户给出的单条简历经历，让它更像目标岗位需要的证据，而不是泛泛润色。

输出字段：
{
  "title": "",
  "organization": "",
  "location": "",
  "startDate": "",
  "endDate": "",
  "description": []
}

要求：
- 不要新增原文没有的公司、学校、项目、岗位、时间、数据指标或证书。
- 优先响应 JD 中的核心职责、硬技能、看重能力和关键词；如果没有 JD，则按通用招聘视角优化。
- 把描述写成“动作 + 方法/工具/协作对象 + 产出/影响”的结构。
- 如果原文没有数据，不要编造百分比、金额、人数；可以用“提升了流程清晰度”“支持了后续决策”等非量化但真实的产出表达。
- description 保持 2 到 5 条，每条都要避免空泛词，例如“负责相关工作”“提升综合能力”。
- 如果原文信息不足，只做措辞优化，不要脑补成果。`;
}

function summarizeResume(resume?: ResumeData) {
  if (!resume) return null;

  return {
    targetTitle: resume.basics.title,
    summary: resume.basics.summary,
    skills: resume.skills,
    recentWork: resume.workExperience.slice(0, 3),
    projects: resume.projects.slice(0, 3),
    internships: resume.internships.slice(0, 3),
    customSections: resume.customSections?.slice(0, 4)
  };
}

function normalizeEntry(value: Partial<ResumeEntry>, fallback: ResumeEntry): ResumeEntry {
  return {
    ...fallback,
    title: typeof value.title === "string" ? value.title : fallback.title,
    organization: typeof value.organization === "string" ? value.organization : fallback.organization,
    location: typeof value.location === "string" ? value.location : fallback.location,
    startDate: typeof value.startDate === "string" ? value.startDate : fallback.startDate,
    endDate: typeof value.endDate === "string" ? value.endDate : fallback.endDate,
    description: normalizeStringArray(value.description).length
      ? normalizeStringArray(value.description).slice(0, 6)
      : fallback.description
  };
}

function normalizeStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
    : [];
}
