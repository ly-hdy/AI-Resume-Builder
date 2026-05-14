export type ResumeSectionKey =
  | "basics"
  | "education"
  | "workExperience"
  | "internships"
  | "projects"
  | "campusExperience"
  | "skills"
  | "awards"
  | "certificates"
  | "otherExperience";

export type ResumeSectionOrderKey = ResumeSectionKey | `custom:${string}`;

export type ResumeTemplateId =
  | "classic"
  | "compact"
  | "accent"
  | "ats"
  | "modern"
  | "executive"
  | "timeline"
  | "roseBanner"
  | "blueCurve"
  | "coralPro"
  | "tealCards"
  | "formalScholar"
  | "internRosePro"
  | "graduateBluePro"
  | "socialTealPro";

export type ResumeFontPoint =
  | "7" | "8" | "9" | "10" | "11" | "12" | "13" | "14" | "15" | "16"
  | "17" | "18" | "19" | "20" | "21" | "22" | "23" | "24" | "25" | "26"
  | "27" | "28" | "29" | "30" | "31" | "32" | "33" | "34" | "35" | "36";

export interface ResumeTheme {
  accentColor: string;
  density: "comfortable" | "compact";
  fontScale: ResumeFontPoint | "sm" | "md" | "lg";
  nameFontScale?: ResumeFontPoint;
  metaFontScale?: ResumeFontPoint;
  headingFontScale?: ResumeFontPoint;
  photoSize?: "48" | "56" | "64" | "72" | "80" | "88" | "96" | "104" | "112" | "120";
  photoOffsetY?: "-24" | "-20" | "-16" | "-12" | "-8" | "-4" | "0" | "4" | "8" | "12" | "16" | "20" | "24";
  contentOffsetY?: "-20" | "-16" | "-12" | "-8" | "-4" | "0" | "4" | "8" | "12";
  fontFamily?:
    | "sans"
    | "serif"
    | "system"
    | "yahei"
    | "dengxian"
    | "heiti"
    | "songti"
    | "huawenSongti"
    | "kaiti"
    | "huawenKaiti"
    | "fangsong";
  pageMargin?: "narrow" | "normal" | "wide" | "5" | "10" | "15" | "20" | "25";
  lineHeight?: "12" | "13" | "14" | "15" | "16" | "17" | "18" | "19" | "20" | "21" | "22" | "23" | "24" | "25" | "26" | "27" | "28";
  headingWeight?: "medium" | "bold" | "black";
  bodyColor?: string;
  headingColor?: string;
}

export interface ResumeEntry {
  id: string;
  title: string;
  organization: string;
  major?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  description: string[];
}

export interface CustomResumeSection {
  id: string;
  title: string;
  entries: ResumeEntry[];
}

export interface ResumeData {
  schemaVersion: "1.0";
  locale: "zh-CN" | "en-US";
  id: string;
  baseResumeId?: string;
  name: string;
  source: "manual" | "upload" | "demo";
  updatedAt: string;
  basics: {
    name: string;
    title: string;
    phone: string;
    email: string;
    location: string;
    politicalStatus?: "中共党员" | "中共预备党员" | "共青团员" | "群众" | "其他" | "";
    website?: string;
    linkedin?: string;
    github?: string;
    summary?: string;
    photoUrl?: string;
  };
  education: ResumeEntry[];
  workExperience: ResumeEntry[];
  internships: ResumeEntry[];
  projects: ResumeEntry[];
  campusExperience: ResumeEntry[];
  skills: string[];
  awards: string[];
  certificates: string[];
  otherExperience: ResumeEntry[];
  customSections: CustomResumeSection[];
  sectionOrder: ResumeSectionOrderKey[];
  hiddenSections: ResumeSectionKey[];
  customSectionTitles?: Partial<Record<ResumeSectionKey, string>>;
  templateId: ResumeTemplateId;
  theme: ResumeTheme;
}
