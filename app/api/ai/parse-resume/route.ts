import { NextResponse } from "next/server";

import { normalizeResume } from "@/lib/resume-data";
import type { ResumeData, ResumeEntry } from "@/types/resume";

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const DEFAULT_MODEL = "deepseek-v4-flash";

interface ParseResumeRequestBody {
  text?: string;
  fileName?: string;
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

const entrySections = [
  "education",
  "workExperience",
  "internships",
  "projects",
  "campusExperience",
  "otherExperience"
] as const;

const listSections = ["skills", "awards", "certificates"] as const;

export async function POST(request: Request) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const model = process.env.DEEPSEEK_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    return NextResponse.json(
      { error: "DeepSeek API Key 尚未配置，请在 .env.local 中设置 DEEPSEEK_API_KEY。" },
      { status: 500 }
    );
  }

  let body: ParseResumeRequestBody;

  try {
    body = (await request.json()) as ParseResumeRequestBody;
  } catch {
    return NextResponse.json({ error: "请求体不是有效 JSON。" }, { status: 400 });
  }

  const text = body.text?.trim();

  if (!text) {
    return NextResponse.json({ error: "缺少可解析的简历文本。" }, { status: 400 });
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
              fileName: body.fileName,
              resumeText: text.slice(0, 18000)
            })
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 3600,
        stream: false
      })
    });

    const result = (await response.json()) as DeepSeekResponse;

    if (!response.ok) {
      return NextResponse.json(
        { error: result.error?.message || "DeepSeek 简历解析请求失败。" },
        { status: response.status }
      );
    }

    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: "DeepSeek 返回内容为空。" }, { status: 502 });
    }

    const resume = normalizeParsedResume(JSON.parse(content), body.fileName);

    return NextResponse.json({ resume, model });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI 简历解析失败。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildSystemPrompt() {
  return `你是严谨的中文简历结构化解析器。用户会提供从 PDF、DOCX 或文本中抽取出的简历文字。请只输出严格 JSON，不要输出 markdown。

目标：把原始简历文本解析成 ResumeData 形状，字段必须包括：
{
  "name": "",
  "basics": {
    "name": "",
    "title": "",
    "phone": "",
    "email": "",
    "location": "",
    "website": "",
    "linkedin": "",
    "github": "",
    "summary": ""
  },
  "education": [],
  "workExperience": [],
  "internships": [],
  "projects": [],
  "campusExperience": [],
  "skills": [],
  "awards": [],
  "certificates": [],
  "otherExperience": []
}

每个经历条目必须是：
{
  "title": "",
  "organization": "",
  "location": "",
  "startDate": "",
  "endDate": "",
  "description": []
}

解析规则：
- 不要编造原文没有的信息。
- 原文重复出现的标题或内容只保留一次。
- 教育经历只放学校、专业、学历、课程等；获奖不要塞进教育经历描述，放到 awards。
- 项目经历包括科研项目、竞赛项目、自媒体运营项目等，放 projects。
- 学生干部、团支书、党支书、社团工作放 campusExperience。
- 社会实践、志愿服务、支教活动放 otherExperience。
- 实习或公司经历放 internships 或 workExperience。
- 技能只放技能名；证书只放证书名；奖项只放荣誉奖项名。
- PDF 抽取文本可能有断行，把明显属于上一条的半句话合并到 description。
- 日期保持原文格式，例如 "2023.06"、"2024.05"、"至今"。
- 所有数组没有内容时返回空数组。`;
}

function normalizeParsedResume(value: Partial<ResumeData>, fileName?: string): ResumeData {
  const now = new Date().toISOString();
  const fallbackName = fileName ? fileName.replace(/\.[^.]+$/, "") : "上传解析简历";
  const resume = normalizeResume({
    ...value,
    schemaVersion: "1.0",
    locale: "zh-CN",
    id: `resume-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    name: value.name || value.basics?.name ? `${value.basics?.name || value.name}的简历` : fallbackName,
    source: "upload",
    updatedAt: now,
    basics: {
      name: "",
      title: "",
      phone: "",
      email: "",
      location: "",
      website: "",
      linkedin: "",
      github: "",
      summary: "",
      ...value.basics
    }
  } as ResumeData);

  for (const section of entrySections) {
    resume[section] = normalizeEntries(value[section]);
  }

  for (const section of listSections) {
    resume[section] = normalizeStringArray(value[section]);
  }

  return resume;
}

function normalizeEntries(value: unknown): ResumeEntry[] {
  if (!Array.isArray(value)) return [];

  return value.slice(0, 20).map((item, index) => {
    const entry = item as Partial<ResumeEntry>;

    return {
      id: entry.id || `entry-${Date.now().toString(36)}-${index}`,
      title: typeof entry.title === "string" ? entry.title : "",
      organization: typeof entry.organization === "string" ? entry.organization : "",
      location: typeof entry.location === "string" ? entry.location : "",
      startDate: typeof entry.startDate === "string" ? entry.startDate : "",
      endDate: typeof entry.endDate === "string" ? entry.endDate : "",
      description: normalizeStringArray(entry.description).slice(0, 10)
    };
  });
}

function normalizeStringArray(value: unknown) {
  return Array.isArray(value)
    ? Array.from(new Set(value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean)))
    : [];
}
