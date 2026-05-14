import { NextResponse } from "next/server";

import { parseJobDescription } from "@/lib/jd-data";
import type { JobDescriptionData } from "@/types/jd";

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const DEFAULT_MODEL = "deepseek-v4-flash";

interface ParseJdRequestBody {
  text?: string;
  resumeId?: string;
  source?: JobDescriptionData["source"];
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

  let body: ParseJdRequestBody;

  try {
    body = (await request.json()) as ParseJdRequestBody;
  } catch {
    return NextResponse.json({ error: "请求体不是有效 JSON。" }, { status: 400 });
  }

  const text = body.text?.trim();
  const resumeId = body.resumeId || "resume";

  if (!text) {
    return NextResponse.json({ error: "缺少可解析的 JD 文本。" }, { status: 400 });
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
              source: body.source || "text",
              jobDescriptionText: text.slice(0, 16000)
            })
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 2200,
        stream: false
      })
    });

    const result = (await response.json()) as DeepSeekResponse;

    if (!response.ok) {
      return NextResponse.json(
        { error: result.error?.message || "DeepSeek JD 解析请求失败。" },
        { status: response.status }
      );
    }

    const content = result.choices?.[0]?.message?.content;
    if (!content) return NextResponse.json({ error: "DeepSeek 返回内容为空。" }, { status: 502 });

    const jd = normalizeParsedJd(JSON.parse(content), text, resumeId, body.source || "text");

    return NextResponse.json({ jd, model });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI JD 解析失败。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildSystemPrompt() {
  return `你是资深中文招聘岗位分析顾问和 JD 结构化解析器。用户会提供岗位描述文本，文本可能来自 OCR，因此可能有错字、断行、重复和噪声。请只输出严格 JSON，不要输出 markdown。

目标：把 JD 解析成以下字段：
{
  "jobTitle": "",
  "company": "",
  "location": "",
  "salary": "",
  "responsibilities": [],
  "requirements": [],
  "preferredQualifications": [],
  "keywords": [],
  "analysis": {
    "roleSummary": "",
    "coreSkills": [],
    "valuedAbilities": [],
    "resumeFocus": []
  }
}

规则：
- 不要编造原文没有的信息。
- 可以纠正常见 OCR 错字和断行，但不要改变岗位含义。
- responsibilities 放岗位职责，requirements 放硬性要求，preferredQualifications 放加分项。
- keywords 放岗位匹配关键词，最多 24 个。
- analysis.roleSummary 用 2 到 3 句话解释这个岗位主要解决什么业务问题、日常会做什么、为什么需要这个角色，让刚接触岗位的求职者能听懂。
- analysis.coreSkills 放岗位最核心的硬技能、工具、业务知识或专业能力，并优先保留 JD 中明确出现的词。
- analysis.valuedAbilities 放招聘方可能看重的候选人能力，例如沟通协作、数据分析、项目推进、业务理解、从 0 到 1、跨部门推进。
- analysis.resumeFocus 放 4 到 6 条简历润色方向，要具体到“应该突出哪类经历/证据/表达方式”，不要写泛泛建议。
- 区分核心要求和加分项，不要把所有关键词都当成同等重要。
- 所有数组没有内容时返回空数组。`;
}

function normalizeParsedJd(
  value: Partial<JobDescriptionData>,
  rawText: string,
  resumeId: string,
  source: JobDescriptionData["source"]
): JobDescriptionData {
  const fallback = parseJobDescription(rawText, resumeId);
  const now = new Date().toISOString();

  return {
    ...fallback,
    id: fallback.id,
    resumeId,
    source,
    updatedAt: now,
    rawText,
    jobTitle: typeof value.jobTitle === "string" ? value.jobTitle : fallback.jobTitle,
    company: typeof value.company === "string" ? value.company : fallback.company,
    location: typeof value.location === "string" ? value.location : fallback.location,
    salary: typeof value.salary === "string" ? value.salary : fallback.salary,
    responsibilities: normalizeStringArray(value.responsibilities, fallback.responsibilities).slice(0, 12),
    requirements: normalizeStringArray(value.requirements, fallback.requirements).slice(0, 12),
    preferredQualifications: normalizeStringArray(
      value.preferredQualifications,
      fallback.preferredQualifications
    ).slice(0, 8),
    keywords: normalizeStringArray(value.keywords, fallback.keywords).slice(0, 24),
    analysis: normalizeAnalysis(value.analysis, fallback.analysis),
    parsedConfidence: 95
  };
}

function normalizeAnalysis(value: unknown, fallback: JobDescriptionData["analysis"]) {
  const analysis = (value ?? {}) as JobDescriptionData["analysis"];

  return {
    roleSummary:
      typeof analysis?.roleSummary === "string"
        ? analysis.roleSummary
        : fallback?.roleSummary ?? "",
    coreSkills: normalizeStringArray(analysis?.coreSkills, fallback?.coreSkills ?? []).slice(0, 10),
    valuedAbilities: normalizeStringArray(analysis?.valuedAbilities, fallback?.valuedAbilities ?? []).slice(0, 10),
    resumeFocus: normalizeStringArray(analysis?.resumeFocus, fallback?.resumeFocus ?? []).slice(0, 8)
  };
}

function normalizeStringArray(value: unknown, fallback: string[]) {
  const values = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)
    : [];

  return values.length ? Array.from(new Set(values)) : fallback;
}
