import type { JobDescriptionData } from "@/types/jd";

export const JD_STORAGE_KEY = "ai-resume-builder.job-descriptions.v1";

const responsibilityLabels = ["岗位职责", "工作职责", "职位职责", "职责描述", "你将负责", "Responsibilities"];
const requirementLabels = ["任职要求", "岗位要求", "职位要求", "能力要求", "我们希望你", "Requirements"];
const preferredLabels = ["加分项", "优先条件", "优先考虑", "Preferred", "Nice to have"];

const keywordCandidates = [
  "AI",
  "AIGC",
  "LLM",
  "大模型",
  "Agent",
  "RAG",
  "Prompt",
  "产品经理",
  "用户研究",
  "深度访谈",
  "可用性测试",
  "问卷调查",
  "焦点小组",
  "A/B测试",
  "交互体验设计",
  "数据分析",
  "SQL",
  "Python",
  "Excel",
  "PowerPoint",
  "原型设计",
  "项目管理",
  "商业化",
  "增长",
  "SaaS",
  "B端",
  "C端",
  "NLP",
  "推荐系统",
  "机器学习",
  "跨部门协作"
];

export function createEmptyJd(resumeId: string): JobDescriptionData {
  const now = new Date().toISOString();

  return {
    schemaVersion: "1.0",
    id: createId("jd"),
    resumeId,
    source: "text",
    createdAt: now,
    updatedAt: now,
    rawText: "",
    jobTitle: "",
    company: "",
    location: "",
    salary: "",
    responsibilities: [],
    requirements: [],
    preferredQualifications: [],
    keywords: [],
    analysis: {
      roleSummary: "",
      coreSkills: [],
      valuedAbilities: [],
      resumeFocus: []
    },
    parsedConfidence: 0
  };
}

export function normalizeJd(jd: JobDescriptionData, resumeId: string): JobDescriptionData {
  return {
    ...createEmptyJd(resumeId),
    ...jd,
    resumeId: jd.resumeId ?? resumeId,
    responsibilities: jd.responsibilities ?? [],
    requirements: jd.requirements ?? [],
    preferredQualifications: jd.preferredQualifications ?? [],
    keywords: jd.keywords ?? [],
    analysis: {
      roleSummary: jd.analysis?.roleSummary ?? "",
      coreSkills: jd.analysis?.coreSkills ?? [],
      valuedAbilities: jd.analysis?.valuedAbilities ?? [],
      resumeFocus: jd.analysis?.resumeFocus ?? []
    }
  };
}

export function readStoredJds(): JobDescriptionData[] {
  const raw = window.localStorage.getItem(JD_STORAGE_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as JobDescriptionData[];
  } catch {
    return [];
  }
}

export function saveStoredJd(jd: JobDescriptionData) {
  const all = readStoredJds();
  const nextJd = {
    ...jd,
    updatedAt: new Date().toISOString()
  };
  const next = [nextJd, ...all.filter((item) => item.id !== nextJd.id)];
  window.localStorage.setItem(JD_STORAGE_KEY, JSON.stringify(next));
  return nextJd;
}

export function cleanOcrTextForJd(rawText: string) {
  const normalized = rawText
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/[；;]/g, "；")
    .replace(/[：:]\s*/g, "：")
    .replace(/\r/g, "\n");

  const lines = normalized
    .split(/\n+/)
    .map((line) => normalizeOcrLine(line))
    .filter(Boolean)
    .filter((line) => !isOcrNoiseLine(line));

  return mergeBrokenLines(lines).join("\n");
}

export function parseJobDescription(rawText: string, resumeId: string): JobDescriptionData {
  const text = rawText.trim();
  const lines = text.split(/\r?\n/).map(cleanLine).filter(Boolean);
  const jd = createEmptyJd(resumeId);
  jd.rawText = rawText;

  if (!text) return jd;

  jd.jobTitle = parseJobTitle(lines);
  jd.company = parseField(text, ["公司", "企业", "Company"]);
  jd.location = parseField(text, ["地点", "城市", "工作地点", "Location"]);
  jd.salary = parseSalary(text);
  jd.responsibilities = parseSection(lines, responsibilityLabels, [
    ...requirementLabels,
    ...preferredLabels
  ]);
  jd.requirements = parseSection(lines, requirementLabels, [
    ...responsibilityLabels,
    ...preferredLabels
  ]);
  jd.preferredQualifications = parseSection(lines, preferredLabels, [
    ...responsibilityLabels,
    ...requirementLabels
  ]);

  if (!jd.responsibilities.length && !jd.requirements.length) {
    const midpoint = Math.ceil(lines.length / 2);
    jd.responsibilities = lines.slice(0, midpoint).filter(isContentLine).slice(0, 8);
    jd.requirements = lines.slice(midpoint).filter(isContentLine).slice(0, 8);
  }

  jd.keywords = extractKeywords(text, [
    ...jd.responsibilities,
    ...jd.requirements,
    ...jd.preferredQualifications
  ]);
  jd.analysis = buildLocalJdAnalysis(jd);
  jd.parsedConfidence = calculateConfidence(jd);

  return jd;
}

function buildLocalJdAnalysis(jd: JobDescriptionData) {
  const roleName = jd.jobTitle || "这个岗位";
  const skillKeywords = jd.keywords.filter((keyword) => !commonWords.has(keyword)).slice(0, 8);

  return {
    roleSummary: `${roleName}主要围绕岗位职责中的任务展开，需要候选人能理解业务目标，并把要求转化为可执行的工作产出。`,
    coreSkills: skillKeywords,
    valuedAbilities: unique([
      ...jd.requirements
        .join(" ")
        .match(/沟通协作|数据分析|项目管理|用户研究|需求分析|原型设计|跨部门协作|执行力|学习能力/g) ?? []
    ]).slice(0, 8),
    resumeFocus: unique([
      "突出与岗位职责直接相关的项目或工作经历",
      "把描述写成动作、方法和结果的组合",
      "补充 JD 中反复出现的关键词",
      "优先呈现可量化的产出或业务影响"
    ])
  };
}

function normalizeOcrLine(line: string) {
  return line
    .replace(/\s+/g, " ")
    .replace(/([\u4e00-\u9fa5])\s+([\u4e00-\u9fa5])/g, "$1$2")
    .replace(/任职\s*要\s*求/g, "任职要求")
    .replace(/岗位\s*职\s*责/g, "岗位职责")
    .replace(/职位\s*详情/g, "")
    .replace(/今日\s*活跃/g, "")
    .replace(/易\s*享\s*科技/g, "易享科技")
    .replace(/用\s*户\s*研\s*究/g, "用户研究")
    .replace(/深度\s*访谈/g, "深度访谈")
    .replace(/问卷\s*调查/g, "问卷调查")
    .replace(/焦点\s*小\s*组/g, "焦点小组")
    .replace(/交互\s*体\s*验\s*设计/g, "交互体验设计")
    .replace(/捐标/g, "指标")
    .replace(/相天专业/g, "相关专业")
    .replace(/文凭/g, "学历")
    .replace(/Excel\|/g, "Excel")
    .replace(/^[-*•·\d.、)\s]+/, "")
    .trim();
}

function isOcrNoiseLine(line: string) {
  if (!line) return true;
  if (/^\d{1,2}:\d{2}/.test(line)) return true;
  if (/^(今日活跃|职位详情|用户研究)$/.test(line)) return true;
  if (/^[《"'\s。、，,|/\\-]+$/.test(line)) return true;

  const cjkCount = countMatches(line, /[\u4e00-\u9fa5]/g);
  const letterCount = countMatches(line, /[A-Za-z]/g);
  const usefulEnglish = /(AI|AIGC|LLM|RAG|SQL|Excel|PowerPoint|Python|SaaS|B端|C端)/i.test(line);

  if (letterCount >= 8 && cjkCount <= 2 && !usefulEnglish) return true;
  if (line.length <= 2 && !/^[A-Za-z]+$/.test(line)) return true;

  return false;
}

function mergeBrokenLines(lines: string[]) {
  const merged: string[] = [];

  for (const line of lines) {
    const previous = merged[merged.length - 1];
    const shouldMerge =
      previous &&
      !/[。；;:：]$/.test(previous) &&
      !/^(岗位职责|任职要求|加分项)/.test(line) &&
      !/^\d+[、.]/.test(line) &&
      previous.length < 42;

    if (shouldMerge) {
      merged[merged.length - 1] = `${previous}${line}`;
    } else {
      merged.push(line);
    }
  }

  return merged;
}

function parseJobTitle(lines: string[]) {
  const labeled = lines.find((line) => /岗位|职位|Job Title|Title/i.test(line));
  if (labeled) {
    const value = labeled.split(/[:：]/).pop()?.trim();
    if (value && value.length <= 40) return value;
  }

  return lines.find((line) => line.length <= 32 && !line.includes("：") && !line.includes(":")) ?? "";
}

function parseField(text: string, labels: string[]) {
  for (const label of labels) {
    const match = text.match(new RegExp(`${label}\\s*[:：]\\s*([^\\n\\r]+)`, "i"));
    if (match?.[1]) return cleanLine(match[1]);
  }

  return "";
}

function parseSalary(text: string) {
  return (
    text.match(/\d{1,3}\s*[kK]\s*[-~至]\s*\d{1,3}\s*[kK]?/)?.[0] ??
    text.match(/\d{1,3}\s*万\s*[-~至]\s*\d{1,3}\s*万/)?.[0] ??
    ""
  );
}

function parseSection(lines: string[], startLabels: string[], stopLabels: string[]) {
  const result: string[] = [];
  let collecting = false;

  for (const line of lines) {
    if (matchesLabel(line, startLabels)) {
      collecting = true;
      const inline = line.split(/[:：]/).slice(1).join("：").trim();
      if (inline) result.push(cleanBullet(inline));
      continue;
    }

    if (collecting && matchesLabel(line, stopLabels)) break;
    if (collecting && isContentLine(line)) result.push(cleanBullet(line));
  }

  return unique(result).slice(0, 10);
}

function extractKeywords(text: string, parsedLines: string[]) {
  const lowerText = text.toLowerCase();
  const presetHits = keywordCandidates.filter((keyword) => lowerText.includes(keyword.toLowerCase()));
  const tokenHits = parsedLines
    .join(" ")
    .match(/[A-Za-z][A-Za-z0-9+#.-]{1,}|[\u4e00-\u9fa5]{2,8}/g);

  return unique([
    ...presetHits,
    ...(tokenHits ?? []).filter((token) => token.length >= 2 && !commonWords.has(token))
  ]).slice(0, 24);
}

function calculateConfidence(jd: JobDescriptionData) {
  let score = 20;
  if (jd.jobTitle) score += 15;
  if (jd.company) score += 10;
  if (jd.responsibilities.length) score += 20;
  if (jd.requirements.length) score += 20;
  if (jd.keywords.length >= 5) score += 10;
  if (jd.preferredQualifications.length) score += 5;
  return Math.min(100, score);
}

function matchesLabel(line: string, labels: string[]) {
  return labels.some((label) => line.toLowerCase().includes(label.toLowerCase()));
}

function isContentLine(line: string) {
  return line.length > 1 && !/^(岗位职责|工作职责|任职要求|岗位要求|加分项|优先条件)\s*[:：]?$/.test(line);
}

function cleanLine(line: string) {
  return line.replace(/\s+/g, " ").trim();
}

function cleanBullet(line: string) {
  return cleanLine(line).replace(/^[-*•·\d.、)\s]+/, "");
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function countMatches(value: string, pattern: RegExp) {
  return value.match(pattern)?.length ?? 0;
}

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const commonWords = new Set([
  "岗位",
  "职位",
  "职责",
  "要求",
  "负责",
  "相关",
  "能力",
  "经验",
  "优先",
  "工作",
  "我们",
  "具备",
  "熟悉",
  "良好"
]);
