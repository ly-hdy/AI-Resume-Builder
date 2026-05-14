"use client";

import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Bold,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  Italic,
  LayoutList,
  Plus,
  Save,
  Sparkles,
  Trash2
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RESUME_STORAGE_KEY,
  createEmptyCustomSection,
  createEmptyEntry,
  demoResume,
  editableSections,
  normalizeResume,
  sectionLabels,
  themePresets
} from "@/lib/resume-data";
import { normalizeJd, readStoredJds } from "@/lib/jd-data";
import { resumeTemplateCatalog, type ResumeTemplateCategory } from "@/lib/resume-templates";
import type { JobDescriptionData } from "@/types/jd";
import type { CustomResumeSection, ResumeData, ResumeEntry, ResumeSectionKey, ResumeSectionOrderKey } from "@/types/resume";

type EditorSectionKey = ResumeSectionOrderKey;
type FontTarget = "name" | "meta" | "heading" | "body";

const fontPointOptions = Array.from({ length: 30 }, (_, index) => `${index + 7}`) as Array<
  NonNullable<ResumeData["theme"]["nameFontScale"]>
>;
const A4_PREVIEW_WIDTH_PX = 793.700787;
const A4_PREVIEW_HEIGHT_PX = A4_PREVIEW_WIDTH_PX * 297 / 210;
const PAGE_OVERFLOW_TOLERANCE_PX = 24;

const fontTargetLabels: Record<FontTarget, string> = {
  name: "姓名",
  meta: "联系方式",
  heading: "模块标题",
  body: "正文"
};

const photoSizeOptions: Array<NonNullable<ResumeData["theme"]["photoSize"]>> = [
  "48",
  "56",
  "64",
  "72",
  "80",
  "88",
  "96",
  "104",
  "112",
  "120"
];
const photoOffsetOptions: Array<NonNullable<ResumeData["theme"]["photoOffsetY"]>> = [
  "-24",
  "-20",
  "-16",
  "-12",
  "-8",
  "-4",
  "0",
  "4",
  "8",
  "12",
  "16",
  "20",
  "24"
];
const contentOffsetOptions: Array<NonNullable<ResumeData["theme"]["contentOffsetY"]>> = [
  "-20",
  "-16",
  "-12",
  "-8",
  "-4",
  "0",
  "4",
  "8",
  "12"
];

let activeRichTextEditor: HTMLElement | null = null;
let savedRichTextRange: Range | null = null;

const entrySections: ResumeSectionKey[] = [
  "education",
  "workExperience",
  "internships",
  "projects",
  "campusExperience",
  "otherExperience"
];

const listSections: ResumeSectionKey[] = ["skills", "awards", "certificates"];

const politicalStatusOptions = ["中共党员", "中共预备党员", "共青团员", "群众", "其他"] as const;

const entryFormConfig: Partial<
  Record<
    ResumeSectionKey,
    {
      titleLabel: string;
      titlePlaceholder: string;
      organizationLabel: string;
      organizationPlaceholder: string;
      majorLabel?: string;
      majorPlaceholder?: string;
      locationLabel?: string;
      descriptionLabel: string;
      emptyTitle: string;
    }
  >
> = {
  education: {
    titleLabel: "学位",
    titlePlaceholder: "如：本科、硕士、博士",
    organizationLabel: "学校",
    organizationPlaceholder: "如：某某大学",
    majorLabel: "专业",
    majorPlaceholder: "如：软件工程、工商管理",
    locationLabel: "地点",
    descriptionLabel: "课程 / 成绩 / 荣誉描述，每行一条",
    emptyTitle: "未填写教育经历"
  },
  workExperience: {
    titleLabel: "职位名称",
    titlePlaceholder: "如：产品经理、后端工程师",
    organizationLabel: "公司",
    organizationPlaceholder: "如：某科技公司",
    locationLabel: "地点",
    descriptionLabel: "工作内容 / 业务成果，每行一条",
    emptyTitle: "未填写工作经历"
  },
  internships: {
    titleLabel: "职位名称",
    titlePlaceholder: "如：产品实习生、运营实习生",
    organizationLabel: "公司",
    organizationPlaceholder: "如：某互联网公司",
    locationLabel: "地点",
    descriptionLabel: "实习职责 / 产出成果，每行一条",
    emptyTitle: "未填写实习经历"
  },
  projects: {
    titleLabel: "项目名称",
    titlePlaceholder: "如：JD 匹配分析系统",
    organizationLabel: "角色",
    organizationPlaceholder: "如：项目负责人、产品设计",
    descriptionLabel: "项目背景 / 个人职责 / 项目成果，每行一条",
    emptyTitle: "未填写项目经历"
  },
  campusExperience: {
    titleLabel: "职务 / 角色",
    titlePlaceholder: "如：部长、负责人、成员",
    organizationLabel: "组织 / 社团 / 活动",
    organizationPlaceholder: "如：学生会、新媒体中心",
    locationLabel: "地点",
    descriptionLabel: "组织工作 / 活动成果，每行一条",
    emptyTitle: "未填写校园经历"
  },
  otherExperience: {
    titleLabel: "经历名称",
    titlePlaceholder: "如：社区志愿服务、暑期社会实践",
    organizationLabel: "组织 / 平台",
    organizationPlaceholder: "如：某公益组织、某实践团队",
    locationLabel: "地点",
    descriptionLabel: "经历内容 / 个人贡献 / 成果收获，每行一条",
    emptyTitle: "未填写经历"
  }
};

export function ResumeEditorShell({ resumeId }: { resumeId: string }) {
  const [resume, setResume] = useState<ResumeData>(() => normalizeResume(demoResume));
  const [targetJd, setTargetJd] = useState<JobDescriptionData | null>(null);
  const [activeSection, setActiveSection] = useState<EditorSectionKey>("basics");
  const [saveStatus, setSaveStatus] = useState("尚未保存");
  const [leftWidth, setLeftWidth] = useState(390);
  const [toolbarOpen, setToolbarOpen] = useState(false);
  const [fontTarget, setFontTarget] = useState<FontTarget>("name");
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(1);

  useEffect(() => {
    const raw = window.localStorage.getItem(RESUME_STORAGE_KEY);
    const stored = raw ? (JSON.parse(raw) as ResumeData[]).map(normalizeResume) : [];
    const found = stored.find((item) => item.id === resumeId);
    const nextResume = found ?? normalizeResume(demoResume);
    setResume(nextResume);
    const storedJd = readStoredJds()
      .map((item) => normalizeJd(item, nextResume.id))
      .find((item) => item.resumeId === nextResume.id);
    setTargetJd(storedJd ?? null);
    setSaveStatus(found ? "已载入本地草稿" : "已载入示例简历");
  }, [resumeId]);

  const filledSections = useMemo(
    () => editableSections.filter((section) => isSectionFilled(resume, section)),
    [resume]
  );
  const navigationSections = useMemo(() => getNavigationSections(resume), [resume]);
  const deletedBaseSections = useMemo(
    () => editableSections.filter((section) => section !== "basics" && !navigationSections.includes(section)),
    [navigationSections]
  );
  const activeCustomSection = getCustomSection(resume, activeSection);

  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return;

    function updateScale() {
      const width = container!.clientWidth - 32;
      setPreviewScale(Math.min(1, Math.max(0.45, width / A4_PREVIEW_WIDTH_PX)));
    }

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  function updateResume(next: ResumeData) {
    setResume(next);
    setSaveStatus("有未保存修改");
  }

  function saveResume() {
    const raw = window.localStorage.getItem(RESUME_STORAGE_KEY);
    const stored = raw ? (JSON.parse(raw) as ResumeData[]).map(normalizeResume) : [];
    const nextResume = normalizeResume({
      ...resume,
      name: resume.basics.name ? `${resume.basics.name}的简历` : resume.name,
      updatedAt: new Date().toISOString()
    });
    const next = [nextResume, ...stored.filter((item) => item.id !== nextResume.id)];
    window.localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(next));
    setResume(nextResume);
    setSaveStatus("已保存到本地");
  }

  function moveSection(direction: -1 | 1) {
    const nextOrder = getNavigationSections(resume);
    const currentIndex = nextOrder.indexOf(activeSection);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= nextOrder.length) return;

    const [picked] = nextOrder.splice(currentIndex, 1);
    nextOrder.splice(nextIndex, 0, picked);
    updateResume({ ...resume, sectionOrder: nextOrder });
  }

  function deleteActiveSection() {
    if (activeSection === "basics") return;

    if (isCustomSectionKey(activeSection)) {
      const customSection = getCustomSection(resume, activeSection);
      if (customSection) {
        deleteCustomSection(customSection);
      }
      return;
    }

    const nextOrder = getNavigationSections(resume).filter((section) => section !== activeSection);
    updateResume({
      ...resume,
      [activeSection]: getEmptySectionValue(activeSection),
      sectionOrder: nextOrder
    });
    setActiveSection(nextOrder[0] ?? "basics");
  }

  function addBaseSection(section: ResumeSectionKey) {
    const nextOrder = getNavigationSections(resume);
    if (!nextOrder.includes(section)) {
      nextOrder.push(section);
    }
    updateResume({
      ...resume,
      sectionOrder: nextOrder
    });
    setActiveSection(section);
  }

  function deleteCustomSection(section: CustomResumeSection) {
    const nextCustomSections = resume.customSections.filter((item) => item.id !== section.id);
    const removedSectionKey = toCustomSectionKey(section.id);
    const nextOrder = getNavigationSections(resume).filter((item) => item !== removedSectionKey);
    updateResume({
      ...resume,
      customSections: nextCustomSections,
      sectionOrder: nextOrder
    });
    setActiveSection(nextOrder[0] ?? "basics");
  }

  function addCustomSection() {
    const nextSection = createEmptyCustomSection(`自定义经历 ${resume.customSections.length + 1}`);
    const nextSectionKey = toCustomSectionKey(nextSection.id);
    const nextOrder = getNavigationSections(resume);
    const activeIndex = nextOrder.indexOf(activeSection);
    nextOrder.splice(activeIndex >= 0 ? activeIndex + 1 : nextOrder.length, 0, nextSectionKey);
    updateResume({
      ...resume,
      customSections: [...resume.customSections, nextSection],
      sectionOrder: nextOrder
    });
    setActiveSection(nextSectionKey);
  }

  function applyRichTextCommand(command: "bold" | "italic") {
    const selection = window.getSelection();
    if (!activeRichTextEditor || !savedRichTextRange) return;

    activeRichTextEditor.focus();
    selection?.removeAllRanges();
    selection?.addRange(savedRichTextRange);
    applyRichTextFormat(activeRichTextEditor, command);
    activeRichTextEditor.dispatchEvent(new InputEvent("input", { bubbles: true }));
  }

  function startResize(event: React.PointerEvent<HTMLButtonElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    const startX = event.clientX;
    const startLeft = leftWidth;

    function handlePointerMove(moveEvent: PointerEvent) {
      const delta = moveEvent.clientX - startX;
      setLeftWidth(Math.max(320, Math.min(620, startLeft + delta)));
    }

    function handlePointerUp() {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  }

  const editorContent = (
    <div className="space-y-4 p-4">
      {activeSection === "basics" ? (
        <BasicsForm resume={resume} onChange={updateResume} />
      ) : null}
      {activeCustomSection ? (
        <CustomEntrySectionForm
          resume={resume}
          section={activeCustomSection}
          targetJd={targetJd}
          onChange={updateResume}
          onSelectSection={setActiveSection}
        />
      ) : null}
      {isBaseSection(activeSection) && entrySections.includes(activeSection) ? (
        <EntrySectionForm resume={resume} section={activeSection} targetJd={targetJd} onChange={updateResume} />
      ) : null}
      {isBaseSection(activeSection) && listSections.includes(activeSection) ? (
        <ListSectionForm resume={resume} section={activeSection} onChange={updateResume} />
      ) : null}
    </div>
  );

  return (
    <div
      className="mt-6 grid gap-3"
      style={{ gridTemplateColumns: `${leftWidth}px 8px minmax(520px,1fr)` }}
    >
      <section className="col-span-full rounded-lg border border-slate-700 bg-slate-950 text-slate-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 p-3">
          <Button
            className="border-slate-600 bg-slate-800 text-slate-50 hover:bg-slate-700"
            variant="outline"
            size="sm"
            onClick={() => setActiveSection("basics")}
          >
            智能一页
          </Button>
          <Button
            className="border-slate-600 bg-slate-800 text-slate-50 hover:bg-slate-700"
            variant="outline"
            size="icon"
            style={{ display: "none" }}
            aria-label="模块管理"
            onClick={() => setToolbarOpen((open) => !open)}
          >
            <LayoutList className="h-4 w-4" aria-hidden="true" />
          </Button>
          <select
            className="hidden"
            value=""
            onChange={(event) =>
              updateResume({
                ...resume,
                theme: { ...resume.theme, fontFamily: event.target.value as ResumeData["theme"]["fontFamily"] }
              })
            }
          >
            <option value="system">系统默认</option>
            <option value="sans">微软雅黑</option>
            <option value="serif">宋体</option>
          </select>
          <select
            className="h-9 rounded-md border border-slate-600 bg-slate-800 px-3 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-slate-400"
            value={normalizeFontFamily(resume.theme.fontFamily)}
            onChange={(event) =>
              updateResume({
                ...resume,
                theme: { ...resume.theme, fontFamily: event.target.value as ResumeData["theme"]["fontFamily"] }
              })
            }
          >
            <option value="yahei">微软雅黑</option>
            <option value="dengxian">等线</option>
            <option value="heiti">黑体</option>
            <option value="songti">宋体</option>
            <option value="huawenSongti">华文宋体</option>
            <option value="kaiti">楷体</option>
            <option value="huawenKaiti">华文楷体</option>
            <option value="fangsong">仿宋</option>
          </select>
          <select
            className="h-9 rounded-md border border-slate-600 bg-slate-800 px-3 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-slate-400"
            value={resume.theme.photoOffsetY ?? "0"}
            onChange={(event) =>
              updateResume({
                ...resume,
                theme: { ...resume.theme, photoOffsetY: event.target.value as ResumeData["theme"]["photoOffsetY"] }
              })
            }
          >
            {photoOffsetOptions.map((offset) => (
              <option key={offset} value={offset}>
                照片位置 {Number(offset) > 0 ? `下移 ${offset}` : Number(offset) < 0 ? `上移 ${Math.abs(Number(offset))}` : "默认"}
              </option>
            ))}
          </select>
          <select
            className="hidden"
            value={resume.theme.fontScale}
            onChange={(event) =>
              updateResume({
                ...resume,
                theme: { ...resume.theme, fontScale: event.target.value as ResumeData["theme"]["fontScale"] }
              })
            }
          >
            {["7", "8", "9", "10", "11", "12", "13", "14", "15", "16"].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <select
            className="h-9 rounded-md border border-slate-600 bg-slate-800 px-3 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-slate-400"
            value={fontTarget}
            onChange={(event) => setFontTarget(event.target.value as FontTarget)}
            aria-label="选择要调整字号的文字"
          >
            {Object.entries(fontTargetLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            className="h-9 rounded-md border border-slate-600 bg-slate-800 px-3 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-slate-400"
            value={getFontTargetSize(resume, fontTarget)}
            onChange={(event) => updateResume(applyFontTargetSize(resume, fontTarget, event.target.value))}
            aria-label="调整选中文字字号"
          >
            {fontPointOptions.map((size) => (
              <option key={size} value={size}>
                字号 {size}
              </option>
            ))}
          </select>
          <Button
            className="border-slate-600 bg-slate-800 text-slate-50 hover:bg-slate-700"
            variant="outline"
            size="icon"
            aria-label="加粗选中文字"
            onMouseDown={(event) => {
              event.preventDefault();
              applyRichTextCommand("bold");
            }}
          >
            <Bold className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            className="border-slate-600 bg-slate-800 text-slate-50 hover:bg-slate-700"
            variant="outline"
            size="icon"
            aria-label="倾斜选中文字"
            onMouseDown={(event) => {
              event.preventDefault();
              applyRichTextCommand("italic");
            }}
          >
            <Italic className="h-4 w-4" aria-hidden="true" />
          </Button>
          <select
            className="hidden"
            value={resume.theme.density}
            onChange={(event) =>
              updateResume({
                ...resume,
                theme: { ...resume.theme, density: event.target.value as ResumeData["theme"]["density"] }
              })
            }
          >
            <option value="comfortable">舒展</option>
            <option value="compact">紧凑</option>
          </select>
          <select
            className="h-9 rounded-md border border-slate-600 bg-slate-800 px-3 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-slate-400"
            value={resume.theme.lineHeight ?? "18"}
            onChange={(event) =>
              updateResume({
                ...resume,
                theme: { ...resume.theme, lineHeight: event.target.value as ResumeData["theme"]["lineHeight"] }
              })
            }
          >
            {Array.from({ length: 17 }, (_, index) => `${index + 12}`).map((height) => (
              <option key={height} value={height}>
                行距 {height}
              </option>
            ))}
          </select>
          <select
            className="h-9 rounded-md border border-slate-600 bg-slate-800 px-3 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-slate-400"
            value={resume.theme.photoSize ?? "80"}
            onChange={(event) =>
              updateResume({
                ...resume,
                theme: { ...resume.theme, photoSize: event.target.value as ResumeData["theme"]["photoSize"] }
              })
            }
          >
            {photoSizeOptions.map((size) => (
              <option key={size} value={size}>
                证件照 {size}
              </option>
            ))}
          </select>
          <select
            className="hidden"
            value=""
            onChange={(event) =>
              updateResume({
                ...resume,
                theme: { ...resume.theme, pageMargin: event.target.value as ResumeData["theme"]["pageMargin"] }
              })
            }
          >
            <option value="narrow">窄边距</option>
            <option value="normal">标准边距</option>
            <option value="wide">宽边距</option>
          </select>
          <select
            className="h-9 rounded-md border border-slate-600 bg-slate-800 px-3 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-slate-400"
            value={normalizePageMargin(resume.theme.pageMargin)}
            onChange={(event) =>
              updateResume({
                ...resume,
                theme: { ...resume.theme, pageMargin: event.target.value as ResumeData["theme"]["pageMargin"] }
              })
            }
          >
            {["5", "10", "15", "20", "25"].map((margin) => (
              <option key={margin} value={margin}>
                页边距 {margin}
              </option>
            ))}
          </select>
          <select
            className="h-9 rounded-md border border-slate-600 bg-slate-800 px-3 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-slate-400"
            value={resume.theme.contentOffsetY ?? "0"}
            onChange={(event) =>
              updateResume({
                ...resume,
                theme: { ...resume.theme, contentOffsetY: event.target.value as ResumeData["theme"]["contentOffsetY"] }
              })
            }
          >
            {contentOffsetOptions.map((offset) => (
              <option key={offset} value={offset}>
                正文 {formatContentOffsetLabel(offset)}
              </option>
            ))}
          </select>
          <select
            className="h-9 rounded-md border border-slate-600 bg-slate-800 px-3 text-sm text-slate-50 outline-none focus:ring-2 focus:ring-slate-400"
            value={resume.theme.headingWeight ?? "bold"}
            onChange={(event) =>
              updateResume({
                ...resume,
                theme: { ...resume.theme, headingWeight: event.target.value as ResumeData["theme"]["headingWeight"] }
              })
            }
          >
            <option value="medium">标题中等</option>
            <option value="bold">标题加粗</option>
            <option value="black">标题特粗</option>
          </select>
          <label className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-600 bg-slate-800 px-3 text-sm text-slate-50">
            正文色
            <input
              className="h-5 w-8 cursor-pointer rounded border border-slate-500 bg-transparent p-0"
              type="color"
              value={resume.theme.bodyColor ?? "#000000"}
              onChange={(event) =>
                updateResume({
                  ...resume,
                  theme: { ...resume.theme, bodyColor: event.target.value }
                })
              }
            />
          </label>
          <label className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-600 bg-slate-800 px-3 text-sm text-slate-50">
            标题色
            <input
              className="h-5 w-8 cursor-pointer rounded border border-slate-500 bg-transparent p-0"
              type="color"
              value={resume.theme.headingColor ?? resume.theme.bodyColor ?? "#000000"}
              onChange={(event) =>
                updateResume({
                  ...resume,
                  theme: { ...resume.theme, headingColor: event.target.value }
                })
              }
            />
          </label>
          <Button
            className="border-slate-600 bg-slate-800 text-slate-50 hover:bg-slate-700"
            variant="outline"
            size="sm"
            onClick={() => setToolbarOpen((open) => !open)}
          >
            模块管理
            {toolbarOpen ? (
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </div>
        {toolbarOpen ? (
          <div className="grid gap-3 border-t border-slate-800 p-3 lg:grid-cols-[1fr_auto]">
            <div className="space-y-3">
            <nav className="flex flex-wrap gap-2">
              {navigationSections.map((section) => (
                <button
                  key={section}
                  className={`inline-flex h-8 items-center gap-2 rounded-md px-3 text-xs transition-colors ${
                    activeSection === section ? "bg-teal-600 text-white" : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                  }`}
                  onClick={() => setActiveSection(section)}
                >
                  <span>{getSectionLabel(resume, section)}</span>
                  {isCustomSectionKey(section)
                    ? isCustomSectionFilled(resume, section) ? <span className="text-[10px] opacity-80">已填</span> : null
                    : filledSections.includes(section) ? <span className="text-[10px] opacity-80">已填</span> : null}
                </button>
              ))}
              <button
                className="inline-flex h-8 items-center gap-2 rounded-md border border-slate-600 px-3 text-xs text-slate-100 hover:bg-slate-800"
                onClick={addCustomSection}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                新增自定义经历
              </button>
            </nav>
            <div className="flex flex-wrap gap-2">
              {deletedBaseSections.map((section) => (
                <button
                  key={section}
                  className="inline-flex h-8 items-center gap-2 rounded-md border border-slate-600 px-3 text-xs text-slate-100 hover:bg-slate-800"
                  onClick={() => addBaseSection(section)}
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  添加{getSectionLabel(resume, section)}
                </button>
              ))}
            </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {themePresets.map((color) => (
                <button
                  key={color}
                  aria-label={`选择主题色 ${color}`}
                  className={`h-7 w-7 rounded-md border-2 ${
                    resume.theme.accentColor === color ? "border-white" : "border-slate-700"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => updateResume({ ...resume, theme: { ...resume.theme, accentColor: color } })}
                />
              ))}
            </div>
          </div>
        ) : null}
      </section>
      <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
        <section className="hidden">
          <div className="px-2 py-2 text-xs font-medium text-muted-foreground">
            简历模块
          </div>
          <nav className="grid grid-cols-2 gap-1">
            {navigationSections.map((section) => (
              <button
                key={section}
                className={`flex min-h-9 items-center justify-between rounded-md px-2 py-2 text-left text-xs hover:bg-muted ${
                  activeSection === section ? "bg-muted font-medium" : ""
                }`}
                onClick={() => setActiveSection(section)}
              >
                <span className="truncate">{getSectionLabel(resume, section)}</span>
                {isCustomSectionKey(section)
                  ? isCustomSectionFilled(resume, section) ? <Badge>已填</Badge> : null
                  : filledSections.includes(section) ? <Badge>已填</Badge> : null}
              </button>
            ))}
          </nav>
          <Button className="mt-3 w-full" variant="outline" size="sm" onClick={addCustomSection}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            新增自定义经历
          </Button>
        </section>

        <section className="rounded-lg border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-2 p-4">
          <div>
            <h2 className="text-base font-semibold">{getSectionLabel(resume, activeSection)}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{saveStatus}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" aria-label="上移模块" onClick={() => moveSection(-1)}>
              <ArrowUp className="h-4 w-4" aria-hidden="true" />
              上移
            </Button>
            <Button variant="outline" size="sm" aria-label="下移模块" onClick={() => moveSection(1)}>
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
              下移
            </Button>
            <Button variant="outline" size="sm">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              AI 优化
            </Button>
            {activeSection !== "basics" ? (
              <Button variant="outline" size="sm" onClick={deleteActiveSection}>
                {false ? (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                )}
                删除模块
              </Button>
            ) : null}
            <Button size="sm" onClick={saveResume}>
              <Save className="h-4 w-4" aria-hidden="true" />
              保存
            </Button>
          </div>
        </div>
        {editorContent}
      </section>
      </aside>

      <button
        className="hidden cursor-col-resize rounded-md bg-border/60 transition-colors hover:bg-primary/50 xl:block"
        aria-label="调整编辑区宽度"
        onPointerDown={startResize}
      />

      <main className="min-w-0 rounded-lg border bg-card p-4 xl:sticky xl:top-4 xl:self-start">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold">A4 预览</h2>
            <p className="mt-1 text-xs text-muted-foreground">编辑内容会实时同步到这里</p>
          </div>
          <Button asChild variant="outline" size="icon" aria-label="打开预览">
            <Link href={`/resumes/${resume.id}/preview`}>
              <Eye className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <div ref={previewContainerRef} className="resume-preview-workbench overflow-auto rounded-md bg-muted p-4">
          <div
            className="mx-auto"
            style={{
              width: A4_PREVIEW_WIDTH_PX * previewScale,
              minHeight: A4_PREVIEW_HEIGHT_PX * previewScale
            }}
          >
            <div style={{ width: "210mm", zoom: previewScale } as CSSProperties}>
              <ResumePreview resume={resume} />
            </div>
          </div>
        </div>
      </main>

      <button
        className="hidden"
        aria-label="调整模板区宽度"
        onPointerDown={startResize}
      />

      <aside className="hidden">
        <TemplatePanel resume={resume} onChange={updateResume} />
      </aside>
    </div>
  );
}

function TemplatePanel({
  resume,
  onChange
}: {
  resume: ResumeData;
  onChange: (resume: ResumeData) => void;
}) {
  const [activeCategory, setActiveCategory] = useState<ResumeTemplateCategory>("热门");
  const [selectedTemplateId, setSelectedTemplateId] = useState<ResumeData["templateId"]>(resume.templateId);
  const selectedTemplate =
    resumeTemplateCatalog.find((template) => template.id === selectedTemplateId) ?? resumeTemplateCatalog[0];
  const categories: ResumeTemplateCategory[] = ["热门", "免费", "应届生", "实习生", "社招", "校招", "互联网", "产品经理", "学术"];
  const visibleTemplates = resumeTemplateCatalog.filter((template) => template.category.includes(activeCategory));

  return (
    <section className="rounded-lg border bg-card p-4">
      <h2 className="text-base font-semibold">模板市场</h2>
      <div className="mt-4 grid gap-4">
        <div>
          <div className="mb-2 flex flex-wrap gap-1">
            {categories.map((category) => (
              <button
                key={category}
                className={`shrink-0 rounded-md px-2 py-1 text-xs ${
                  activeCategory === category ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-2">
            {visibleTemplates.map((template) => (
              <button
                key={template.id}
                className={`flex h-[190px] flex-col overflow-hidden rounded-md border bg-background p-2 text-left transition-colors hover:bg-muted ${
                  selectedTemplateId === template.id ? "border-primary ring-2 ring-ring" : "border-border"
                }`}
                onClick={() => setSelectedTemplateId(template.id)}
              >
                <TemplateThumb templateId={template.id} />
                <div className="mt-2 flex min-h-10 items-start justify-between gap-2">
                  <div className="min-w-0 text-xs font-medium leading-5">{template.name}</div>
                  {template.isHighFidelity ? <Badge className="shrink-0">高保真</Badge> : null}
                </div>
                <div className="mt-auto pt-2 text-xs text-muted-foreground">{template.usageCount.toLocaleString()} 人使用</div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-md border bg-background p-3">
          <div className="text-sm font-medium">{selectedTemplate.name}</div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{selectedTemplate.description}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {selectedTemplate.tags.map((tag) => (
              <span key={tag} className="rounded-sm bg-muted px-1.5 py-1 text-xs text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
          <Button
            className="mt-3 w-full"
            size="sm"
            onClick={() => onChange({ ...resume, templateId: selectedTemplate.id })}
          >
            应用模板
          </Button>
        </div>

        <div>
          <div className="mb-2 text-xs text-muted-foreground">主题色</div>
          <div className="flex flex-wrap gap-2">
            {themePresets.map((color) => (
              <button
                key={color}
                aria-label={`选择主题色 ${color}`}
                className={`h-8 w-8 rounded-full border-2 ${
                  resume.theme.accentColor === color ? "border-foreground" : "border-transparent"
                }`}
                style={{ backgroundColor: color }}
                onClick={() =>
                  onChange({
                    ...resume,
                    theme: { ...resume.theme, accentColor: color }
                  })
                }
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">密度</span>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              value={resume.theme.density}
              onChange={(event) =>
                onChange({
                  ...resume,
                  theme: {
                    ...resume.theme,
                    density: event.target.value as ResumeData["theme"]["density"]
                  }
                })
              }
            >
              <option value="comfortable">舒展</option>
              <option value="compact">紧凑</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">字号</span>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              value={resume.theme.fontScale}
              onChange={(event) =>
                onChange({
                  ...resume,
                  theme: {
                    ...resume.theme,
                    fontScale: event.target.value as ResumeData["theme"]["fontScale"]
                  }
                })
              }
            >
              <option value="7">7 pt</option>
              <option value="8">8 pt</option>
              <option value="9">9 pt</option>
              <option value="10">10 pt</option>
              <option value="11">11 pt</option>
              <option value="12">12 pt</option>
              <option value="13">13 pt</option>
              <option value="14">14 pt</option>
              <option value="15">15 pt</option>
              <option value="16">16 pt</option>
            </select>
          </label>
        </div>

        <div className="grid gap-3 border-t pt-3">
          <div className="text-xs font-medium text-muted-foreground">排版设置</div>
          <label className="text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">字体</span>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              value={normalizeFontFamily(resume.theme.fontFamily)}
              onChange={(event) =>
                onChange({
                  ...resume,
                  theme: {
                    ...resume.theme,
                    fontFamily: event.target.value as ResumeData["theme"]["fontFamily"]
                  }
                })
              }
            >
              <option value="system">系统默认</option>
              <option value="yahei">微软雅黑</option>
              <option value="dengxian">等线</option>
              <option value="heiti">黑体</option>
              <option value="songti">宋体</option>
              <option value="huawenSongti">华文宋体</option>
              <option value="kaiti">楷体</option>
              <option value="huawenKaiti">华文楷体</option>
              <option value="fangsong">仿宋</option>
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">页边距</span>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              value={resume.theme.pageMargin ?? "normal"}
              onChange={(event) =>
                onChange({
                  ...resume,
                  theme: {
                    ...resume.theme,
                    pageMargin: event.target.value as ResumeData["theme"]["pageMargin"]
                  }
                })
              }
            >
              <option value="narrow">窄</option>
              <option value="normal">标准</option>
              <option value="wide">宽</option>
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">正文位置</span>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              value={resume.theme.contentOffsetY ?? "0"}
              onChange={(event) =>
                onChange({
                  ...resume,
                  theme: {
                    ...resume.theme,
                    contentOffsetY: event.target.value as ResumeData["theme"]["contentOffsetY"]
                  }
                })
              }
            >
              {contentOffsetOptions.map((offset) => (
                <option key={offset} value={offset}>
                  {formatContentOffsetLabel(offset)}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">标题粗细</span>
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              value={resume.theme.headingWeight ?? "bold"}
              onChange={(event) =>
                onChange({
                  ...resume,
                  theme: {
                    ...resume.theme,
                    headingWeight: event.target.value as ResumeData["theme"]["headingWeight"]
                  }
                })
              }
            >
              <option value="medium">中等</option>
              <option value="bold">加粗</option>
              <option value="black">特粗</option>
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">正文字色</span>
            <input
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              type="color"
              value={resume.theme.bodyColor ?? "#000000"}
              onChange={(event) =>
                onChange({
                  ...resume,
                  theme: {
                    ...resume.theme,
                    bodyColor: event.target.value
                  }
                })
              }
            />
          </label>
        </div>
      </div>
    </section>
  );
}

function TemplateThumb({ templateId }: { templateId: ResumeData["templateId"] }) {
  const style = getTemplateVisual(templateId);

  return (
    <div className="h-[104px] shrink-0 overflow-hidden rounded-sm border bg-white">
      <div className="h-5" style={{ background: style.header }} />
      <div className="space-y-1 p-2">
        <div className="h-1.5 w-16 rounded-full" style={{ backgroundColor: style.accent }} />
        <div className="h-1 w-full rounded-full bg-slate-200" />
        <div className="h-1 w-10/12 rounded-full bg-slate-200" />
        <div className="mt-2 grid grid-cols-[1fr_34%] gap-2">
          <div className="space-y-1">
            <div className="h-1 w-full rounded-full bg-slate-200" />
            <div className="h-1 w-11/12 rounded-full bg-slate-200" />
            <div className="h-1 w-9/12 rounded-full bg-slate-200" />
          </div>
          <div className="space-y-1 rounded-sm p-1" style={{ backgroundColor: style.soft }}>
            <div className="h-1 w-full rounded-full bg-white" />
            <div className="h-1 w-4/5 rounded-full bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

function BasicsForm({
  resume,
  onChange
}: {
  resume: ResumeData;
  onChange: (resume: ResumeData) => void;
}) {
  const fields: Array<[keyof ResumeData["basics"], string]> = [
    ["name", "姓名"],
    ["title", "目标职位"],
    ["phone", "手机号"],
    ["email", "邮箱"],
    ["location", "城市"],
    ["website", "个人网站"],
    ["github", "GitHub"],
    ["linkedin", "LinkedIn"]
  ];

  function uploadPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      onChange({
        ...resume,
        basics: { ...resume.basics, photoUrl: String(reader.result ?? "") }
      });
    };
    reader.readAsDataURL(file);
  }

  return (
    <>
      <div className="rounded-md border bg-background p-3">
        <div className="mb-3 text-xs text-muted-foreground">证件照</div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-24 w-20 items-center justify-center overflow-hidden rounded-md border bg-muted text-sm text-muted-foreground">
            {resume.basics.photoUrl ? (
              <img className="h-full w-full object-cover" src={resume.basics.photoUrl} alt="证件照" />
            ) : (
              "照片"
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex h-9 cursor-pointer items-center rounded-md border bg-card px-3 text-sm hover:bg-muted">
              上传证件照
              <input className="sr-only" type="file" accept="image/*" onChange={uploadPhoto} />
            </label>
            {resume.basics.photoUrl ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onChange({ ...resume, basics: { ...resume.basics, photoUrl: "" } })}
              >
                删除照片
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {fields.map(([key, label]) => (
          <label key={key} className="text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
            <input
              className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              value={resume.basics[key] ?? ""}
              onChange={(event) =>
                onChange({
                  ...resume,
                  basics: { ...resume.basics, [key]: event.target.value }
                })
              }
            />
          </label>
        ))}
      </div>
      <div className="rounded-md border bg-background p-3">
        <div className="mb-3 text-xs text-muted-foreground">政治面貌</div>
        <div className="flex flex-wrap gap-2">
          {politicalStatusOptions.map((option) => (
            <label
              key={option}
              className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm transition-colors ${
                resume.basics.politicalStatus === option
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-muted"
              }`}
            >
              <input
                className="sr-only"
                type="radio"
                name="politicalStatus"
                value={option}
                checked={resume.basics.politicalStatus === option}
                onChange={() =>
                  onChange({
                    ...resume,
                    basics: { ...resume.basics, politicalStatus: option }
                  })
                }
              />
              {option}
            </label>
          ))}
        </div>
      </div>
      <label className="hidden">
        <span className="mb-1 block text-xs text-muted-foreground">个人总结</span>
        <textarea
          className="min-h-28 w-full rounded-md border bg-background px-3 py-2 text-sm leading-6 outline-none focus:ring-2 focus:ring-ring"
          value={resume.basics.summary ?? ""}
          onChange={(event) =>
            onChange({
              ...resume,
              basics: { ...resume.basics, summary: event.target.value }
            })
          }
        />
      </label>
    </>
  );
}

function EntrySectionForm({
  resume,
  section,
  targetJd,
  onChange
}: {
  resume: ResumeData;
  section: ResumeSectionKey;
  targetJd: JobDescriptionData | null;
  onChange: (resume: ResumeData) => void;
}) {
  const entries = resume[section] as ResumeEntry[];
  const config = entryFormConfig[section] ?? entryFormConfig.otherExperience!;
  const [optimizingEntries, setOptimizingEntries] = useState<Record<string, boolean>>({});
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, ResumeEntry>>({});
  const [aiMessages, setAiMessages] = useState<Record<string, string>>({});

  function updateEntry(entryId: string, nextEntry: ResumeEntry) {
    onChange({
      ...resume,
      [section]: entries.map((entry) => (entry.id === entryId ? nextEntry : entry))
    });
  }

  function removeEntry(entryId: string) {
    onChange({
      ...resume,
      [section]: entries.filter((entry) => entry.id !== entryId)
    });
  }

  async function optimizeEntry(entry: ResumeEntry) {
    if (optimizingEntries[entry.id]) return;

    setOptimizingEntries((current) => ({ ...current, [entry.id]: true }));
    setAiMessages((current) => ({ ...current, [entry.id]: "" }));

    try {
      const optimizedEntry = await optimizeEntryWithAi(entry, getSectionLabel(resume, section), resume, targetJd);
      setAiSuggestions((current) => ({ ...current, [entry.id]: optimizedEntry }));
      setAiMessages((current) => ({ ...current, [entry.id]: "AI 已生成建议稿，原文还没有被替换。" }));
    } catch (error) {
      setAiMessages((current) => ({
        ...current,
        [entry.id]: error instanceof Error ? error.message : "AI 优化失败，请稍后重试。"
      }));
    } finally {
      setOptimizingEntries((current) => ({ ...current, [entry.id]: false }));
    }
  }

  return (
    <div className="space-y-4">
      {section === "otherExperience" ? (
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-muted-foreground">自定义模块名称</span>
          <input
            className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="如：志愿服务经历、社会实践经历、科研经历"
            value={getSectionLabel(resume, "otherExperience")}
            onChange={(event) =>
              onChange({
                ...resume,
                customSectionTitles: {
                  ...resume.customSectionTitles,
                  otherExperience: event.target.value
                }
              })
            }
          />
        </label>
      ) : null}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange({ ...resume, [section]: [...entries, createEmptyEntry()] })}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        新增{getSectionLabel(resume, section)}
      </Button>

      {entries.length === 0 ? (
        <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          这里还没有内容，可以点击上方按钮新增一条经历。
        </p>
      ) : null}

      {entries.map((entry) => (
        <div key={entry.id} className="rounded-md border p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">{formatEntryHeading(entry, section, config.emptyTitle)}</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => optimizeEntry(entry)}
                disabled={Boolean(optimizingEntries[entry.id])}
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                {optimizingEntries[entry.id] ? "优化中" : "AI 优化"}
              </Button>
              <Button variant="ghost" size="icon" aria-label="删除经历" onClick={() => removeEntry(entry.id)}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <TextInput
              label={config.titleLabel}
              placeholder={config.titlePlaceholder}
              value={entry.title}
              onChange={(value) => updateEntry(entry.id, { ...entry, title: value })}
            />
            <TextInput
              label={config.organizationLabel}
              placeholder={config.organizationPlaceholder}
              value={entry.organization}
              onChange={(value) => updateEntry(entry.id, { ...entry, organization: value })}
            />
            {config.majorLabel ? (
              <TextInput
                label={config.majorLabel}
                placeholder={config.majorPlaceholder}
                value={entry.major ?? ""}
                onChange={(value) => updateEntry(entry.id, { ...entry, major: value })}
              />
            ) : null}
            {config.locationLabel ? (
              <TextInput
                label={config.locationLabel}
                value={entry.location ?? ""}
                onChange={(value) => updateEntry(entry.id, { ...entry, location: value })}
              />
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <TextInput label="开始时间" value={entry.startDate ?? ""} onChange={(value) => updateEntry(entry.id, { ...entry, startDate: value })} />
              <TextInput label="结束时间" value={entry.endDate ?? ""} onChange={(value) => updateEntry(entry.id, { ...entry, endDate: value })} />
            </div>
          </div>
          <RichTextDescriptionEditor
            label={config.descriptionLabel}
            value={entry.description}
            onChange={(description) => updateEntry(entry.id, { ...entry, description })}
          />
          <AiSuggestionPanel
            suggestion={aiSuggestions[entry.id]}
            message={aiMessages[entry.id]}
            isLoading={Boolean(optimizingEntries[entry.id])}
            onApply={() => {
              const suggestion = aiSuggestions[entry.id];
              if (!suggestion) return;
              updateEntry(entry.id, suggestion);
              setAiMessages((current) => ({ ...current, [entry.id]: "已应用整条 AI 建议。" }));
            }}
            onCopy={() => copyEntrySuggestion(aiSuggestions[entry.id])}
          />
        </div>
      ))}
    </div>
  );
}

function CustomEntrySectionForm({
  resume,
  section,
  targetJd,
  onChange,
  onSelectSection
}: {
  resume: ResumeData;
  section: CustomResumeSection;
  targetJd: JobDescriptionData | null;
  onChange: (resume: ResumeData) => void;
  onSelectSection: (section: EditorSectionKey) => void;
}) {
  const config = entryFormConfig.otherExperience!;
  const [optimizingEntries, setOptimizingEntries] = useState<Record<string, boolean>>({});
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, ResumeEntry>>({});
  const [aiMessages, setAiMessages] = useState<Record<string, string>>({});

  function updateSection(nextSection: CustomResumeSection) {
    onChange({
      ...resume,
      customSections: resume.customSections.map((item) =>
        item.id === section.id ? nextSection : item
      )
    });
  }

  function updateEntry(entryId: string, nextEntry: ResumeEntry) {
    updateSection({
      ...section,
      entries: section.entries.map((entry) => (entry.id === entryId ? nextEntry : entry))
    });
  }

  function removeEntry(entryId: string) {
    updateSection({
      ...section,
      entries: section.entries.filter((entry) => entry.id !== entryId)
    });
  }

  async function optimizeEntry(entry: ResumeEntry) {
    if (optimizingEntries[entry.id]) return;

    setOptimizingEntries((current) => ({ ...current, [entry.id]: true }));
    setAiMessages((current) => ({ ...current, [entry.id]: "" }));

    try {
      const optimizedEntry = await optimizeEntryWithAi(entry, section.title || "自定义经历", resume, targetJd);
      setAiSuggestions((current) => ({ ...current, [entry.id]: optimizedEntry }));
      setAiMessages((current) => ({ ...current, [entry.id]: "AI 已生成建议稿，原文还没有被替换。" }));
    } catch (error) {
      setAiMessages((current) => ({
        ...current,
        [entry.id]: error instanceof Error ? error.message : "AI 优化失败，请稍后重试。"
      }));
    } finally {
      setOptimizingEntries((current) => ({ ...current, [entry.id]: false }));
    }
  }

  function removeSection() {
    const nextCustomSections = resume.customSections.filter((item) => item.id !== section.id);
    const removedSectionKey = toCustomSectionKey(section.id);
    const nextOrder = getNavigationSections(resume).filter((item) => item !== removedSectionKey);
    onChange({
      ...resume,
      customSections: nextCustomSections,
      sectionOrder: nextOrder
    });
    onSelectSection(nextOrder[0] ?? "basics");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-background p-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-0 flex-1 text-sm">
            <span className="mb-1 block text-xs text-muted-foreground">自定义经历模块名称</span>
            <input
              className="h-10 w-full rounded-md border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="如：志愿经历、社会实践、科研经历"
              value={section.title}
              onChange={(event) => updateSection({ ...section, title: event.target.value })}
            />
          </label>
          <Button variant="outline" size="sm" onClick={removeSection}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            删除模块
          </Button>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => updateSection({ ...section, entries: [...section.entries, createEmptyEntry()] })}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        新增{section.title || "自定义经历"}
      </Button>

      {section.entries.length === 0 ? (
        <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          这里还没有内容，可以点击上方按钮新增一条经历。
        </p>
      ) : null}

      {section.entries.map((entry) => (
        <div key={entry.id} className="rounded-md border p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">{formatEntryHeading(entry, "otherExperience", config.emptyTitle)}</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => optimizeEntry(entry)}
                disabled={Boolean(optimizingEntries[entry.id])}
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                {optimizingEntries[entry.id] ? "优化中" : "AI 优化"}
              </Button>
              <Button variant="ghost" size="icon" aria-label="删除经历" onClick={() => removeEntry(entry.id)}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <TextInput
              label={config.titleLabel}
              placeholder={config.titlePlaceholder}
              value={entry.title}
              onChange={(value) => updateEntry(entry.id, { ...entry, title: value })}
            />
            <TextInput
              label={config.organizationLabel}
              placeholder={config.organizationPlaceholder}
              value={entry.organization}
              onChange={(value) => updateEntry(entry.id, { ...entry, organization: value })}
            />
            <TextInput
              label={config.locationLabel ?? "地点"}
              value={entry.location ?? ""}
              onChange={(value) => updateEntry(entry.id, { ...entry, location: value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <TextInput label="开始时间" value={entry.startDate ?? ""} onChange={(value) => updateEntry(entry.id, { ...entry, startDate: value })} />
              <TextInput label="结束时间" value={entry.endDate ?? ""} onChange={(value) => updateEntry(entry.id, { ...entry, endDate: value })} />
            </div>
          </div>
          <RichTextDescriptionEditor
            label={config.descriptionLabel}
            value={entry.description}
            onChange={(description) => updateEntry(entry.id, { ...entry, description })}
          />
          <AiSuggestionPanel
            suggestion={aiSuggestions[entry.id]}
            message={aiMessages[entry.id]}
            isLoading={Boolean(optimizingEntries[entry.id])}
            onApply={() => {
              const suggestion = aiSuggestions[entry.id];
              if (!suggestion) return;
              updateEntry(entry.id, suggestion);
              setAiMessages((current) => ({ ...current, [entry.id]: "已应用整条 AI 建议。" }));
            }}
            onCopy={() => copyEntrySuggestion(aiSuggestions[entry.id])}
          />
        </div>
      ))}
    </div>
  );
}

function ListSectionForm({
  resume,
  section,
  onChange
}: {
  resume: ResumeData;
  section: ResumeSectionKey;
  onChange: (resume: ResumeData) => void;
}) {
  const values = resume[section] as string[];

  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs text-muted-foreground">
        {sectionLabels[section]}，每行一项
      </span>
      <textarea
        className="min-h-64 w-full rounded-md border bg-background px-3 py-2 text-sm leading-6 outline-none focus:ring-2 focus:ring-ring"
        value={values.join("\n")}
        onChange={(event) =>
          onChange({
            ...resume,
            [section]: event.target.value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
          })
        }
      />
    </label>
  );
}

function TextInput({
  label,
  placeholder,
  value,
  onChange
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm">
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      <input
        className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function RichTextDescriptionEditor({
  label,
  value,
  onChange
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const nextHtml = descriptionLinesToHtml(trimEmptyDescriptionLines(value));
    if (document.activeElement !== editor && editor.innerHTML !== nextHtml) {
      editor.innerHTML = nextHtml;
    }
  }, [value]);

  function saveSelection() {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection?.rangeCount) return;

    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;

    activeRichTextEditor = editor;
    savedRichTextRange = range.cloneRange();
  }

  function normalizeEditorContent() {
    const editor = editorRef.current;
    if (!editor) return;
    const nextHtml = descriptionLinesToHtml(richTextHtmlToDescriptionLines(editor.innerHTML));
    if (editor.innerHTML !== nextHtml) {
      editor.innerHTML = nextHtml;
    }
  }

  function syncValue() {
    const editor = editorRef.current;
    if (!editor) return;
    saveSelection();
    onChange(trimEmptyDescriptionLines(richTextHtmlToDescriptionLines(editor.innerHTML)));
  }

  function applyCommand(command: "bold" | "italic") {
    const editor = editorRef.current;
    if (!editor || !savedRichTextRange) return;
    editor.focus();
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(savedRichTextRange);
    applyRichTextFormat(editor, command);
    syncValue();
  }

  function applyFontSize(size: string) {
    editorRef.current?.focus();
    if (savedRichTextRange) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(savedRichTextRange);
    }
    document.execCommand("fontSize", false, "7");
    const editor = editorRef.current;
    if (!editor) return;
    editor.querySelectorAll("font[size='7']").forEach((node) => {
      const span = document.createElement("span");
      span.style.fontSize = `${size}pt`;
      span.dataset.resumeFontSize = size;
      span.innerHTML = node.innerHTML;
      node.replaceWith(span);
    });
    syncValue();
  }

  return (
    <label className="mt-3 block text-sm">
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      <div className="mb-2 flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => applyCommand("bold")}>
          <Bold className="h-4 w-4" aria-hidden="true" />
          加粗
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => applyCommand("italic")}>
          <Italic className="h-4 w-4" aria-hidden="true" />
          倾斜
        </Button>
        <select
          className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          defaultValue=""
          onChange={(event) => {
            if (!event.target.value) return;
            applyFontSize(event.target.value);
            event.target.value = "";
          }}
        >
          <option value="">选中文字字号</option>
          {["9", "10", "11", "12", "13", "14", "15", "16", "18", "20"].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
      <div
        ref={editorRef}
        data-rich-text-editor="true"
        className="min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm leading-6 outline-none focus:ring-2 focus:ring-ring"
        contentEditable
        suppressContentEditableWarning
        onFocus={() => {
          normalizeEditorContent();
          saveSelection();
        }}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        onInput={syncValue}
        onBlur={() => {
          normalizeEditorContent();
          syncValue();
        }}
      />
    </label>
  );
}

function descriptionLinesToHtml(lines: string[]) {
  const trimmedLines = trimEmptyDescriptionLines(lines);
  return trimmedLines.length
    ? trimmedLines.map((line) => `<div>${sanitizeRichTextHtml(line) || "<br>"}</div>`).join("")
    : "";
}

function applyRichTextFormat(editor: HTMLElement, command: "bold" | "italic") {
  const selection = window.getSelection();
  if (!selection?.rangeCount) return;

  const range = selection.getRangeAt(0);
  if (range.collapsed || !editor.contains(range.commonAncestorContainer)) return;

  const wrapper = document.createElement(command === "bold" ? "strong" : "em");
  wrapper.dataset.resumeFormat = command;
  wrapper.appendChild(range.extractContents());
  range.insertNode(wrapper);

  const nextRange = document.createRange();
  nextRange.selectNodeContents(wrapper);
  selection.removeAllRanges();
  selection.addRange(nextRange);
  savedRichTextRange = nextRange.cloneRange();
  activeRichTextEditor = editor;
}

function richTextHtmlToDescriptionLines(html: string) {
  const normalized = html
    .replace(/<\/div><div>/gi, "\n")
    .replace(/<\/p><p>/gi, "\n")
    .replace(/<\/li><li>/gi, "\n")
    .replace(/<div>/gi, "\n")
    .replace(/<\/div>/gi, "")
    .replace(/<p>/gi, "\n")
    .replace(/<\/p>/gi, "")
    .replace(/<li>/gi, "\n")
    .replace(/<\/li>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n");

  return trimEmptyDescriptionLines(normalized.split(/\n/).map((line) => sanitizeRichTextHtml(line)));
}

function trimEmptyDescriptionLines(lines: string[]) {
  let start = 0;
  let end = lines.length;

  while (start < end && !stripRichTextHtml(lines[start]).trim()) start += 1;
  while (end > start && !stripRichTextHtml(lines[end - 1]).trim()) end -= 1;

  return lines.slice(start, end).filter((line) => stripRichTextHtml(line).trim());
}

function sanitizeRichTextHtml(value: string) {
  if (!value) return "";

  let result = "";
  let cursor = 0;
  const tagPattern = /<\/?[^>]+>/g;
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(value))) {
    result += escapeHtml(decodeBasicHtmlEntities(value.slice(cursor, match.index)));
    result += sanitizeRichTextTag(match[0]);
    cursor = match.index + match[0].length;
  }

  result += escapeHtml(decodeBasicHtmlEntities(value.slice(cursor)));
  return result;
}

function sanitizeRichTextTag(tag: string) {
    const normalized = tag.toLowerCase();
    if (/^<br\s*\/?>$/i.test(tag)) return "<br>";
    if (/^<\/\s*(b|strong)\s*>$/i.test(tag)) return "</strong>";
    if (/^<\s*(b|strong)(?:\s[^>]*)?>$/i.test(tag)) return '<strong data-resume-format="bold">';
    if (/^<\/\s*(i|em)\s*>$/i.test(tag)) return "</em>";
    if (/^<\s*(i|em)(?:\s[^>]*)?>$/i.test(tag)) return '<em data-resume-format="italic">';
    if (/^<\/\s*span\s*>$/i.test(tag)) return "</span>";

    if (normalized.startsWith("<span")) {
      const fontSize =
        tag.match(/data-resume-font-size=["']?(\d{1,2})["']?/i)?.[1] ??
        tag.match(/font-size\s*:\s*(\d{1,2})pt/i)?.[1];
      return fontSize
        ? `<span data-resume-font-size="${fontSize}" style="font-size:${fontSize}pt">`
        : "";
    }

    return "";
}

function stripRichTextHtml(value: string) {
  if (!value) return "";
  return decodeBasicHtmlEntities(
    sanitizeRichTextHtml(value)
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  );
}

function decodeBasicHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function AiSuggestionPanel({
  suggestion,
  message,
  isLoading,
  onApply,
  onCopy
}: {
  suggestion?: ResumeEntry;
  message?: string;
  isLoading: boolean;
  onApply: () => void;
  onCopy: () => void;
}) {
  if (!isLoading && !suggestion && !message) return null;

  return (
    <div className="mt-3 rounded-md border bg-background p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-medium">AI 润色建议</div>
          {message ? <p className="mt-1 text-xs text-muted-foreground">{message}</p> : null}
        </div>
        {suggestion ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={onCopy}>
              <Copy className="h-4 w-4" aria-hidden="true" />
              复制建议
            </Button>
            <Button variant="outline" size="sm" onClick={onApply}>
              <Check className="h-4 w-4" aria-hidden="true" />
              应用整条
            </Button>
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <div className="mt-3">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>正在请求 DeepSeek</span>
            <span>生成中</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-primary" />
          </div>
        </div>
      ) : null}

      {suggestion ? (
        <textarea
          className="mt-3 min-h-32 w-full resize-y rounded-md border bg-card px-3 py-2 text-sm leading-6 outline-none"
          readOnly
          value={formatEntrySuggestion(suggestion)}
        />
      ) : null}
    </div>
  );
}

async function optimizeEntryWithAi(
  entry: ResumeEntry,
  sectionTitle: string,
  resume: ResumeData,
  jd: JobDescriptionData | null
) {
  const response = await fetch("/api/ai/optimize-entry", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ entry, sectionTitle, resume, jd })
  });
  const result = (await response.json()) as {
    entry?: ResumeEntry;
    error?: string;
  };

  if (!response.ok || !result.entry) {
    throw new Error(result.error || "AI 优化失败，请稍后重试。");
  }

  return result.entry;
}

function formatEntrySuggestion(entry: ResumeEntry) {
  const heading = [entry.organization, entry.title].filter(Boolean).join(" | ");
  const meta = [entry.location, [entry.startDate, entry.endDate].filter(Boolean).join(" - ")]
    .filter(Boolean)
    .join(" | ");
  const descriptions = entry.description.filter(Boolean).map((item) => `- ${stripRichTextHtml(item)}`).join("\n");

  return [heading, meta, descriptions].filter(Boolean).join("\n");
}

async function copyEntrySuggestion(entry?: ResumeEntry) {
  if (!entry) return;
  await navigator.clipboard.writeText(formatEntrySuggestion(entry));
}

export function ResumePreview({
  resume,
  compact = false
}: {
  resume: ResumeData;
  compact?: boolean;
}) {
  const { previewResume, usesPlaceholders } = buildPreviewResume(resume);
  const [pageCount, setPageCount] = useState(1);
  const measureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const measure = () => {
      const page = measureRef.current?.querySelector<HTMLElement>(".resume-print-page");
      if (!page) return;
      const overflowHeight = Math.max(0, page.scrollHeight - PAGE_OVERFLOW_TOLERANCE_PX);
      setPageCount(Math.max(1, Math.ceil(overflowHeight / A4_PREVIEW_HEIGHT_PX)));
    };

    measure();
    const frame = window.requestAnimationFrame(measure);
    const observer = new ResizeObserver(measure);
    const page = measureRef.current?.querySelector<HTMLElement>(".resume-print-page");
    if (page) observer.observe(page);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [resume, compact]);

  return (
    <div className="resume-paged-preview">
      <div ref={measureRef} className="resume-page-measure" aria-hidden="true">
        <ResumePreviewContent resume={previewResume} compact={compact} />
      </div>
      {Array.from({ length: pageCount }, (_, index) => (
        <div key={index} className="resume-page-clip">
      {usesPlaceholders && index === 0 ? (
        <div className="resume-placeholder-badge absolute left-3 top-3 z-10 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700 shadow-sm">
          示例预览，填写后会替换为你的内容
        </div>
      ) : null}
          <div
            className="resume-page-offset"
            style={{ transform: `translateY(-${index * A4_PREVIEW_HEIGHT_PX}px)` }}
          >
            <ResumePreviewContent resume={previewResume} compact={compact} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ResumePreviewContent({
  resume,
  compact = false
}: {
  resume: ResumeData;
  compact?: boolean;
}) {
  if (resume.templateId === "ats") {
    return <AtsPreview resume={resume} compact={compact} />;
  }
  if (resume.templateId === "modern") {
    return <ModernPreview resume={resume} compact={compact} />;
  }
  if (resume.templateId === "executive") {
    return <ExecutivePreview resume={resume} compact={compact} />;
  }
  if (resume.templateId === "timeline") {
    return <TimelinePreview resume={resume} compact={compact} />;
  }
  if (
    resume.templateId === "roseBanner" ||
    resume.templateId === "blueCurve" ||
    resume.templateId === "coralPro" ||
    resume.templateId === "tealCards" ||
    resume.templateId === "internRosePro" ||
    resume.templateId === "graduateBluePro" ||
    resume.templateId === "socialTealPro"
  ) {
    return <MarketStylePreview resume={resume} compact={compact} />;
  }
  if (resume.templateId === "formalScholar") {
    return <FormalScholarPreview resume={resume} compact={compact} />;
  }
  if (resume.templateId === "accent") {
    return <AccentPreview resume={resume} compact={compact} />;
  }

  return <SingleColumnPreview resume={resume} compact={compact} />;
}

function SingleColumnPreview({ resume, compact }: { resume: ResumeData; compact: boolean }) {
  const style = getPreviewStyle(resume);
  const density = getDensity(resume, compact);
  const isCompactTemplate = resume.templateId === "compact";
  const photoReserve = resume.basics.photoUrl ? Number(resume.theme.photoSize ?? "80") * 0.78 + 28 : 0;

  return (
    <div className={`a4-page resume-print-page relative mx-auto bg-white text-foreground shadow-sm ${density.pagePadding}`} style={style}>
      {resume.basics.photoUrl ? <PreviewPhoto resume={resume} compact={compact} className="absolute right-7 top-7" /> : null}
      <div className="border-b pb-3" style={{ borderColor: resume.theme.accentColor, paddingRight: photoReserve }}>
        <div className={`${compact ? "text-xl" : "text-3xl"} resume-name-text font-semibold`}>
          {resume.basics.name || "未填写姓名"}
        </div>
        <ContactLine
          className="mt-2"
          items={[resume.basics.title, resume.basics.politicalStatus, resume.basics.phone, resume.basics.email, resume.basics.location]}
        />
      </div>

      <PreviewBody
        resume={resume}
        titleStyle={isCompactTemplate ? "line" : "accent"}
        density={density}
      />
    </div>
  );
}

function AtsPreview({ resume, compact }: { resume: ResumeData; compact: boolean }) {
  const style = getPreviewStyle(resume);
  const density = getDensity(resume, compact);

  return (
    <div className={`a4-page resume-print-page mx-auto bg-white text-foreground shadow-sm ${density.pagePadding}`} style={style}>
      <header className="text-center">
        <div className={`${compact ? "text-xl" : "text-3xl"} resume-name-text font-semibold`}>
          {resume.basics.name || "未填写姓名"}
        </div>
        <ContactLine className="mt-2 justify-center" items={getContactItems(resume)} />
      </header>
      <PreviewBody resume={resume} titleStyle="line" density={density} />
    </div>
  );
}

function ModernPreview({ resume, compact }: { resume: ResumeData; compact: boolean }) {
  const style = getPreviewStyle(resume);
  const density = getDensity(resume, compact);

  return (
    <div className={`a4-page resume-print-page mx-auto bg-white text-foreground shadow-sm ${density.pagePadding}`} style={style}>
      <header className="border-l-4 pl-5" style={{ borderColor: resume.theme.accentColor }}>
        <div className={`${compact ? "text-2xl" : "text-4xl"} resume-name-text font-semibold`}>
          {resume.basics.name || "未填写姓名"}
        </div>
        <div className="resume-body-text mt-2 font-medium" style={{ color: resume.theme.accentColor }}>
          {resume.basics.title || "目标职位"}
        </div>
        <ContactLine className="mt-2" items={getContactItems(resume)} />
      </header>
      <PreviewBody resume={resume} titleStyle="accent" density={{ ...density, topMargin: compact ? "mt-5" : "mt-7" }} />
    </div>
  );
}

function AccentPreview({ resume, compact }: { resume: ResumeData; compact: boolean }) {
  const style = getPreviewStyle(resume);
  const density = getDensity(resume, compact);

  return (
    <div className="a4-page resume-print-page mx-auto grid grid-cols-[34%_1fr] overflow-hidden bg-white text-foreground shadow-sm" style={style}>
      <aside className={`${compact ? "p-4" : "p-7"} text-white`} style={{ backgroundColor: resume.theme.accentColor }}>
        <div className={`${compact ? "text-xl" : "text-3xl"} resume-name-text font-semibold`}>
          {resume.basics.name || "未填写姓名"}
        </div>
        <div className="resume-body-text mt-2 text-white/85">{resume.basics.title || "目标职位"}</div>
        <div className={`${compact ? "mt-5 space-y-2" : "mt-8 space-y-3"} resume-meta-text text-white/85`}>
          {[resume.basics.politicalStatus, resume.basics.phone, resume.basics.email, resume.basics.location, resume.basics.website]
            .filter(Boolean)
            .map((item) => (
              <div key={item} className="break-words">
                {item}
              </div>
            ))}
        </div>
        <SideList title="技能" values={resume.skills} compact={compact} />
        <SideList title="证书" values={resume.certificates} compact={compact} />
      </aside>
      <main className={compact ? "p-5" : "p-9"}>
        <PreviewBody resume={resume} titleStyle="accent" density={density} hideSideSections />
      </main>
    </div>
  );
}

function ExecutivePreview({ resume, compact }: { resume: ResumeData; compact: boolean }) {
  const style = getPreviewStyle(resume);
  const density = getDensity(resume, compact);

  return (
    <div className="a4-page resume-print-page mx-auto grid grid-cols-[1fr_30%] overflow-hidden bg-white text-foreground shadow-sm" style={style}>
      <main className={compact ? "p-5" : "p-8"}>
        <header className="border-b pb-4" style={{ borderColor: resume.theme.accentColor }}>
          <div className="resume-name-text font-semibold">
            {resume.basics.name || "未填写姓名"}
          </div>
          <div className="mt-2 text-muted-foreground">{resume.basics.title || "目标职位"}</div>
        </header>
        <PreviewBody resume={resume} titleStyle="line" density={{ ...density, topMargin: "mt-5" }} hideSideSections />
      </main>
      <aside className={`${compact ? "p-4" : "p-6"} bg-muted/50`}>
        <div className="text-sm leading-6 text-muted-foreground">{getContactLine(resume)}</div>
        <SideList title="技能" values={resume.skills} compact={compact} tone="light" />
        <SideList title="证书" values={resume.certificates} compact={compact} tone="light" />
        <SideList title="获奖" values={resume.awards} compact={compact} tone="light" />
      </aside>
    </div>
  );
}

function TimelinePreview({ resume, compact }: { resume: ResumeData; compact: boolean }) {
  const style = getPreviewStyle(resume);
  const density = getDensity(resume, compact);

  return (
    <div className={`a4-page resume-print-page mx-auto bg-white text-foreground shadow-sm ${density.pagePadding}`} style={style}>
      <header className="flex items-start justify-between gap-6 border-b pb-4" style={{ borderColor: resume.theme.accentColor }}>
        <div>
          <div className="resume-name-text font-semibold">
            {resume.basics.name || "未填写姓名"}
          </div>
          <div className="mt-2 font-medium" style={{ color: resume.theme.accentColor }}>
            {resume.basics.title || "目标职位"}
          </div>
        </div>
        <div className="max-w-[42%] text-right text-muted-foreground">{getContactLine(resume)}</div>
      </header>
      <div className="border-l pl-5" style={{ borderColor: resume.theme.accentColor }}>
        <PreviewBody resume={resume} titleStyle="accent" density={{ ...density, topMargin: compact ? "mt-4" : "mt-6" }} />
      </div>
    </div>
  );
}

function FormalScholarPreview({ resume, compact }: { resume: ResumeData; compact: boolean }) {
  const style = getPreviewStyle(resume);
  const density = getDensity(resume, compact);
  const sections = getRenderableSections(resume);
  const contentOffsetY = Number(resume.theme.contentOffsetY ?? "0");
  const headingColor = resume.theme.headingColor ?? resume.theme.bodyColor ?? "#000000";

  return (
    <div className={`a4-page resume-print-page mx-auto bg-white shadow-sm ${density.pagePadding}`} style={style}>
      <header className="relative pb-3 text-center">
        <div className="resume-name-text font-semibold tracking-wide">{resume.basics.name || "姓名"}</div>
        <ContactLine className="mt-2 justify-center" items={[resume.basics.phone, resume.basics.email, resume.basics.location]} />
        <div className="resume-meta-text mt-1 text-muted-foreground">{resume.basics.politicalStatus || ""}</div>
        {resume.basics.photoUrl ? <PreviewPhoto resume={resume} compact={compact} className="absolute right-0 top-0" /> : null}
        <div className={resume.basics.photoUrl ? "hidden" : "absolute right-0 top-0 flex h-16 w-12 items-center justify-center bg-red-600 text-lg font-semibold text-white"}>
          {(resume.basics.name || "照").slice(0, 1)}
        </div>
      </header>

      <div style={{ marginTop: `${contentOffsetY}px` }}>
        {resume.basics.summary ? (
          <FormalSection title="个人总结" headingColor={headingColor}>
            <p className="leading-5">{resume.basics.summary}</p>
          </FormalSection>
        ) : null}

        {sections.map((section) =>
          section.type === "entry" ? (
            <FormalSection key={section.key} title={section.title} headingColor={headingColor}>
              <div className="space-y-2">
                {section.entries.map((entry) => (
                  <div key={entry.id}>
                    <div className="grid grid-cols-[1fr_auto] gap-3">
                      <div className="font-semibold">{formatPreviewHeading(entry, section.section)}</div>
                      <div className="font-normal">{[entry.startDate, entry.endDate].filter(Boolean).join(" - ")}</div>
                    </div>
                    {entry.location ? <div className="mt-0.5 font-medium">{entry.location}</div> : null}
                    <ul className="mt-1 list-disc space-y-0.5 pl-4 leading-5">
                      {entry.description.filter(Boolean).map((item) => (
                        <li key={item} dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(item) }} />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </FormalSection>
          ) : (
            <FormalSection key={section.key} title={section.title} headingColor={headingColor}>
              <ul className="list-disc space-y-0.5 pl-4 leading-5">
                {section.values.map((value) => (
                  <li key={value}>{value}</li>
                ))}
              </ul>
            </FormalSection>
          )
        )}
      </div>
    </div>
  );
}

function FormalSection({ title, headingColor, children }: { title: string; headingColor: string; children: React.ReactNode }) {
  return (
    <section className="mt-3">
      <h2
        className="border-b border-black pb-0.5 font-semibold"
        style={{
          color: headingColor,
          fontSize: "var(--resume-heading-font-size)",
          fontWeight: "var(--resume-heading-weight)" as unknown as CSSProperties["fontWeight"]
        }}
      >
        {title}
      </h2>
      <div className="mt-1.5">{children}</div>
    </section>
  );
}

function PreviewPhoto({
  resume,
  compact,
  rounded = false,
  className = ""
}: {
  resume: ResumeData;
  compact: boolean;
  rounded?: boolean;
  className?: string;
}) {
  const photoHeight = Number(resume.theme.photoSize ?? "80") * (compact ? 0.72 : 1);
  const photoWidth = photoHeight * 0.78;
  const photoOffsetY = Number(resume.theme.photoOffsetY ?? "0");
  const shapeClass = rounded ? "rounded-full" : "rounded-md";

  return (
    <div
      className={`${shapeClass} shrink-0 overflow-hidden border bg-white text-slate-700 ${className}`}
      style={{ height: photoHeight, width: rounded ? photoHeight : photoWidth, transform: `translateY(${photoOffsetY}px)` }}
    >
      {resume.basics.photoUrl ? (
        <img className="h-full w-full object-cover" src={resume.basics.photoUrl} alt="证件照" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-base font-semibold">
          {(resume.basics.name || "照").slice(0, 1)}
        </div>
      )}
    </div>
  );
}

function ContactLine({ items, className = "" }: { items: Array<string | undefined>; className?: string }) {
  const visibleItems = items.filter(Boolean);

  return (
    <div className={`resume-meta-text flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground ${className}`}>
      {visibleItems.map((item, index) => (
        <span key={`${item}-${index}`} className="inline-flex min-w-0 items-center gap-2 whitespace-nowrap">
          {index > 0 ? <span aria-hidden="true">|</span> : null}
          <span>{item}</span>
        </span>
      ))}
    </div>
  );
}

function MarketStylePreview({ resume, compact }: { resume: ResumeData; compact: boolean }) {
  const style = getPreviewStyle(resume);
  const density = getDensity(resume, compact);
  const visual = getTemplateVisual(resume.templateId);
  const isBlue = resume.templateId === "blueCurve";
  const isTeal = resume.templateId === "tealCards";

  return (
    <div className={`a4-page resume-print-page mx-auto overflow-hidden bg-white text-foreground shadow-sm ${density.pagePadding}`} style={style}>
      <header
        className={`relative overflow-hidden ${isBlue ? "rounded-b-[38%]" : "rounded-md"} ${compact ? "px-5 py-4" : "px-7 py-5"}`}
        style={{ background: visual.header }}
      >
        <div className="absolute right-0 top-0 h-24 w-40 opacity-20" style={{ background: visual.pattern }} />
        <div className={`relative flex ${isBlue ? "flex-col items-center text-center" : "items-center justify-between"} gap-4 text-white`}>
          <div>
            <div className="resume-name-text font-semibold">
              {resume.basics.name || "未填写姓名"}
            </div>
            <div className="mt-1 text-white/85">{resume.basics.title || "目标职位"}</div>
            <div className="mt-2 text-white/80">{getContactLine(resume)}</div>
          </div>
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-white/70 bg-white text-base font-semibold" style={{ color: visual.accent }}>
            {(resume.basics.name || "简").slice(0, 1)}
          </div>
        </div>
      </header>

      <div className={`${compact ? "mt-4" : "mt-5"} ${isTeal ? "space-y-3" : ""}`}>
        <PreviewBody
          resume={resume}
          titleStyle="accent"
          density={{ ...density, topMargin: "mt-0", sectionGap: compact ? "space-y-3" : "space-y-5" }}
          sectionVariant={isTeal ? "card" : "band"}
          titleBackground={visual.soft}
          accentColor={visual.accent}
        />
      </div>
    </div>
  );
}

function PreviewBody({
  resume,
  titleStyle,
  density,
  hideSideSections = false,
  sectionVariant = "plain",
  titleBackground,
  accentColor
}: {
  resume: ResumeData;
  titleStyle: "accent" | "line";
  density: ReturnType<typeof getDensity>;
  hideSideSections?: boolean;
  sectionVariant?: "plain" | "band" | "card";
  titleBackground?: string;
  accentColor?: string;
}) {
  const sectionColor = accentColor ?? resume.theme.accentColor;
  const headingColor = resume.theme.headingColor ?? sectionColor;

  return (
    <div className={`${density.topMargin} ${density.sectionGap}`}>
      {resume.basics.summary ? (
        <section>
          <PreviewTitle title="个人总结" color={headingColor} styleType={titleStyle} />
          <p className="mt-2 leading-6">{resume.basics.summary}</p>
        </section>
      ) : null}

      {getNavigationSections(resume).map((section) => {
        if (section === "basics") return null;
        if (hideSideSections && (section === "skills" || section === "certificates")) return null;
        if (isCustomSectionKey(section)) {
          const customSection = getCustomSection(resume, section);
          if (!customSection) return null;

          return (
            <PreviewEntrySection
              key={section}
              title={customSection.title || "自定义经历"}
              section="otherExperience"
              entries={customSection.entries}
              color={sectionColor}
              headingColor={headingColor}
              styleType={titleStyle}
              variant={sectionVariant}
              titleBackground={titleBackground}
            />
          );
        }
        if (entrySections.includes(section)) {
          return (
            <PreviewEntrySection
              key={section}
              title={getSectionLabel(resume, section)}
              section={section}
              entries={resume[section] as ResumeEntry[]}
              color={sectionColor}
              headingColor={headingColor}
              styleType={titleStyle}
              variant={sectionVariant}
              titleBackground={titleBackground}
            />
          );
        }
        if (listSections.includes(section)) {
          return (
            <PreviewListSection
              key={section}
              title={sectionLabels[section]}
              values={resume[section] as string[]}
              color={sectionColor}
              headingColor={headingColor}
              styleType={titleStyle}
              variant={sectionVariant}
              titleBackground={titleBackground}
            />
          );
        }
        return null;
      })}
    </div>
  );
}

function PreviewTitle({
  title,
  color,
  styleType,
  variant = "plain",
  titleBackground
}: {
  title: string;
  color: string;
  styleType: "accent" | "line";
  variant?: "plain" | "band" | "card";
  titleBackground?: string;
}) {
  if (variant === "band") {
    return (
      <h2
        className="rounded-sm px-2 py-1 font-semibold"
        style={{
          backgroundColor: titleBackground ?? "transparent",
          color,
          fontSize: "var(--resume-heading-font-size)",
          fontWeight: "var(--resume-heading-weight)" as unknown as CSSProperties["fontWeight"]
        }}
      >
        {title}
      </h2>
    );
  }

  return (
    <h2
      className={`pb-1 font-semibold ${styleType === "line" ? "border-b" : "border-b-2"}`}
      style={{
        borderColor: color,
        color: styleType === "accent" ? color : undefined,
        fontSize: "var(--resume-heading-font-size)",
        fontWeight: "var(--resume-heading-weight)" as unknown as CSSProperties["fontWeight"]
      }}
    >
      {title}
    </h2>
  );
}

function PreviewEntrySection({
  title,
  section,
  entries,
  color,
  headingColor,
  styleType,
  variant = "plain",
  titleBackground
}: {
  title: string;
  section: ResumeSectionKey;
  entries: ResumeEntry[];
  color: string;
  headingColor?: string;
  styleType: "accent" | "line";
  variant?: "plain" | "band" | "card";
  titleBackground?: string;
}) {
  if (!entries.length) return null;

  return (
    <section className={variant === "card" ? "rounded-md border bg-slate-50/70 p-3" : undefined}>
      <PreviewTitle title={title} color={headingColor ?? color} styleType={styleType} variant={variant} titleBackground={titleBackground} />
      <div className="mt-2 space-y-3">
        {entries.map((entry) => (
          <div key={entry.id}>
            <div className="font-medium">
              {formatPreviewHeading(entry, section)}
            </div>
            <div className="mt-1">
              {entry.location ? <span className="text-muted-foreground">{entry.location}</span> : null}
              {entry.location && (entry.startDate || entry.endDate) ? <span className="text-muted-foreground"> | </span> : null}
              {entry.startDate || entry.endDate ? (
                <span className="font-normal">{[entry.startDate, entry.endDate].filter(Boolean).join(" - ")}</span>
              ) : null}
            </div>
            <ul className="mt-1 list-disc space-y-1 pl-5 leading-6">
              {entry.description.filter(Boolean).map((item) => (
                <li key={item} dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(item) }} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function PreviewListSection({
  title,
  values,
  color,
  headingColor,
  styleType,
  variant = "plain",
  titleBackground
}: {
  title: string;
  values: string[];
  color: string;
  headingColor?: string;
  styleType: "accent" | "line";
  variant?: "plain" | "band" | "card";
  titleBackground?: string;
}) {
  if (!values.length) return null;

  return (
    <section className={variant === "card" ? "rounded-md border bg-slate-50/70 p-3" : undefined}>
      <PreviewTitle title={title} color={headingColor ?? color} styleType={styleType} variant={variant} titleBackground={titleBackground} />
      <p className="mt-2 leading-6">{values.join(" / ")}</p>
    </section>
  );
}

function SideList({
  title,
  values,
  compact,
  tone = "dark"
}: {
  title: string;
  values: string[];
  compact: boolean;
  tone?: "dark" | "light";
}) {
  if (!values.length) return null;

  return (
    <section className={compact ? "mt-5" : "mt-8"}>
      <h2 className={`border-b pb-1 font-semibold ${tone === "dark" ? "border-white/50" : "border-border"}`}>{title}</h2>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((value) => (
          <span
            key={value}
            className={`rounded-sm px-2 py-1 ${
              tone === "dark" ? "bg-white/15 text-white/90" : "bg-background text-muted-foreground"
            }`}
          >
            {value}
          </span>
        ))}
      </div>
    </section>
  );
}

function getPreviewStyle(resume: ResumeData): CSSProperties {
  const fontSize = toPointSize(resume.theme.fontScale, "11");
  const headingFontSize = toPointSize(resume.theme.headingFontScale, normalizeFontScale(resume.theme.fontScale));
  const nameFontSize = toPointSize(resume.theme.nameFontScale, "24");
  const metaFontSize = toPointSize(resume.theme.metaFontScale, "10");
  const fontFamily = {
    system: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    sans: "'Microsoft YaHei', '微软雅黑', 'PingFang SC', Arial, sans-serif",
    yahei: "'Microsoft YaHei', '微软雅黑', 'PingFang SC', Arial, sans-serif",
    dengxian: "'DengXian', '等线', 'Microsoft YaHei', Arial, sans-serif",
    serif: "'宋体', 'SimSun', 'Songti SC', 'Times New Roman', serif",
    heiti: "'黑体', 'SimHei', '微软雅黑', 'Microsoft YaHei', 'PingFang SC', Arial, sans-serif",
    songti: "'宋体', 'SimSun', 'Songti SC', 'Times New Roman', serif",
    huawenSongti: "'STSong', '华文宋体', 'SimSun', '宋体', serif",
    kaiti: "'KaiTi', '楷体', 'Kaiti SC', 'STKaiti', serif",
    huawenKaiti: "'STKaiti', '华文楷体', 'KaiTi', '楷体', serif",
    fangsong: "'FangSong', '仿宋', 'STFangsong', '华文仿宋', serif"
  }[normalizeFontFamily(resume.theme.fontFamily)];
  const headingWeight = {
    medium: 500,
    bold: 700,
    black: 900
  }[resume.theme.headingWeight ?? "bold"];
  const pageMargin = normalizePageMargin(resume.theme.pageMargin);
  const lineHeight = resume.theme.lineHeight ?? "18";

  return {
    fontSize,
    fontFamily,
    lineHeight: `${lineHeight}pt`,
    padding: `${pageMargin}mm`,
    color: resume.theme.bodyColor ?? "#000000",
    "--resume-font-family": fontFamily,
    "--resume-body-color": resume.theme.bodyColor ?? "#000000",
    "--resume-body-font-size": fontSize,
    "--resume-line-height": `${lineHeight}pt`,
    "--resume-heading-weight": headingWeight,
    "--resume-heading-font-size": headingFontSize,
    "--resume-name-font-size": nameFontSize,
    "--resume-meta-font-size": metaFontSize
  } as CSSProperties;
}

function normalizeFontScale(value: ResumeData["theme"]["fontScale"] | undefined) {
  if (value === "sm") return "10";
  if (value === "md") return "11";
  if (value === "lg") return "12";
  return value ?? "11";
}

function toPointSize(value: string | undefined, fallback: string) {
  const normalized = value === "sm" ? "10" : value === "md" ? "11" : value === "lg" ? "12" : value;
  return `${normalized ?? fallback}pt`;
}

function normalizeFontFamily(fontFamily: ResumeData["theme"]["fontFamily"]) {
  if (fontFamily === "serif") return "songti";
  if (fontFamily === "sans" || fontFamily === "system") return "heiti";
  return fontFamily ?? "heiti";
}

function formatContentOffsetLabel(offset: NonNullable<ResumeData["theme"]["contentOffsetY"]>) {
  const value = Number(offset);
  if (value < 0) return `上移 ${Math.abs(value)} px`;
  if (value > 0) return `下移 ${value} px`;
  return "默认位置";
}

function normalizePageMargin(pageMargin: ResumeData["theme"]["pageMargin"]) {
  if (pageMargin === "narrow") return "5";
  if (pageMargin === "wide") return "20";
  if (pageMargin === "normal") return "10";
  return pageMargin ?? "10";
}

function getFontTargetSize(resume: ResumeData, target: FontTarget) {
  if (target === "name") return resume.theme.nameFontScale ?? "24";
  if (target === "meta") return resume.theme.metaFontScale ?? "10";
  if (target === "heading") return resume.theme.headingFontScale ?? normalizeFontScale(resume.theme.fontScale);
  return normalizeFontScale(resume.theme.fontScale);
}

function applyFontTargetSize(resume: ResumeData, target: FontTarget, size: string): ResumeData {
  const fontSize = size as NonNullable<ResumeData["theme"]["nameFontScale"]>;
  if (target === "name") {
    return { ...resume, theme: { ...resume.theme, nameFontScale: fontSize } };
  }
  if (target === "meta") {
    return { ...resume, theme: { ...resume.theme, metaFontScale: fontSize } };
  }
  if (target === "heading") {
    return { ...resume, theme: { ...resume.theme, headingFontScale: fontSize } };
  }
  return { ...resume, theme: { ...resume.theme, fontScale: fontSize } };
}

function getContactLine(resume: ResumeData) {
  return getContactItems(resume)
    .filter(Boolean)
    .join(" | ");
}

function getContactItems(resume: ResumeData) {
  return [
    resume.basics.politicalStatus,
    resume.basics.phone,
    resume.basics.email,
    resume.basics.location,
    resume.basics.website
  ];
}

function getRenderableSections(resume: ResumeData): Array<
  | {
      type: "entry";
      key: string;
      title: string;
      section: ResumeSectionKey;
      entries: ResumeEntry[];
    }
  | {
      type: "list";
      key: string;
      title: string;
      values: string[];
    }
> {
  const sections: ReturnType<typeof getRenderableSections> = [];

  for (const section of getNavigationSections(resume)) {
    if (section === "basics") continue;
    if (isCustomSectionKey(section)) {
      const customSection = getCustomSection(resume, section);
      if (!customSection?.entries.length) continue;

      sections.push({
        type: "entry",
        key: section,
        title: customSection.title || "自定义经历",
        section: "otherExperience",
        entries: customSection.entries
      });
      continue;
    }
    if (entrySections.includes(section)) {
      const entries = resume[section] as ResumeEntry[];
      if (!entries.length) continue;

      sections.push({
        type: "entry",
        key: section,
        title: getSectionLabel(resume, section),
        section,
        entries
      });
      continue;
    }
    if (listSections.includes(section)) {
      const values = resume[section] as string[];
      if (!values.length) continue;

      sections.push({
        type: "list",
        key: section,
        title: sectionLabels[section],
        values
      });
    }
  }

  return sections;
}

function getTemplateVisual(templateId: ResumeData["templateId"]) {
  const visuals: Record<ResumeData["templateId"], { header: string; accent: string; soft: string; pattern: string }> = {
    classic: {
      header: "linear-gradient(135deg, #334155, #0f172a)",
      accent: "#334155",
      soft: "#f1f5f9",
      pattern: "repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 8px)"
    },
    compact: {
      header: "linear-gradient(135deg, #1f2937, #111827)",
      accent: "#1f2937",
      soft: "#f3f4f6",
      pattern: "repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 8px)"
    },
    accent: {
      header: "linear-gradient(135deg, #0f766e, #115e59)",
      accent: "#0f766e",
      soft: "#ccfbf1",
      pattern: "repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 8px)"
    },
    ats: {
      header: "linear-gradient(135deg, #475569, #1e293b)",
      accent: "#475569",
      soft: "#f8fafc",
      pattern: "repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 8px)"
    },
    modern: {
      header: "linear-gradient(135deg, #2563eb, #0891b2)",
      accent: "#2563eb",
      soft: "#dbeafe",
      pattern: "repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 8px)"
    },
    executive: {
      header: "linear-gradient(135deg, #7c2d12, #334155)",
      accent: "#7c2d12",
      soft: "#ffedd5",
      pattern: "repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 8px)"
    },
    timeline: {
      header: "linear-gradient(135deg, #4338ca, #0f766e)",
      accent: "#4338ca",
      soft: "#e0e7ff",
      pattern: "repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 8px)"
    },
    roseBanner: {
      header: "linear-gradient(135deg, #be123c, #fb7185)",
      accent: "#be123c",
      soft: "#ffe4e6",
      pattern: "radial-gradient(circle at 20% 20%, #fff 0 1px, transparent 2px)"
    },
    blueCurve: {
      header: "linear-gradient(135deg, #2563eb, #60a5fa)",
      accent: "#2563eb",
      soft: "#dbeafe",
      pattern: "radial-gradient(circle at 70% 20%, #fff 0 1px, transparent 2px)"
    },
    coralPro: {
      header: "linear-gradient(135deg, #be123c, #f97316)",
      accent: "#be123c",
      soft: "#ffe4e6",
      pattern: "repeating-linear-gradient(135deg, #fff 0 1px, transparent 1px 9px)"
    },
    tealCards: {
      header: "linear-gradient(135deg, #0f766e, #14b8a6)",
      accent: "#0f766e",
      soft: "#ccfbf1",
      pattern: "radial-gradient(circle at 70% 20%, #fff 0 1px, transparent 2px)"
    },
    formalScholar: {
      header: "linear-gradient(135deg, #111827, #334155)",
      accent: "#111827",
      soft: "#f8fafc",
      pattern: "repeating-linear-gradient(0deg, #fff 0 1px, transparent 1px 8px)"
    },
    internRosePro: {
      header: "linear-gradient(135deg, #be123c, #fb7185)",
      accent: "#be123c",
      soft: "#ffe4e6",
      pattern: "radial-gradient(circle at 20% 20%, #fff 0 1px, transparent 2px)"
    },
    graduateBluePro: {
      header: "linear-gradient(135deg, #2563eb, #60a5fa)",
      accent: "#2563eb",
      soft: "#dbeafe",
      pattern: "radial-gradient(circle at 70% 20%, #fff 0 1px, transparent 2px)"
    },
    socialTealPro: {
      header: "linear-gradient(135deg, #0f766e, #14b8a6)",
      accent: "#0f766e",
      soft: "#ccfbf1",
      pattern: "radial-gradient(circle at 70% 20%, #fff 0 1px, transparent 2px)"
    }
  };

  return visuals[templateId];
}

function getDensity(resume: ResumeData, compactPreview: boolean) {
  const tight =
    compactPreview ||
    resume.templateId === "compact" ||
    resume.templateId === "executive" ||
    resume.theme.density === "compact";

  const margin = resume.theme.pageMargin ?? "normal";
  const pagePadding = {
    narrow: tight ? "p-3" : "p-5",
    normal: tight ? "p-5" : "p-7",
    wide: tight ? "p-7" : "p-10",
    "5": "",
    "10": "",
    "15": "",
    "20": "",
    "25": ""
  }[margin];

  return {
    pagePadding,
    topMargin: tight ? "mt-4" : "mt-8",
    sectionGap: tight ? "space-y-4" : "space-y-7"
  };
}

function toCustomSectionKey(sectionId: string): EditorSectionKey {
  return `custom:${sectionId}`;
}

function getCustomSectionId(section: EditorSectionKey) {
  return section.startsWith("custom:") ? section.slice("custom:".length) : "";
}

function isCustomSectionKey(section: EditorSectionKey): section is `custom:${string}` {
  return section.startsWith("custom:");
}

function isBaseSection(section: EditorSectionKey): section is ResumeSectionKey {
  return !isCustomSectionKey(section);
}

function getCustomSection(resume: ResumeData, section: EditorSectionKey) {
  const customId = getCustomSectionId(section);
  return customId ? resume.customSections.find((item) => item.id === customId) : null;
}

function getNavigationSections(resume: ResumeData): EditorSectionKey[] {
  const customKeys = resume.customSections.map((customSection) => toCustomSectionKey(customSection.id));
  const customKeySet = new Set<EditorSectionKey>(customKeys);
  const baseSectionSet = new Set<ResumeSectionKey>(editableSections);
  const sections: EditorSectionKey[] = [];
  const seen = new Set<EditorSectionKey>();

  function push(section: EditorSectionKey) {
    if (seen.has(section)) return;
    sections.push(section);
    seen.add(section);
  }

  for (const section of resume.sectionOrder) {
    if (isCustomSectionKey(section)) {
      if (customKeySet.has(section)) push(section);
      continue;
    }
    if (!baseSectionSet.has(section)) continue;
    if (section === "otherExperience") {
      customKeys.forEach(push);
      continue;
    }
    push(section);
  }

  if (sections.length === 0) {
    push("basics");
  }
  customKeys.forEach(push);

  return sections;
}

function getSectionLabel(resume: ResumeData, section: EditorSectionKey) {
  const customSection = getCustomSection(resume, section);
  if (customSection) return customSection.title || "自定义经历";

  if (!isBaseSection(section)) return "自定义经历";
  return resume.customSectionTitles?.[section]?.trim() || sectionLabels[section];
}

function isCustomSectionFilled(resume: ResumeData, section: EditorSectionKey) {
  return Boolean(getCustomSection(resume, section)?.entries.length);
}

function formatEntryHeading(
  entry: ResumeEntry,
  section: ResumeSectionKey,
  fallback: string
) {
  if (section === "education") {
    return [entry.organization, entry.major, entry.title].filter(Boolean).join(" | ") || fallback;
  }
  if (section === "projects") {
    return [entry.title, entry.organization].filter(Boolean).join(" | ") || fallback;
  }
  return [entry.organization, entry.title].filter(Boolean).join(" | ") || fallback;
}

function formatPreviewHeading(entry: ResumeEntry, section: ResumeSectionKey) {
  const fallback = entryFormConfig[section]?.emptyTitle ?? "未命名经历";
  return formatEntryHeading(entry, section, fallback);
}

function isSectionFilled(resume: ResumeData, section: ResumeSectionKey) {
  if (section === "basics") {
    return Boolean(
      resume.basics.name ||
        resume.basics.email ||
        resume.basics.phone ||
        resume.basics.politicalStatus
    );
  }
  if (entrySections.includes(section)) {
    return (resume[section] as ResumeEntry[]).length > 0;
  }
  if (listSections.includes(section)) {
    return (resume[section] as string[]).length > 0;
  }
  return false;
}

function getEmptySectionValue(section: ResumeSectionKey) {
  if (entrySections.includes(section)) return [];
  if (listSections.includes(section)) return [];
  return [];
}

function buildPreviewResume(resume: ResumeData) {
  const placeholder = normalizeResume(demoResume);
  let usesPlaceholders = false;

  function pickText<T extends string | undefined>(value: T, fallback: T): T {
    if (value && value.trim()) return value;
    if (fallback && fallback.trim()) usesPlaceholders = true;
    return fallback;
  }

  function pickEntries(section: ResumeSectionKey) {
    const entries = resume[section] as ResumeEntry[];
    if (entries.length) return entries;
    usesPlaceholders = true;
    return placeholder[section] as ResumeEntry[];
  }

  function pickList(section: ResumeSectionKey) {
    const values = resume[section] as string[];
    if (values.length) return values;
    usesPlaceholders = true;
    return placeholder[section] as string[];
  }

  const hasCustomEntries = resume.customSections.some((section) => section.entries.length > 0);
  if (!hasCustomEntries && placeholder.customSections.some((section) => section.entries.length > 0)) {
    usesPlaceholders = true;
  }

  const previewResume = normalizeResume({
    ...resume,
    basics: {
      ...resume.basics,
      name: pickText(resume.basics.name, placeholder.basics.name),
      title: pickText(resume.basics.title, placeholder.basics.title),
      phone: pickText(resume.basics.phone, placeholder.basics.phone),
      email: pickText(resume.basics.email, placeholder.basics.email),
      location: pickText(resume.basics.location, placeholder.basics.location),
      politicalStatus: pickText(resume.basics.politicalStatus, placeholder.basics.politicalStatus),
      website: resume.basics.website,
      linkedin: resume.basics.linkedin,
      github: resume.basics.github,
      summary: resume.basics.summary,
      photoUrl: resume.basics.photoUrl
    },
    education: pickEntries("education"),
    workExperience: pickEntries("workExperience"),
    internships: pickEntries("internships"),
    projects: pickEntries("projects"),
    campusExperience: pickEntries("campusExperience"),
    otherExperience: pickEntries("otherExperience"),
    skills: pickList("skills"),
    awards: pickList("awards"),
    certificates: pickList("certificates"),
    customSections: hasCustomEntries ? resume.customSections : placeholder.customSections
  });

  return { previewResume, usesPlaceholders };
}
