/**
 * Builds docs/CAITS_PRODUCT_FUNCTIONAL_GUIDE.pdf from the Markdown guide.
 * Usage (from repo root):
 *   npm install --prefix docs/pdf-tools
 *   node --import ./docs/pdf-tools/register.mjs docs/build-guide-pdf.mjs
 *   (or simply: node docs/build-guide-pdf.mjs after setting NODE_PATH)
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(__dirname, 'pdf-tools', 'package.json'));
const { marked } = require('marked');
const puppeteer = require('puppeteer');
const mdPath = path.join(__dirname, 'CAITS_PRODUCT_FUNCTIONAL_GUIDE.md');
const htmlPath = path.join(__dirname, 'CAITS_PRODUCT_FUNCTIONAL_GUIDE.html');
const pdfPath = path.join(__dirname, 'CAITS_PRODUCT_FUNCTIONAL_GUIDE.pdf');

const md = fs.readFileSync(mdPath, 'utf8');

const renderer = new marked.Renderer();
const defaultCode = renderer.code.bind(renderer);
renderer.code = function (code, infostring, escaped) {
  const lang = (infostring || '').trim().split(/\s+/)[0];
  if (lang === 'mermaid') {
    const text = typeof code === 'string' ? code : code?.text ?? String(code);
    return `<pre class="mermaid">${escapeHtml(text)}</pre>\n`;
  }
  // marked v15+ passes a token object
  if (typeof code === 'object' && code !== null) {
    return defaultCode(code);
  }
  return defaultCode(code, infostring, escaped);
};

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

marked.setOptions({ renderer, gfm: true, breaks: false });
const bodyHtml = marked.parse(md);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>CAITS — Product Functional Guide</title>
  <style>
    :root {
      --ink: #0f3d45;
      --muted: #5a6b73;
      --teal: #0d7377;
      --line: #d8e2e6;
      --bg: #ffffff;
    }
    * { box-sizing: border-box; }
    body {
      font-family: "Segoe UI", Calibri, Arial, sans-serif;
      color: var(--ink);
      line-height: 1.55;
      font-size: 11pt;
      margin: 0;
      padding: 28px 36px 48px;
      background: var(--bg);
    }
    h1 {
      font-size: 26pt;
      color: var(--teal);
      margin: 0 0 12px;
      page-break-after: avoid;
    }
    h2 {
      font-size: 16pt;
      color: var(--teal);
      border-bottom: 2px solid var(--line);
      padding-bottom: 6px;
      margin-top: 28px;
      page-break-after: avoid;
    }
    h3 {
      font-size: 13pt;
      color: #14919b;
      margin-top: 20px;
      page-break-after: avoid;
    }
    h4 {
      font-size: 11.5pt;
      color: #1c4b82;
      page-break-after: avoid;
    }
    p, li { orphans: 3; widows: 3; }
    a { color: #0d7377; text-decoration: none; }
    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 12px 0 18px;
      border-radius: 8px;
      page-break-inside: avoid;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 18px;
      font-size: 10pt;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid var(--line);
      padding: 7px 9px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #e8f4f5;
      color: var(--teal);
      font-weight: 700;
    }
    blockquote {
      margin: 12px 0;
      padding: 10px 14px;
      border-left: 4px solid var(--teal);
      background: #f0f7f8;
      color: var(--muted);
    }
    hr {
      border: none;
      border-top: 1px solid var(--line);
      margin: 24px 0;
    }
    code {
      font-family: Consolas, "Courier New", monospace;
      font-size: 0.92em;
      background: #f1f3f5;
      padding: 1px 5px;
      border-radius: 4px;
    }
    pre:not(.mermaid) {
      background: #f1f3f5;
      padding: 12px;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 9.5pt;
    }
    pre.mermaid {
      background: #f7fafb;
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 16px;
      text-align: center;
      page-break-inside: avoid;
      margin: 14px 0 20px;
    }
    .mermaid svg { max-width: 100%; height: auto; }
    @page {
      size: A4;
      margin: 14mm 12mm 16mm;
    }
    @media print {
      body { padding: 0; }
      a[href]::after { content: ""; }
    }
  </style>
</head>
<body>
${bodyHtml}
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
  mermaid.initialize({
    startOnLoad: true,
    securityLevel: 'loose',
    theme: 'base',
    themeVariables: {
      primaryColor: '#e6fcf5',
      primaryTextColor: '#0f3d45',
      primaryBorderColor: '#0d7377',
      lineColor: '#5a6b73',
      secondaryColor: '#e7f5ff',
      tertiaryColor: '#fff7ed',
      fontFamily: 'Segoe UI, Arial, sans-serif'
    }
  });
  await mermaid.run();
  document.documentElement.setAttribute('data-mermaid-ready', 'true');
</script>
</body>
</html>`;

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Wrote', htmlPath);

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.goto(pathToFileURL(htmlPath).href, {
  waitUntil: 'networkidle0',
  timeout: 120000,
});
await page.waitForFunction(
  () => document.documentElement.getAttribute('data-mermaid-ready') === 'true',
  { timeout: 90000 },
);
// Extra settle for SVG layout
await new Promise((r) => setTimeout(r, 1500));

await page.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  margin: { top: '14mm', bottom: '16mm', left: '12mm', right: '12mm' },
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate: `
    <div style="width:100%;font-size:9px;color:#5a6b73;padding:0 12mm;display:flex;justify-content:space-between;">
      <span>CAITS Product Functional Guide</span>
      <span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span>
    </div>`,
});

await browser.close();
console.log('Wrote', pdfPath);
