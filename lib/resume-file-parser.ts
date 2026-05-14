export async function extractResumeTextFromFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "json" || extension === "txt" || extension === "md") {
    return file.text();
  }

  if (extension === "docx") {
    return extractDocxText(file);
  }

  if (extension === "pdf") {
    return extractPdfText(file);
  }

  if (extension === "doc") {
    throw new Error("暂不支持旧版 .doc 格式，请先另存为 .docx 后再上传。");
  }

  throw new Error("暂不支持该文件格式，请上传 JSON、TXT、MD、PDF 或 DOCX。");
}

interface PdfJsGlobal {
  GlobalWorkerOptions: {
    workerSrc: string;
  };
  getDocument(input: { data: Uint8Array }): {
    promise: Promise<{
      numPages: number;
      getPage(pageNumber: number): Promise<{
        getTextContent(): Promise<{
          items: Array<{ str?: string; transform?: number[]; hasEOL?: boolean }>;
        }>;
      }>;
    }>;
  };
}

declare global {
  interface Window {
    pdfjsLib?: PdfJsGlobal;
  }
}

async function extractDocxText(file: File) {
  const mammoth = await import("mammoth/mammoth.browser");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const text = result.value.trim();

  if (!text) {
    throw new Error("DOCX 中没有识别到可解析文本。");
  }

  return text;
}

async function extractPdfText(file: File) {
  const pdfjs = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.js";
  const task = pdfjs.getDocument({
    data: new Uint8Array(arrayBuffer)
  });
  const pdf = await task.promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = rebuildPdfPageLines(content.items);

    if (text) pages.push(text);
  }

  const text = pages.join("\n").trim();

  if (!text) {
    throw new Error("PDF 中没有识别到可解析文本，可能是扫描图片版 PDF。");
  }

  return text;
}

function rebuildPdfPageLines(items: Array<{ str?: string; transform?: number[]; hasEOL?: boolean }>) {
  const rows = new Map<number, Array<{ x: number; text: string }>>();

  for (const item of items) {
    const text = item.str?.trim();
    if (!text) continue;

    const x = item.transform?.[4] ?? 0;
    const y = Math.round(item.transform?.[5] ?? 0);
    const row = rows.get(y) ?? [];
    row.push({ x, text });
    rows.set(y, row);
  }

  return Array.from(rows.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([, row]) =>
      removeAdjacentDuplicateTokens(
        row
          .sort((a, b) => a.x - b.x)
          .map((item) => item.text)
          .join(" ")
      )
    )
    .filter(Boolean)
    .join("\n");
}

function removeAdjacentDuplicateTokens(value: string) {
  const tokens = value.normalize("NFKC").replace(/\s+/g, " ").trim().split(" ");
  const result: string[] = [];

  for (const token of tokens) {
    if (token && token !== result[result.length - 1]) result.push(token);
  }

  return result.join(" ");
}

async function loadPdfJs() {
  if (window.pdfjsLib) return window.pdfjsLib;

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>("script[data-pdfjs]");
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("PDF.js 加载失败。")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "/pdfjs/pdf.min.js";
    script.async = true;
    script.dataset.pdfjs = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("PDF.js 加载失败。"));
    document.head.appendChild(script);
  });

  if (!window.pdfjsLib) {
    throw new Error("PDF.js 初始化失败。");
  }

  return window.pdfjsLib;
}
