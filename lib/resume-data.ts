import type {
  CustomResumeSection,
  ResumeData,
  ResumeEntry,
  ResumeSectionKey,
  ResumeSectionOrderKey,
  ResumeTheme
} from "@/types/resume";
import { resumeTemplateCatalog } from "@/lib/resume-templates";

export const RESUME_STORAGE_KEY = "ai-resume-builder.resumes.v3";

export const sectionLabels: Record<ResumeSectionKey, string> = {
  basics: "基本信息",
  education: "教育经历",
  workExperience: "工作经历",
  internships: "实习经历",
  projects: "项目经历",
  campusExperience: "校园经历",
  skills: "技能",
  awards: "获奖",
  certificates: "证书",
  otherExperience: "其他经历"
};

export const editableSections: ResumeSectionKey[] = [
  "basics",
  "education",
  "workExperience",
  "internships",
  "projects",
  "campusExperience",
  "skills",
  "awards",
  "certificates",
  "otherExperience"
];

export const templateOptions = resumeTemplateCatalog.map(({ id, name, description }) => ({
  id,
  name,
  description
}));

export const themePresets = ["#0f766e", "#2563eb", "#7c3aed", "#b45309", "#be123c"];

export const defaultTheme: ResumeTheme = {
  accentColor: "#0f766e",
  density: "comfortable",
  fontScale: "11",
  nameFontScale: "24",
  metaFontScale: "10",
  headingFontScale: "11",
  photoSize: "80",
  photoOffsetY: "0",
  contentOffsetY: "0",
  fontFamily: "system",
  pageMargin: "10",
  lineHeight: "18",
  headingWeight: "bold",
  bodyColor: "#000000"
};

export function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyEntry(title = ""): ResumeEntry {
  return {
    id: createId("entry"),
    title,
    organization: "",
    major: "",
    location: "",
    startDate: "",
    endDate: "",
    description: []
  };
}

export function createEmptyCustomSection(title = "其他经历"): CustomResumeSection {
  return {
    id: createId("custom-section"),
    title,
    entries: []
  };
}

export function createEmptyResume(source: ResumeData["source"] = "manual"): ResumeData {
  const now = new Date().toISOString();

  return {
    schemaVersion: "1.0",
    locale: "zh-CN",
    id: createId("resume"),
    name: source === "upload" ? "上传解析简历" : "手动创建简历",
    source,
    updatedAt: now,
    basics: {
      name: "",
      title: "",
      phone: "",
      email: "",
      location: "",
      politicalStatus: "",
      website: "",
      linkedin: "",
      github: "",
      summary: "",
      photoUrl: ""
    },
    education: [],
    workExperience: [],
    internships: [],
    projects: [],
    campusExperience: [],
    skills: [],
    awards: [],
    certificates: [],
    otherExperience: [],
    customSections: [createEmptyCustomSection()],
    sectionOrder: editableSections,
    hiddenSections: [],
    customSectionTitles: {
      otherExperience: "其他经历"
    },
    templateId: "classic",
    theme: defaultTheme
  };
}

export const demoResume: ResumeData = {
  ...createEmptyResume("demo"),
  id: "demo-base",
  name: "基础简历",
  updatedAt: "2026-05-07T12:00:00.000Z",
  basics: {
    name: "张晨",
    title: "AI 产品经理",
    phone: "138 0000 0000",
    email: "zhangchen@example.com",
    location: "上海",
    politicalStatus: "共青团员",
    website: "",
    linkedin: "",
    github: "",
    summary: "关注 AI 产品从 0 到 1 的需求定义、体验设计和数据验证，擅长把复杂流程拆成可落地的产品方案。",
    photoUrl: ""
  },
  education: [
    {
      id: "edu-demo",
      title: "本科",
      organization: "某某大学",
      major: "软件工程",
      location: "上海",
      startDate: "2019.09",
      endDate: "2023.06",
      description: ["主修数据结构、数据库、产品设计与人机交互。"]
    }
  ],
  workExperience: [
    {
      id: "work-demo",
      title: "AI 产品经理",
      organization: "某科技公司",
      location: "上海",
      startDate: "2023.07",
      endDate: "至今",
      description: [
        "负责简历解析、JD 匹配和 AI 建议确认流程设计，沉淀结构化 Resume JSON。",
        "与研发、算法和设计协作完成编辑器 MVP，上线后持续收集用户反馈并迭代。"
      ]
    }
  ],
  projects: [
    {
      id: "project-demo",
      title: "JD 匹配分析系统",
      organization: "个人项目",
      location: "",
      startDate: "2024.01",
      endDate: "2024.04",
      description: ["提取岗位关键词、候选人画像和经历匹配信号，用于生成可解释的简历优化建议。"]
    }
  ],
  skills: ["产品需求分析", "用户访谈", "原型设计", "AI 应用流程设计", "SQL"],
  awards: ["校级优秀毕业设计"],
  certificates: ["大学英语六级"],
  templateId: "classic",
  theme: defaultTheme
};

export function normalizeResume(resume: ResumeData): ResumeData {
  const base = createEmptyResume(resume.source ?? "manual");
  const customSections =
    resume.customSections?.length
      ? resume.customSections
      : [
          {
            ...createEmptyCustomSection(resume.customSectionTitles?.otherExperience?.trim() || sectionLabels.otherExperience),
            entries: resume.otherExperience ?? []
          }
        ];

  return {
    ...base,
    ...resume,
    basics: {
      ...base.basics,
      ...resume.basics
    },
    sectionOrder: normalizeSectionOrder(resume, customSections),
    hiddenSections: [],
    customSectionTitles: {
      ...base.customSectionTitles,
      ...resume.customSectionTitles
    },
    customSections,
    templateId: resume.templateId ?? "classic",
    theme: normalizeTheme(resume.theme)
  };
}

function normalizeTheme(theme: Partial<ResumeTheme> | undefined): ResumeTheme {
  const nextTheme = {
    ...defaultTheme,
    ...theme
  };

  if (!theme?.bodyColor || theme.bodyColor.toLowerCase() === "#1f2937") {
    nextTheme.bodyColor = defaultTheme.bodyColor;
  }

  return nextTheme;
}

function normalizeSectionOrder(resume: ResumeData, customSections: CustomResumeSection[]): ResumeSectionOrderKey[] {
  const rawOrder = resume.sectionOrder?.length ? resume.sectionOrder : editableSections;
  const baseSections = new Set<ResumeSectionKey>(editableSections);
  const customKeys = customSections.map((section) => toCustomSectionKey(section.id));
  const customKeySet = new Set<string>(customKeys);
  const nextOrder: ResumeSectionOrderKey[] = [];
  const seen = new Set<string>();

  function push(key: ResumeSectionOrderKey) {
    if (seen.has(key)) return;
    nextOrder.push(key);
    seen.add(key);
  }

  for (const section of rawOrder as ResumeSectionOrderKey[]) {
    if (typeof section !== "string") continue;
    if (section.startsWith("custom:")) {
      if (customKeySet.has(section)) push(section);
      continue;
    }
    if (!baseSections.has(section as ResumeSectionKey)) continue;
    if (section === "otherExperience") {
      customKeys.forEach(push);
      continue;
    }
    push(section as ResumeSectionKey);
  }

  return nextOrder;
}

function toCustomSectionKey(id: string): `custom:${string}` {
  return `custom:${id}`;
}

export function parseResumeText(rawText: string, fileName?: string): ResumeData {
  const text = rawText.trim();
  const resume = createEmptyResume("upload");
  resume.name = fileName ? fileName.replace(/\.[^.]+$/, "") : "上传解析简历";

  if (!text) {
    resume.basics.summary = "文件内容为空，请在编辑器中补充简历信息。";
    return resume;
  }

  try {
    const parsed = JSON.parse(text) as ResumeData;
    return normalizeResume({
      ...parsed,
      id: createId("resume"),
      source: "upload",
      updatedAt: new Date().toISOString()
    });
  } catch {
    const lines = prepareResumeLines(text);
    const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
    const phone = text.match(/(?:\+?86[-\s]?)?1[3-9]\d{9}|(?:\d{3,4}[-\s]?)?\d{7,8}/)?.[0] ?? "";

    resume.basics.name = parseCandidateName(lines, phone, email) || lines[0] || "";
    resume.basics.email = email;
    resume.basics.phone = phone;
    resume.basics.location = parseLocation(lines, email);
    resume.basics.summary = buildSummary(lines);
    resume.education = parseEducation(lines);
    resume.projects = parseEntrySection(getSectionLines(lines, "projects"), "项目经历");
    resume.campusExperience = parseEntrySection(getSectionLines(lines, "campusExperience"), "校园经历");
    resume.workExperience = parseEntrySection(getSectionLines(lines, "workExperience"), "工作经历");
    resume.internships = parseEntrySection(getSectionLines(lines, "internships"), "实习经历");
    resume.otherExperience = parseEntrySection(getSectionLines(lines, "otherExperience"), "其他经历");
    resume.customSections = [{ ...createEmptyCustomSection("其他经历"), entries: resume.otherExperience }];
    resume.skills = parseListSection(lines, "skills");
    resume.certificates = parseListSection(lines, "certificates");
    resume.awards = parseListSection(lines, "awards");

    if (!hasStructuredContent(resume)) {
      resume.otherExperience = [
        {
          ...createEmptyEntry("上传文本解析结果"),
          organization: fileName ?? "上传文件",
          description: lines.slice(0, 12)
        }
      ];
      resume.customSections = [{ ...createEmptyCustomSection("其他经历"), entries: resume.otherExperience }];
    }

    return resume;
  }
}

type ParsedSection =
  | "education"
  | "projects"
  | "campusExperience"
  | "workExperience"
  | "internships"
  | "otherExperience"
  | "skills"
  | "certificates"
  | "awards";

const sectionMatchers: Array<{ section: ParsedSection; pattern: RegExp }> = [
  { section: "education", pattern: /^(教育经历|教育背景|学历背景)$/ },
  { section: "projects", pattern: /^(项目经历|项目经验|科研项目|竞赛经历)$/ },
  { section: "campusExperience", pattern: /^(学生干部经历|校园经历|社团经历|学生工作)$/ },
  { section: "workExperience", pattern: /^(工作经历|工作经验|全职经历)$/ },
  { section: "internships", pattern: /^(实习经历|实习经验)$/ },
  { section: "otherExperience", pattern: /^(社会实践|志愿服务|社会实践与志愿服务经历|实践经历)$/ },
  { section: "skills", pattern: /^(技能|专业技能|技能\/证书)$/ },
  { section: "certificates", pattern: /^(证书|资格证书)$/ },
  { section: "awards", pattern: /^(荣誉奖项|获奖经历|奖项|荣誉)$/ }
];

const dateRangePattern =
  /(?:20\d{2}|19\d{2})[./-]\d{1,2}\s*[-~至]\s*(?:20\d{2}|19\d{2})[./-]\d{1,2}|(?:20\d{2}|19\d{2})[./-]\d{1,2}\s*[-~至]\s*(?:至今|现在|Present)/i;

function prepareResumeLines(rawText: string) {
  const normalized = rawText
    .normalize("NFKC")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/(教育经历|教育背景|项目经历|项目经验|学生干部经历|校园经历|社会实践与志愿服务经历|社会实践|志愿服务|技能\/证书|技能|证书|荣誉奖项|工作经历|实习经历)/g, "\n$1\n");

  return normalized
    .split(/\n+/)
    .map((line) => line.replace(/^[-*•\d.、\s]+/, "").trim())
    .filter(Boolean)
    .filter((line, index, lines) => line !== lines[index - 1]);
}

function detectSection(line: string): ParsedSection | null {
  const compact = line.replace(/\s+/g, "");
  return sectionMatchers.find((item) => item.pattern.test(compact))?.section ?? null;
}

function getSectionLines(lines: string[], target: ParsedSection) {
  const result: string[] = [];
  let active: ParsedSection | null = null;

  for (const line of lines) {
    const section = detectSection(line);
    if (section) {
      active = section;
      continue;
    }
    if (active === target) result.push(line);
  }

  return result;
}

function parseCandidateName(lines: string[], phone: string, email: string) {
  const contactLine = lines.find((line) => (phone && line.includes(phone)) || (email && line.includes(email)));
  const beforeContact = contactLine?.split(phone || email)[0] ?? "";
  const nameFromContact = beforeContact.match(/[\u4e00-\u9fa5]{2,4}(?=\s*$)/)?.[0];
  if (nameFromContact && !detectSection(nameFromContact)) return nameFromContact;

  return lines.find((line) => /^[\u4e00-\u9fa5]{2,4}$/.test(line) && !detectSection(line)) ?? "";
}

function parseLocation(lines: string[], email: string) {
  const contactLine = lines.find((line) => email && line.includes(email)) ?? "";
  return contactLine.match(/(?:北京|上海|天津|重庆|辽宁|吉林|黑龙江|河北|河南|山东|山西|陕西|江苏|浙江|广东|四川|湖北|湖南|福建|安徽|江西|云南|贵州|广西|海南|甘肃|青海|内蒙古|新疆|西藏|宁夏|香港|澳门|台湾)[\u4e00-\u9fa5]{0,6}/)?.[0] ?? "";
}

function buildSummary(lines: string[]) {
  return lines
    .filter((line) => !detectSection(line) && !dateRangePattern.test(line) && !/(电话|邮箱|@|大学|学院)/.test(line) && line.length >= 8)
    .slice(0, 2)
    .join(" ");
}

function parseEducation(lines: string[]): ResumeEntry[] {
  const source = getSectionLines(lines, "education");
  return source
    .filter((line) => /(大学|学院|学校)/.test(line))
    .map((line) => {
      const dates = extractDates(line);
      const organization = line.match(/[\u4e00-\u9fa5A-Za-z]+(?:大学|学院|学校)/)?.[0] ?? line;
      const degree = line.match(/(博士|硕士|本科|学士|研究生|专科|MBA|MPA)/)?.[0] ?? "";
      return {
        ...createEmptyEntry(degree || "教育经历"),
        title: degree || "学历",
        organization,
        startDate: dates.startDate,
        endDate: dates.endDate,
        description: []
      };
    });
}

function parseEntrySection(lines: string[], fallbackTitle: string): ResumeEntry[] {
  const entries: ResumeEntry[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line || detectSection(line) || dateRangePattern.test(line)) continue;

    const dateLine = lines.slice(index, index + 4).find((item) => dateRangePattern.test(item));
    if (!dateLine) continue;
    const dates = extractDates(dateLine);
    const description = lines
      .slice(index + 1, index + 8)
      .filter((item) => item !== dateLine && !detectSection(item))
      .slice(0, 6);

    entries.push({
      ...createEmptyEntry(line || fallbackTitle),
      startDate: dates.startDate,
      endDate: dates.endDate,
      description
    });
  }

  return uniqueEntries(entries);
}

function parseListSection(lines: string[], target: ParsedSection) {
  const sectionLines = getSectionLines(lines, target);
  return unique(
    sectionLines.flatMap((line) =>
      line
        .replace(/^(技能|证书|荣誉奖项|奖项|专业技能)[:：]?/, "")
        .split(/[、，,；;]/)
        .map((item) => item.trim())
        .filter((item) => item.length >= 2 && item.length <= 40)
    )
  ).slice(0, 20);
}

function extractDates(value: string) {
  const match = value.match(dateRangePattern)?.[0] ?? "";
  const parts = match.split(/\s*[-~至]\s*/);

  return {
    startDate: parts[0] ?? "",
    endDate: parts[1] ?? ""
  };
}

function hasStructuredContent(resume: ResumeData) {
  return Boolean(
    resume.education.length ||
      resume.workExperience.length ||
      resume.internships.length ||
      resume.projects.length ||
      resume.campusExperience.length ||
      resume.skills.length ||
      resume.certificates.length ||
      resume.awards.length
  );
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function uniqueEntries(entries: ResumeEntry[]) {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    const key = `${entry.title}-${entry.startDate}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
