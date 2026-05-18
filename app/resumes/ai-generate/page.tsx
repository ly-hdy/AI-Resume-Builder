"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  Check,
  GraduationCap,
  Library,
  Save,
  Sparkles,
  Wand2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  RESUME_STORAGE_KEY,
  createEmptyResume,
  demoResume,
  normalizeResume
} from "@/lib/resume-data";
import { resumeTemplateCatalog } from "@/lib/resume-templates";
import type { ResumeData, ResumeEntry, ResumeTemplateId } from "@/types/resume";

type Identity = "student" | "professional";
type StepKey =
  | "identity"
  | "template"
  | "basics"
  | "summary"
  | "education"
  | "internships"
  | "projects"
  | "campusExperience"
  | "workExperience"
  | "otherExperience"
  | "extras"
  | "finish";
type ExperienceKey = "workExperience" | "internships" | "projects" | "campusExperience" | "otherExperience";

const stepOrder: StepKey[] = [
  "identity",
  "template",
  "basics",
  "summary",
  "education",
  "internships",
  "projects",
  "campusExperience",
  "workExperience",
  "otherExperience",
  "extras",
  "finish"
];

const stepTitles: Record<StepKey, string> = {
  identity: "先确认你的求职身份",
  template: "选择一个默认模板",
  basics: "填写基础信息",
  summary: "补充个人总结",
  education: "分享教育背景",
  internships: "补充实习经历",
  projects: "补充项目经历",
  campusExperience: "补充校园经历",
  workExperience: "补充工作经历",
  otherExperience: "补充其他经历",
  extras: "补充技能、证书和奖项",
  finish: "确认生成方式"
};

const experienceLabels: Record<ExperienceKey, string> = {
  workExperience: "工作经历",
  internships: "实习经历",
  projects: "项目经历",
  campusExperience: "校园经历",
  otherExperience: "其他经历"
};

const experiencePlaceholders: Record<ExperienceKey, string> = {
  workExperience: "如：负责用户增长活动，从需求分析到上线跟进，推动注册转化提升...",
  internships: "如：在某公司担任产品实习生，负责竞品分析、需求整理、原型绘制...",
  projects: "如：参与 AI 简历生成工具项目，负责流程设计、功能规划和页面验收...",
  campusExperience: "如：负责社团公众号运营，撰写推文，组织活动宣传和报名统计...",
  otherExperience: "如：志愿服务、比赛、社会实践、个人作品等补充经历..."
};

const templateOptions = resumeTemplateCatalog.filter((template) =>
  ["classic", "ats", "formalScholar", "graduateBluePro", "socialTealPro", "modern"].includes(template.id)
);

export default function AiGenerateResumePage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [identity, setIdentity] = useState<Identity>("student");
  const [templateId, setTemplateId] = useState<ResumeTemplateId>("classic");
  const [name, setName] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [education, setEducation] = useState("");
  const [summary, setSummary] = useState("");
  const [experiences, setExperiences] = useState<Record<ExperienceKey, string>>({
    workExperience: "",
    internships: "",
    projects: "",
    campusExperience: "",
    otherExperience: ""
  });
  const [skills, setSkills] = useState("");
  const [certificates, setCertificates] = useState("");
  const [awards, setAwards] = useState("");
  const [status, setStatus] = useState("我会一步一步收集信息，右侧会实时生成简历预览。");

  const currentStep = stepOrder[activeStep];
  const template = templateOptions.find((item) => item.id === templateId) ?? templateOptions[0];
  const previewSections = useMemo(() => buildPreviewSections(identity, experiences), [identity, experiences]);
  const previewStyle = getTemplateStyle(templateId);
  const completedSteps = stepOrder.slice(0, activeStep);

  function updateExperience(key: ExperienceKey, value: string) {
    setExperiences((current) => ({ ...current, [key]: value }));
  }

  function rewriteExperience(key: ExperienceKey) {
    const raw = experiences[key];
    if (!raw.trim()) {
      setStatus(`先写一点${experienceLabels[key]}素材，我再帮你改成简历表达。`);
      return;
    }

    const role = targetRole.trim();
    const rewritten = splitLines(raw)
      .slice(0, 5)
      .map((line) => polishExperience(line, experienceLabels[key], role))
      .join("\n");
    updateExperience(key, rewritten);
    setStatus(`已帮你改写${experienceLabels[key]}，可以继续修改或进入下一步。`);
  }

  function goNext() {
    setActiveStep((step) => Math.min(step + 1, stepOrder.length - 1));
  }

  function goPrevious() {
    setActiveStep((step) => Math.max(step - 1, 0));
  }

  function skipStep() {
    setStatus("已跳过当前问题，你之后仍然可以在编辑器里补充。");
    goNext();
  }

  function saveResume(openEditor: boolean) {
    const resume = buildGeneratedResume({
      identity,
      templateId,
      name,
      targetRole,
      education,
      summary,
      experiences,
      skills,
      certificates,
      awards
    });
    const nextResume = normalizeResume(resume);
    const stored = readResumes();
    const next = [nextResume, ...stored.filter((item) => item.id !== nextResume.id)];
    window.localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(next));

    if (openEditor) {
      router.push(`/resumes/${nextResume.id}/edit`);
      return;
    }

    setStatus("已保存到我的简历。你可以继续调整信息，或回到我的简历查看。");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold">AI 智能简历生成</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          像对话一样逐步填写信息，AI 会把内容实时放进右侧模板预览。
        </p>
      </div>

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,560px)_1fr]">
        <section className="space-y-4 rounded-lg border bg-card p-5">
          <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
            <span>
              第 {activeStep + 1} 步 / 共 {stepOrder.length} 步
            </span>
            <span>{stepTitles[currentStep]}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary" style={{ width: `${((activeStep + 1) / stepOrder.length) * 100}%` }} />
          </div>

          {completedSteps.length ? (
            <div className="space-y-3">
              {completedSteps.map((step) => (
                <CompletedBubble key={step} title={stepTitles[step]} summary={getStepSummary(step)} />
              ))}
            </div>
          ) : null}

          <div className="rounded-lg border bg-background p-4">
            <div className="mb-4 flex items-start gap-3">
              <div className="rounded-md bg-primary/10 p-2 text-primary">
                <Sparkles className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{stepTitles[currentStep]}</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{getStepPrompt(currentStep)}</p>
              </div>
            </div>
            {renderStepContent(currentStep)}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button type="button" variant="outline" onClick={goPrevious} disabled={activeStep === 0}>
              上一步
            </Button>
            <div className="flex flex-wrap gap-2">
              {currentStep !== "finish" ? (
                <Button type="button" variant="outline" onClick={skipStep}>
                  跳过
                </Button>
              ) : null}
              {currentStep !== "finish" ? (
                <Button type="button" onClick={goNext}>
                  下一步
                </Button>
              ) : null}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{status}</p>
        </section>

        <section className="rounded-lg border bg-muted p-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-auto">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
              <h2 className="text-lg font-semibold">简历预览</h2>
            </div>
            <span className="rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground">
              {template?.name ?? "经典单栏"}
            </span>
          </div>
          <TemplatePreview
            name={name}
            targetRole={targetRole}
            summary={summary}
            education={education}
            previewSections={previewSections}
            listPreview={formatListPreview([skills, certificates, awards])}
            style={previewStyle}
          />
        </section>
      </div>
    </div>
  );

  function getStepSummary(step: StepKey) {
    if (step === "identity") return identity === "student" ? "我的求职身份是：学生" : "我的求职身份是：职场人";
    if (step === "template") return `我选择的模板是：${template?.name ?? "经典单栏"}`;
    if (step === "basics") return `我的姓名是：${name || "未填写"}；目标岗位：${targetRole || "暂不确定"}`;
    if (step === "summary") return summary ? "我补充了个人总结" : "暂时跳过个人总结";
    if (step === "education") return education ? "我填写了教育背景" : "暂时跳过教育背景";
    if (isExperienceStep(step)) return experiences[step] ? `我填写了${experienceLabels[step]}` : `暂时跳过${experienceLabels[step]}`;
    if (step === "extras") return formatListPreview([skills, certificates, awards]) ? "我补充了技能、证书或奖项" : "暂时跳过补充信息";
    return "准备生成简历";
  }

  function renderStepContent(step: StepKey) {
    if (step === "identity") {
      return (
        <div className="grid grid-cols-2 gap-2">
          <ChoiceButton
            active={identity === "student"}
            icon={<GraduationCap className="h-4 w-4" aria-hidden="true" />}
            label="学生"
            onClick={() => setIdentity("student")}
          />
          <ChoiceButton
            active={identity === "professional"}
            icon={<BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />}
            label="职场人"
            onClick={() => setIdentity("professional")}
          />
        </div>
      );
    }

    if (step === "template") {
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          {templateOptions.map((item) => (
            <ChoiceButton
              key={item.id}
              active={templateId === item.id}
              icon={<Library className="h-4 w-4" aria-hidden="true" />}
              label={item.name}
              onClick={() => setTemplateId(item.id)}
            />
          ))}
        </div>
      );
    }

    if (step === "basics") {
      return (
        <div className="space-y-4">
          <TextField label="姓名" value={name} onChange={setName} placeholder="如：张晨" />
          <TextField
            label="目标岗位（可选）"
            value={targetRole}
            onChange={setTargetRole}
            placeholder="如：产品经理、运营、前端工程师；不确定可先跳过"
          />
        </div>
      );
    }

    if (step === "summary") {
      return (
        <TextArea
          label="个人总结（可选）"
          value={summary}
          onChange={setSummary}
          placeholder="如果你已经有自我评价可以写在这里；不填也会生成通用总结。"
          minHeight="min-h-32"
        />
      );
    }

    if (step === "education") {
      return (
        <TextArea
          label="教育背景"
          value={education}
          onChange={setEducation}
          placeholder="如：某某大学 软件工程 本科，GPA 3.6/4.0，核心课程..."
          minHeight="min-h-32"
        />
      );
    }

    if (isExperienceStep(step)) {
      return (
        <ExperienceField
          label={experienceLabels[step]}
          value={experiences[step]}
          placeholder={experiencePlaceholders[step]}
          onChange={(value) => updateExperience(step, value)}
          onRewrite={() => rewriteExperience(step)}
        />
      );
    }

    if (step === "extras") {
      return (
        <div className="space-y-4">
          <TextArea label="技能" value={skills} onChange={setSkills} placeholder="如：SQL、Excel、Axure、Figma、数据分析、用户研究..." minHeight="min-h-24" />
          <TextArea label="证书" value={certificates} onChange={setCertificates} placeholder="如：CET-6、普通话、计算机二级、行业证书..." minHeight="min-h-24" />
          <TextArea label="奖项" value={awards} onChange={setAwards} placeholder="如：校级奖学金、竞赛奖项、优秀学生干部..." minHeight="min-h-24" />
        </div>
      );
    }

    return (
      <div>
        <p className="text-sm leading-6 text-muted-foreground">
          信息已经收集完成。你可以先保存到“我的简历”，也可以直接进入编辑器继续细调。
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => saveResume(false)}>
            <Save className="h-4 w-4" aria-hidden="true" />
            直接保存
          </Button>
          <Button type="button" onClick={() => saveResume(true)}>
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            保存并进入编辑器
          </Button>
        </div>
      </div>
    );
  }
}

function CompletedBubble({ title, summary }: { title: string; summary: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[86%] rounded-lg bg-primary px-4 py-3 text-sm text-primary-foreground">
        <div className="mb-1 flex items-center gap-2 text-xs opacity-80">
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          {title}
        </div>
        <div>{summary}</div>
      </div>
    </div>
  );
}

function getStepPrompt(step: StepKey) {
  if (step === "identity") return "不同身份会影响经历模块的顺序和表达重点。";
  if (step === "template") return "右侧会立刻套入你选择的模板，后续也可以在编辑器继续调整。";
  if (step === "basics") return "目标岗位不是必填。如果暂时没有方向，我会生成一份通用简历。";
  if (step === "summary") return "如果你没有现成总结，可以跳过，我会根据目标岗位和经历自动生成通用总结。";
  if (step === "education") return "写学校、专业、学历、成绩、课程或校园成果即可。";
  if (isExperienceStep(step)) return "用自然语言写你做过什么就行。需要时可以点 AI 帮写，改成更像简历的表达。";
  if (step === "extras") return "技能、证书和奖项可以用顿号、逗号或换行分隔。";
  return "保存后会进入我的简历；进入编辑器可以继续精修排版和内容。";
}

function isExperienceStep(step: StepKey): step is ExperienceKey {
  return ["workExperience", "internships", "projects", "campusExperience", "otherExperience"].includes(step);
}

function ExperienceField({
  label,
  value,
  placeholder,
  onChange,
  onRewrite
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onRewrite: () => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label className="text-sm font-medium">{label}</label>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          onClick={onRewrite}
        >
          <Wand2 className="h-3.5 w-3.5" aria-hidden="true" />
          AI 帮写
        </button>
      </div>
      <textarea
        className="min-h-36 w-full resize-y rounded-md border bg-background p-3 text-sm leading-6 outline-none focus:ring-2 focus:ring-ring"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function ChoiceButton({
  active,
  icon,
  label,
  onClick
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={[
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted"
      ].join(" ")}
      onClick={onClick}
    >
      {icon}
      <span className="line-clamp-1">{label}</span>
    </button>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      <input
        className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  minHeight = "min-h-24"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  minHeight?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      <textarea
        className={`mt-2 w-full resize-y rounded-md border bg-background p-3 text-sm leading-6 outline-none focus:ring-2 focus:ring-ring ${minHeight}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function PreviewBlock({
  title,
  color,
  children
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-6 text-sm leading-6">
      <h4 className="border-b pb-1 text-base font-semibold" style={{ color, borderColor: `${color}44` }}>
        {title}
      </h4>
      <div className="mt-2 text-slate-800">{children}</div>
    </section>
  );
}

function TemplatePreview({
  name,
  targetRole,
  summary,
  education,
  previewSections,
  listPreview,
  style
}: {
  name: string;
  targetRole: string;
  summary: string;
  education: string;
  previewSections: Array<{ key: ExperienceKey; title: string; items: string[] }>;
  listPreview: string;
  style: { accent: string; headerClass: string; surfaceClass: string; layout: "single" | "banner" | "sidebar" | "cards" };
}) {
  const displayName = name || "你的姓名";
  const displayRole = targetRole || "通用简历";
  const displaySummary = summary || buildSummary(targetRole);
  const displayEducation = education || "填写学校、专业、学历、课程或成绩亮点。";
  const displayList = listPreview || "填写技能、证书、奖项等补充信息。";

  if (style.layout === "sidebar") {
    return (
      <div className={`mx-auto grid min-h-[760px] max-w-[660px] grid-cols-[180px_1fr] bg-white text-black shadow-sm ${style.surfaceClass}`}>
        <aside className="p-6 text-white" style={{ backgroundColor: style.accent }}>
          <h3 className="text-2xl font-semibold leading-tight">{displayName}</h3>
          <p className="mt-3 text-sm text-white/80">{displayRole}</p>
          <div className="mt-8">
            <h4 className="border-b border-white/40 pb-1 text-sm font-semibold">技能 / 证书 / 奖项</h4>
            <p className="mt-3 text-sm leading-6 text-white/85">{displayList}</p>
          </div>
        </aside>
        <main className="p-7">
          <PreviewBlock title="个人总结" color={style.accent}>
            <p>{displaySummary}</p>
          </PreviewBlock>
          <PreviewBlock title="教育背景" color={style.accent}>
            <p>{displayEducation}</p>
          </PreviewBlock>
          <PreviewExperienceSections sections={previewSections} color={style.accent} />
        </main>
      </div>
    );
  }

  if (style.layout === "banner") {
    return (
      <div className={`mx-auto min-h-[760px] max-w-[660px] overflow-hidden bg-white text-black shadow-sm ${style.surfaceClass}`}>
        <header className="p-8 text-white" style={{ background: `linear-gradient(135deg, ${style.accent}, #111827)` }}>
          <h3 className="text-3xl font-semibold">{displayName}</h3>
          <p className="mt-2 text-sm text-white/80">{displayRole}</p>
        </header>
        <main className="p-8">
          <PreviewBlock title="个人总结" color={style.accent}>
            <p>{displaySummary}</p>
          </PreviewBlock>
          <PreviewBlock title="教育背景" color={style.accent}>
            <p>{displayEducation}</p>
          </PreviewBlock>
          <PreviewExperienceSections sections={previewSections} color={style.accent} />
          <PreviewBlock title="技能 / 证书 / 奖项" color={style.accent}>
            <p>{displayList}</p>
          </PreviewBlock>
        </main>
      </div>
    );
  }

  if (style.layout === "cards") {
    return (
      <div className={`mx-auto min-h-[760px] max-w-[660px] bg-white p-8 text-black shadow-sm ${style.surfaceClass}`}>
        <div className="rounded-md p-5" style={{ backgroundColor: `${style.accent}18` }}>
          <h3 className="text-3xl font-semibold">{displayName}</h3>
          <p className="mt-2 text-sm text-slate-600">{displayRole}</p>
        </div>
        <div className="mt-5 space-y-4">
          <PreviewCard title="个人总结" color={style.accent}>
            <p>{displaySummary}</p>
          </PreviewCard>
          <PreviewCard title="教育背景" color={style.accent}>
            <p>{displayEducation}</p>
          </PreviewCard>
          {previewSections.map((section) => (
            <PreviewCard key={section.key} title={section.title} color={style.accent}>
              <ul className="list-disc space-y-1 pl-5">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </PreviewCard>
          ))}
          <PreviewCard title="技能 / 证书 / 奖项" color={style.accent}>
            <p>{displayList}</p>
          </PreviewCard>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`mx-auto min-h-[760px] max-w-[660px] bg-white p-8 text-black shadow-sm ${style.surfaceClass}`}
      style={{ borderTop: `8px solid ${style.accent}` }}
    >
      <div className={style.headerClass}>
        <h3 className="text-3xl font-semibold">{displayName}</h3>
        <p className="mt-2 text-sm text-slate-600">{displayRole}</p>
      </div>
      <PreviewBlock title="个人总结" color={style.accent}>
        <p>{displaySummary}</p>
      </PreviewBlock>
      <PreviewBlock title="教育背景" color={style.accent}>
        <p>{displayEducation}</p>
      </PreviewBlock>
      <PreviewExperienceSections sections={previewSections} color={style.accent} />
      <PreviewBlock title="技能 / 证书 / 奖项" color={style.accent}>
        <p>{displayList}</p>
      </PreviewBlock>
    </div>
  );
}

function PreviewExperienceSections({
  sections,
  color
}: {
  sections: Array<{ key: ExperienceKey; title: string; items: string[] }>;
  color: string;
}) {
  return (
    <>
      {sections.map((section) => (
        <PreviewBlock key={section.key} title={section.title} color={color}>
          <ul className="list-disc space-y-1 pl-5">
            {section.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </PreviewBlock>
      ))}
    </>
  );
}

function PreviewCard({
  title,
  color,
  children
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border bg-slate-50/80 p-4 text-sm leading-6">
      <h4 className="text-base font-semibold" style={{ color }}>
        {title}
      </h4>
      <div className="mt-2 text-slate-800">{children}</div>
    </section>
  );
}

function buildGeneratedResume({
  identity,
  templateId,
  name,
  targetRole,
  education,
  summary,
  experiences,
  skills,
  certificates,
  awards
}: {
  identity: Identity;
  templateId: ResumeTemplateId;
  name: string;
  targetRole: string;
  education: string;
  summary: string;
  experiences: Record<ExperienceKey, string>;
  skills: string;
  certificates: string;
  awards: string;
}): ResumeData {
  const resume = createEmptyResume("manual");
  const role = targetRole.trim() || "通用简历";

  return {
    ...resume,
    name: `${name.trim() || "未命名"}的 AI 生成简历`,
    updatedAt: new Date().toISOString(),
    templateId,
    basics: {
      ...resume.basics,
      name: name.trim(),
      title: role,
      summary: summary.trim() || buildSummary(targetRole)
    },
    education: education.trim()
      ? [
          createEntry({
            title: identity === "student" ? "在读" : "学历经历",
            organization: education.trim(),
            description: ["围绕目标方向补充课程、成绩、校园成果或相关训练。"]
          })
        ]
      : [],
    workExperience: toEntries(experiences.workExperience, targetRole || "相关工作经历"),
    internships: toEntries(experiences.internships, targetRole || "相关实习经历"),
    projects: toEntries(experiences.projects, "项目经历"),
    campusExperience: toEntries(experiences.campusExperience, "校园经历"),
    otherExperience: toEntries(experiences.otherExperience, "其他经历"),
    skills: splitList(skills),
    certificates: splitList(certificates),
    awards: splitList(awards),
    sectionOrder: [
      "basics",
      "education",
      identity === "student" ? "internships" : "workExperience",
      "projects",
      "campusExperience",
      "otherExperience",
      "skills",
      "certificates",
      "awards"
    ]
  };
}

function buildPreviewSections(identity: Identity, experiences: Record<ExperienceKey, string>) {
  const order: ExperienceKey[] =
    identity === "student"
      ? ["internships", "projects", "campusExperience", "workExperience", "otherExperience"]
      : ["workExperience", "projects", "internships", "campusExperience", "otherExperience"];

  return order
    .map((key) => ({
      key,
      title: experienceLabels[key],
      items: splitLines(experiences[key]).slice(0, 5)
    }))
    .filter((section) => section.items.length > 0);
}

function toEntries(value: string, title: string): ResumeEntry[] {
  const description = splitLines(value);
  if (!description.length) return [];
  return [
    createEntry({
      title,
      organization: "AI 生成经历",
      description
    })
  ];
}

function createEntry({
  title,
  organization,
  description
}: {
  title: string;
  organization: string;
  description: string[];
}): ResumeEntry {
  return {
    id: `entry-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    organization,
    description
  };
}

function polishExperience(value: string, sectionName: string, targetRole: string) {
  const trimmed = value.trim().replace(/[。；;]$/, "");
  const rolePrefix = targetRole ? `面向${targetRole}方向，` : "";
  const sectionFocus = {
    工作经历: "围绕业务目标、执行动作和结果产出",
    实习经历: "突出学习速度、协作过程和实际产出",
    项目经历: "说明项目背景、个人职责、方法和结果",
    校园经历: "强调组织协调、活动执行和影响范围",
    其他经历: "提炼经历亮点、个人贡献和能力证明"
  }[sectionName] ?? "提炼关键动作和结果";

  return `${rolePrefix}${sectionFocus}，${trimmed}，沉淀为可复用的经历成果。`;
}

function buildSummary(targetRole: string) {
  if (!targetRole.trim()) {
    return "具备良好的学习能力、沟通协作能力和结构化表达能力，能够结合过往经历快速适应不同任务场景。";
  }

  return `具备${targetRole.trim()}相关基础能力，能够结合过往经历理解岗位要求，并持续沉淀可复用的方法和成果。`;
}

function getTemplateStyle(templateId: ResumeTemplateId) {
  const styles: Partial<
    Record<
      ResumeTemplateId,
      { accent: string; headerClass: string; surfaceClass: string; layout: "single" | "banner" | "sidebar" | "cards" }
    >
  > = {
    classic: { accent: "#334155", headerClass: "border-b pb-4", surfaceClass: "", layout: "single" },
    ats: { accent: "#475569", headerClass: "border-b pb-4", surfaceClass: "font-serif", layout: "single" },
    formalScholar: { accent: "#111827", headerClass: "border-b-2 pb-4", surfaceClass: "font-serif", layout: "single" },
    graduateBluePro: { accent: "#2563eb", headerClass: "rounded-md bg-blue-50 p-4", surfaceClass: "", layout: "banner" },
    socialTealPro: { accent: "#0f766e", headerClass: "rounded-md bg-teal-50 p-4", surfaceClass: "", layout: "sidebar" },
    modern: { accent: "#2563eb", headerClass: "rounded-md bg-slate-50 p-4", surfaceClass: "", layout: "cards" }
  };

  return styles[templateId] ?? styles.classic!;
}

function formatListPreview(values: string[]) {
  return values.flatMap(splitList).filter(Boolean).join(" / ");
}

function splitLines(value: string) {
  return value
    .split(/\r?\n|[；;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitList(value: string) {
  return value
    .split(/\r?\n|[、,，；;]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function readResumes(): ResumeData[] {
  const raw = window.localStorage.getItem(RESUME_STORAGE_KEY);
  if (!raw) return [demoResume];

  try {
    return (JSON.parse(raw) as ResumeData[]).map(normalizeResume);
  } catch {
    return [demoResume];
  }
}
