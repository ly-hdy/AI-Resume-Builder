import type { ResumeTemplateId } from "@/types/resume";

export type ResumeTemplateCategory =
  | "热门"
  | "免费"
  | "应届生"
  | "实习生"
  | "社招"
  | "校招"
  | "互联网"
  | "产品经理"
  | "学术";

export interface ResumeTemplateMeta {
  id: ResumeTemplateId;
  name: string;
  description: string;
  category: ResumeTemplateCategory[];
  tags: string[];
  recommendedFor: string[];
  usageCount: number;
  language: "中文简历" | "英文简历";
  isHighFidelity?: boolean;
}

export const resumeTemplateCatalog: ResumeTemplateMeta[] = [
  {
    id: "formalScholar",
    name: "学术严谨通用模板",
    description: "黑白分隔线、高密度信息排版，适合升学、科研、校招和正式投递。",
    category: ["热门", "免费", "应届生", "校招", "学术"],
    tags: ["学术", "校招", "高密度", "中文简历"],
    recommendedFor: ["保研/升学", "科研助理", "校招", "正式投递"],
    usageCount: 128430,
    language: "中文简历",
    isHighFidelity: true
  },
  {
    id: "internRosePro",
    name: "实习生通用简历模板",
    description: "玫红页眉与浅色分区，适合实习、运营、市场和校园经历展示。",
    category: ["热门", "免费", "实习生", "校招"],
    tags: ["校招", "实习", "大学生", "实习生"],
    recommendedFor: ["实习投递", "校园经历", "运营/市场"],
    usageCount: 876260,
    language: "中文简历",
    isHighFidelity: true
  },
  {
    id: "graduateBluePro",
    name: "应届生通用简历模板",
    description: "蓝色弧形页眉，信息层级清晰，适合应届生和管培生。",
    category: ["热门", "免费", "应届生", "校招"],
    tags: ["应届生", "求职", "校招简历"],
    recommendedFor: ["应届生", "管培生", "校招"],
    usageCount: 1010677,
    language: "中文简历",
    isHighFidelity: true
  },
  {
    id: "socialTealPro",
    name: "社会招聘通用简历模板",
    description: "青绿色卡片分区，适合社招、产品、运营和职能岗位。",
    category: ["热门", "社招", "互联网", "产品经理"],
    tags: ["社招简历", "简历范文", "求职"],
    recommendedFor: ["社招", "产品经理", "运营", "职能岗位"],
    usageCount: 918750,
    language: "中文简历",
    isHighFidelity: true
  },
  {
    id: "ats",
    name: "ATS 投递",
    description: "结构克制、机器友好，适合网申和系统筛选。",
    category: ["免费", "互联网"],
    tags: ["ATS", "网申"],
    recommendedFor: ["网申", "技术岗", "大厂投递"],
    usageCount: 362108,
    language: "中文简历"
  },
  {
    id: "classic",
    name: "经典单栏",
    description: "稳妥、清晰，适合大多数投递场景。",
    category: ["免费"],
    tags: ["通用", "单栏"],
    recommendedFor: ["通用投递"],
    usageCount: 204516,
    language: "中文简历"
  },
  {
    id: "compact",
    name: "紧凑单栏",
    description: "信息密度更高，适合经历较多的一页简历。",
    category: ["免费", "社招"],
    tags: ["紧凑", "经历丰富"],
    recommendedFor: ["经历丰富", "一页简历"],
    usageCount: 189032,
    language: "中文简历"
  },
  {
    id: "accent",
    name: "强调侧栏",
    description: "侧栏突出联系信息和技能，适合展示能力标签。",
    category: ["免费", "社招"],
    tags: ["侧栏", "技能突出"],
    recommendedFor: ["社招", "运营", "产品"],
    usageCount: 151204,
    language: "中文简历"
  },
  {
    id: "modern",
    name: "现代留白",
    description: "留白更足、标题强调，适合偏设计感的岗位。",
    category: ["免费", "互联网"],
    tags: ["现代", "留白"],
    recommendedFor: ["产品经理", "设计", "互联网"],
    usageCount: 168905,
    language: "中文简历"
  },
  {
    id: "executive",
    name: "资深双栏",
    description: "主栏展示经历，侧栏承载技能与证书，适合资深候选人。",
    category: ["免费", "社招"],
    tags: ["双栏", "资深"],
    recommendedFor: ["社招", "管理岗"],
    usageCount: 120881,
    language: "中文简历"
  },
  {
    id: "timeline",
    name: "时间线",
    description: "适合按时间展示连续经历和成长路径。",
    category: ["免费", "应届生", "校招"],
    tags: ["时间线", "经历展示"],
    recommendedFor: ["校招", "实习生"],
    usageCount: 110452,
    language: "中文简历"
  },
  {
    id: "roseBanner",
    name: "玫红页眉",
    description: "彩色页眉突出个人信息，适合校园和实习投递。",
    category: ["免费", "实习生", "校招"],
    tags: ["页眉", "实习"],
    recommendedFor: ["实习投递", "校招"],
    usageCount: 92840,
    language: "中文简历"
  },
  {
    id: "blueCurve",
    name: "蓝色弧线",
    description: "蓝色曲线页眉，视觉清爽。",
    category: ["免费", "应届生", "校招"],
    tags: ["蓝色", "应届生"],
    recommendedFor: ["应届生", "校招"],
    usageCount: 95602,
    language: "中文简历"
  },
  {
    id: "coralPro",
    name: "珊瑚专业",
    description: "暖色强调，适合需要一点活力的通用简历。",
    category: ["免费", "社招"],
    tags: ["暖色", "通用"],
    recommendedFor: ["社招", "职能岗位"],
    usageCount: 81054,
    language: "中文简历"
  },
  {
    id: "tealCards",
    name: "青绿卡片",
    description: "卡片式模块分区，适合结构化展示。",
    category: ["免费", "互联网", "产品经理"],
    tags: ["卡片", "产品"],
    recommendedFor: ["产品经理", "互联网"],
    usageCount: 88431,
    language: "中文简历"
  }
];
