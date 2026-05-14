import { NextResponse } from "next/server";

import type { AiMatchAnalysis, AiSuggestion } from "@/types/ai";
import type { JobDescriptionData } from "@/types/jd";
import type { ResumeData } from "@/types/resume";

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const DEFAULT_MODEL = "deepseek-v4-flash";

interface MatchRequestBody {
  resume?: ResumeData;
  jd?: JobDescriptionData;
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

  let body: MatchRequestBody;

  try {
    body = (await request.json()) as MatchRequestBody;
  } catch {
    return NextResponse.json({ error: "请求体不是有效 JSON。" }, { status: 400 });
  }

  if (!body.resume || !body.jd) {
    return NextResponse.json({ error: "缺少 resume 或 jd 数据。" }, { status: 400 });
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
              resume: body.resume,
              jobDescription: body.jd
            })
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 3600,
        stream: false
      })
    });

    const result = (await response.json()) as DeepSeekResponse;

    if (!response.ok) {
      return NextResponse.json(
        { error: result.error?.message || "DeepSeek 请求失败。" },
        { status: response.status }
      );
    }

    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: "DeepSeek 返回内容为空，请稍后重试。" }, { status: 502 });
    }

    const analysis = normalizeAnalysis(parseAiJson(content), model);

    return NextResponse.json({ analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI 匹配分析失败。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildSystemPrompt() {
  return `你是资深中文招聘匹配顾问，既理解招聘方筛选逻辑，也理解求职者如何用真实经历证明匹配度。请基于用户提供的 resume json 和 jobDescription json，输出严格 json，不要输出 markdown。

目标：
1. 先判断岗位真实画像：这个岗位主要解决什么问题、核心职责是什么、招聘方最可能筛选哪些证据。
2. 再判断候选人画像：简历中哪些经历能作为证据，哪些表达薄弱，哪些要求缺少支撑。
3. 最后生成需要用户确认后才能应用的简历优化建议。

要求：
- 不要编造不存在的经历、学历、公司、证书、指标或时间。
- 不要只做关键词堆砌；建议必须说明“为什么这条改写能回应 JD 的筛选点”。
- 建议应围绕已有经历改写、关键词补充、结构调整或强调重点，优先改写最能证明匹配度的经历。
- 每条 suggestion 必须能映射到 targetPath，例如 basics.summary、skills、workExperience.0.description.1、projects.0.description.0。
- matchScore 是 0 到 100 的整数。
- suggestions 返回 3 到 6 条。
- strengths 要写具体证据，不要写“能力较强”这种空话。
- gaps 要区分“确实缺少经历”和“只是表达没有突出”。
- summary 要像顾问结论：指出当前匹配度、最大优势、最大短板、简历优化主线。
- 所有字段使用中文。

示例 json 输出：
{
  "matchScore": 78,
  "keywordCoverage": {
    "matched": ["AI 产品", "需求分析"],
    "missing": ["RAG", "数据指标"]
  },
  "strengths": ["有 AI 产品流程设计经验"],
  "gaps": ["缺少与岗位要求直接对应的数据指标"],
  "summary": "简历与岗位方向基本一致，但需要强化关键词和成果表达。",
  "suggestions": [
    {
      "id": "suggestion-1",
      "type": "rewrite",
      "targetPath": "basics.summary",
      "originalText": "原文",
      "suggestedText": "建议文案",
      "reason": "更直接回应 JD 中的 AI 产品规划要求",
      "status": "pending"
    }
  ]
}`;
}

function normalizeAnalysis(value: Partial<AiMatchAnalysis>, model: string): AiMatchAnalysis {
  return {
    matchScore: clampScore(value.matchScore),
    keywordCoverage: {
      matched: normalizeStringArray(value.keywordCoverage?.matched),
      missing: normalizeStringArray(value.keywordCoverage?.missing)
    },
    strengths: normalizeStringArray(value.strengths),
    gaps: normalizeStringArray(value.gaps),
    summary: typeof value.summary === "string" ? value.summary : "AI 已完成岗位与简历匹配分析。",
    suggestions: normalizeSuggestions(value.suggestions),
    model
  };
}

function parseAiJson(content: string) {
  const jsonText = extractJsonObject(content)
    .replace(/,\s*([}\]])/g, "$1")
    .replace(/```json|```/g, "")
    .trim();

  try {
    return JSON.parse(jsonText);
  } catch {
    const repaired = repairLikelyTruncatedJson(jsonText);
    try {
      return JSON.parse(repaired);
    } catch {
      throw new Error("AI 返回的 JSON 格式不完整，请重新生成一次建议。");
    }
  }
}

function extractJsonObject(content: string) {
  const trimmed = content.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  return trimmed;
}

function repairLikelyTruncatedJson(value: string) {
  let repaired = value.trim();

  if ((repaired.match(/"/g)?.length ?? 0) % 2 === 1) repaired += "\"";

  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (const char of repaired) {
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === "\"") {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === "{") stack.push("}");
    if (char === "[") stack.push("]");
    if ((char === "}" || char === "]") && stack[stack.length - 1] === char) stack.pop();
  }

  return repaired.replace(/,\s*$/, "") + stack.reverse().join("");
}

function normalizeSuggestions(suggestions: unknown): AiSuggestion[] {
  if (!Array.isArray(suggestions)) return [];

  return suggestions.slice(0, 8).map((item, index) => {
    const suggestion = item as Partial<AiSuggestion>;

    return {
      id: suggestion.id || `suggestion-${index + 1}`,
      type: suggestion.type || "rewrite",
      targetPath: suggestion.targetPath || "basics.summary",
      originalText: suggestion.originalText || "",
      suggestedText: suggestion.suggestedText || "",
      reason: suggestion.reason || "提升与岗位要求的对应关系。",
      status: "pending"
    };
  });
}

function normalizeStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function clampScore(value: unknown) {
  const score = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}
