import { ExecutionEnviornment } from "@/lib/types";
import { ExportToPDFTask } from "@/lib/workflow/task/ExportToPDF";
import puppeteer from "puppeteer";
import { storeFile, generateFileId } from "@/lib/fileStorage";

// Helper: escape HTML entities
const escapeHtml = (str: string): string => {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

// Lightweight Markdown to HTML renderer (covers common syntax)
const renderMarkdownBasic = (md: string): string => {
  let html = md || "";
  // Code blocks (```)
  html = html.replace(/```([\s\S]*?)```/g, (_m, p1) => `<pre><code>${escapeHtml(p1)}</code></pre>`);
  // Inline code
  html = html.replace(/`([^`]+)`/g, (_m, p1) => `<code>${escapeHtml(p1)}</code>`);
  // Bold and italics
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/_([^_]+)_/g, "<em>$1</em>");
  // Headings ###, ##, # (ordered so bigger comes first)
  html = html.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>");
  // Horizontal rules
  html = html.replace(/^---+$/gm, "<hr/>");
  // Ordered lists (simple lines). Grouping into a single list is handled below in block pass.
  html = html.replace(/^(\d+)\.\s+(.+)$/gm, (_m, num, item) => `<li value="${num}">${item}</li>`);
  // Unordered lists (simple lines)
  html = html.replace(/^[-*]\s+(.+)$/gm, (_m, item) => `<li>${item}</li>`);
  // Block pass: tables, grouped lists, paragraphs
  const renderTable = (block: string): string | null => {
    const lines = block.trim().split(/\n/);
    if (lines.length < 2) return null;
    const headerLine = lines[0];
    const sepLine = lines[1];
    // Detect markdown table separator row consisting of dashes and pipes with optional colons
    if (!/^\s*\|?\s*[:\-]+\s*(\|\s*[:\-]+\s*)+\|?\s*$/.test(sepLine)) return null;
    const parseRow = (line: string) => line
      .replace(/^\s*\|/, '')
      .replace(/\|\s*$/, '')
      .split('|')
      .map((c) => c.trim());
    const headers = parseRow(headerLine);
    const rows = lines.slice(2).map(parseRow);
    return `<table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  };

  html = html
    .split(/\n\n+/)
    .map((block: string) => {
      const b = block.trim();
      if (!b) return "";

      // Tables
      const tableHtml = renderTable(b);
      if (tableHtml) return tableHtml;

      // Group consecutive <li> items into lists
      if (/^(<li[\s\S]*><\/li>\n?)+$/.test(b)) {
        const isOrdered = /<li value="\d+">/.test(b);
        if (isOrdered) {
          // Preserve starting index from first li value
          const match = b.match(/<li value="(\d+)">/);
          const start = match ? Number(match[1]) : 1;
          return `<ol start="${start}">${b.replace(/<li value="\d+">/g, '<li>')}</ol>`;
        }
        return `<ul>${b}</ul>`;
      }

      // Existing block elements
      if (/^<(h\d|ul|ol|pre|blockquote|hr|table)/.test(b)) return b;
      // Paragraphs
      return `<p>${b.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");
  return html;
};

export async function ExportToPDFExecutor(
  enviornment: ExecutionEnviornment<typeof ExportToPDFTask>
): Promise<boolean> {
  try {
    const rawContent = enviornment.getInput("Content");
    const inputFileName = enviornment.getInput("File Name")?.trim();
    const fileBase = inputFileName || `ai-document-${Date.now()}`;

    enviornment.log.info("Starting PDF export...");

    // Build formatted HTML shell. If input isn't HTML, render lightweight Markdown.
    const isHtmlLike = /<[^>]+>/.test(rawContent || "");

    const contentHtml = isHtmlLike
      ? (rawContent || "")
      : renderMarkdownBasic(rawContent || "");

    const pageStyles = `
      @page { size: A4; margin: 20mm 15mm; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.7; color: #111827; }
      article { padding: 0; }
      h1,h2,h3 { font-weight: 700; margin: 1.2rem 0 0.6rem; }
      h1 { font-size: 1.8rem; }
      h2 { font-size: 1.4rem; }
      h3 { font-size: 1.2rem; }
      p { margin: 0.6rem 0; }
      code { background: #f3f4f6; border-radius: 4px; padding: 0 4px; }
      pre { background: #f3f4f6; padding: 12px; border-radius: 6px; overflow: auto; }
      ul,ol { margin: 0.5rem 0 0.5rem 1.2rem; }
      hr { border: none; border-top: 1px solid #e5e7eb; margin: 1rem 0; }
      table { width: 100%; border-collapse: collapse; margin: 0.8rem 0; }
      th, td { border: 1px solid #e5e7eb; padding: 8px; }
      img { max-width: 100%; height: auto; }
      .title { font-size: 1rem; color: #6b7280; }
    `;

    const htmlContent = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8"/>
          <title>${fileBase}</title>
          <style>${pageStyles}</style>
          <!-- KaTeX for LaTeX rendering -->
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" crossorigin="anonymous">
          <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js" crossorigin="anonymous"></script>
          <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js" crossorigin="anonymous"></script>
          <script>
            document.addEventListener('DOMContentLoaded', function(){
              if (window.renderMathInElement) {
                window.renderMathInElement(document.body, {
                  delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false},
                    {left: '\\(', right: '\\)', display: false},
                    {left: '\\[', right: '\\]', display: true}
                  ],
                  throwOnError: false
                });
              }
            });
          </script>
        </head>
        <body>
          <article>${contentHtml}</article>
        </body>
      </html>`;

    // Create or reuse browser
    let browser = enviornment.getBrowser();
    let createdBrowser = false;
    if (!browser) {
      browser = await puppeteer.launch({ headless: true });
      enviornment.setBrowser(browser);
      createdBrowser = true;
    }

    const page = await browser!.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    // Ensure LaTeX has rendered before printing
    try {
      await page.waitForFunction(() => (window as any).renderMathInElement, { timeout: 5000 });
      await page.evaluate(() => {
        const render = (window as any).renderMathInElement;
        if (render) {
          render(document.body, {
            delimiters: [
              {left: '$$', right: '$$', display: true},
              {left: '$', right: '$', display: false},
              {left: '\\(', right: '\\)', display: false},
              {left: '\\[', right: '\\]', display: true}
            ],
            throwOnError: false
          });
        }
      });
      await page.waitForSelector('.katex', { timeout: 3000 }).catch(() => {});
    } catch {}
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", right: "15mm", bottom: "20mm", left: "15mm" },
      displayHeaderFooter: true,
      headerTemplate: `<div style="font-size:10px; color:#6b7280; padding-left:10mm; padding-right:10mm; width:100%;"><span class="title">${fileBase}</span></div>`,
      footerTemplate: `<div style="font-size:10px; color:#6b7280; padding-left:10mm; padding-right:10mm; width:100%; display:flex; justify-content:flex-end;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>`
    });
    await page.close();

    if (createdBrowser) {
      await browser!.close();
    }

    // Prepare outputs
    const base64 = pdfBuffer.toString("base64");
    const pdfDataUrl = `data:application/pdf;base64,${base64}`;

    // Store to enable short auto-download URL
    const fileId = generateFileId();
    storeFile(fileId, base64, "application/pdf", `${fileBase}.pdf`);
    const autoDownloadUrl = `/api/download/pdf/${fileId}`;

    enviornment.setOutput("PDF Base64", pdfDataUrl);
    enviornment.setOutput("Download URL", pdfDataUrl);
    enviornment.setOutput("Auto Download", autoDownloadUrl);

    const sizeKB = Math.round(pdfBuffer.length / 1024);
    enviornment.log.info(`📄 Exported PDF ${sizeKB}KB, fileId=${fileId}`);
    enviornment.log.success("PDF export complete.");

    return true;
  } catch (error: any) {
    enviornment.log.error(`PDF export failed: ${error?.message || error}`);
    return false;
  }
}