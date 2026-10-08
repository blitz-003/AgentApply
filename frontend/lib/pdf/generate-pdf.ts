import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import type { SkillGroup } from "@/types/resume";

/** @deprecated Use SkillGroup from @/types/resume. */
export type SkillCategory = SkillGroup;

export interface ResumeData {
  personal_info?: Record<string, string>;
  summary?: string;
  experience?: Array<Record<string, string>>;
  education?: Array<Record<string, string>>;
  skills?: string[] | SkillGroup[];
  projects?: Array<Record<string, string>>;
  achievements?: string[];
  languages?: Array<string | Record<string, string>>;
  certifications?: Array<string | Record<string, string>>;
}

function escapeHtml(str: unknown): string {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// A4 page geometry in millimetres. Each document type renders a full A4 page
// whose padding IS the margin box, so placing the captured image 1:1 at
// (0,0,210,297) reproduces those margins exactly. The editor preview shows the
// same full-page HTML scaled down, so preview == download (fonts, styles,
// margins all included).
export interface PdfGeometry {
  topMm: number;
  sideMm: number;
  bottomMm: number;
}

export const PAGE_WIDTH_MM = 210;
export const PAGE_HEIGHT_MM = 297;

function mmToPx(mm: number): number {
  return (mm / 25.4) * 96;
}
export const PAGE_WIDTH_PX = mmToPx(PAGE_WIDTH_MM);
export const PAGE_HEIGHT_PX = mmToPx(PAGE_HEIGHT_MM);

// Resume margins: 0.5in top / left / right, 0.35in bottom.
export const RESUME_GEOMETRY: PdfGeometry = {
  topMm: 12.7,
  sideMm: 12.7,
  bottomMm: 8.89,
};

// Cover letter margins: 0.77in on every side (same units as the resume).
export const COVER_LETTER_GEOMETRY: PdfGeometry = {
  topMm: 19.558,
  sideMm: 19.558,
  bottomMm: 19.558,
};

/**
 * Wrap inner content in a full A4 page whose padding is the margin box. Because
 * the margins are part of the HTML itself, the exported capture and the editor
 * preview render the exact same page, and html2canvas output maps 1:1 onto the
 * PDF sheet. `min-height` on the content keeps a short page fully filled so
 * the bottom margin never inflates.
 */
function pageShell(
  geometry: PdfGeometry,
  inner: string,
  fontFamily: string,
  lineHeight: string
): string {
  const topPx = mmToPx(geometry.topMm);
  const sidePx = mmToPx(geometry.sideMm);
  const bottomPx = mmToPx(geometry.bottomMm);
  const contentHeightPx = PAGE_HEIGHT_PX - topPx - bottomPx;
  return (
    `<div style="box-sizing: border-box; width: ${PAGE_WIDTH_PX}px; min-height: ${PAGE_HEIGHT_PX}px; ` +
    `padding: ${topPx}px ${sidePx}px ${bottomPx}px; background: #ffffff; margin: 0 auto; ` +
    `font-family: ${fontFamily}; color: #000000; line-height: ${lineHeight}; ` +
    `overflow-wrap: break-word; word-wrap: break-word;">` +
    `<div style="min-height: ${contentHeightPx}px;">${inner}</div>` +
    `</div>`
  );
}

// Compact-content rules required for a single page.
const SUMMARY_MAX_SENTENCES = 3;
const SKILLS_MAX_CATEGORY_ROWS = 3;
const SKILLS_STRONG_CATEGORIES = 2;
const OTHERS_CATEGORY = "Others";
const ACHIEVEMENTS_MAX = 2;
const CERTIFICATIONS_MAX = 2;
const EXPERIENCE_MAX = 4;
const PROJECTS_MAX = 3;
const EDUCATION_MAX = 3;

/** Keep only the first n sentences without splitting abbreviations or decimals. */
function clampSentences(text: string, max: number): string {
  const normalized = String(text ?? "").replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  // Protect common abbreviations and version numbers from being treated as
  // sentence boundaries.
  const guarded = normalized
    .replace(/\b(Mr|Mrs|Ms|Dr|Prof|Sr|Jr|Inc|Ltd|Co|vs|etc|e\.g|i\.e)\./gi, "$1<DOT>")
    .replace(/(\d)\.(\d)/g, "$1<DOT>$2");
  const parts = guarded.split(/(?<=[.!?])\s+/);
  const kept: string[] = [];
  for (const part of parts) {
    if (kept.length >= max) break;
    kept.push(part.replace(/<DOT>/g, ".").trim());
  }
  let result = kept.join(" ").trim();
  if (result && !/[.!?]$/.test(result)) result += ".";
  return result;
}

/**
 * Trim text to fit a single line, hard clipping with no ellipsis.
 * The requirement is one line per item, so the overflow is cut rather than
 * silently moved onto a second line.
 */
function clipToSingleLine(text: unknown): string {
  return String(text ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, CLIP_MAX_CHARS);
}

const CLIP_MAX_CHARS = 90;

interface FlatSkill {
  name: string;
  category: string;
}

/** Flatten grouped and flat skill shapes into one list of named skills. */
function flattenSkills(skills: string[] | SkillGroup[]): FlatSkill[] {
  const out: FlatSkill[] = [];
  for (const entry of skills) {
    if (typeof entry === "string") {
      const name = entry.trim();
      if (name) out.push({ name, category: "" });
      continue;
    }
    if (!entry || typeof entry !== "object") continue;
    const category = String(entry.category ?? "").trim();
    for (const item of entry.items ?? []) {
      const name = String(item ?? "").trim();
      if (name) out.push({ name, category });
    }
  }
  return out;
}

/**
 * Reduce skills to the two strongest categories plus an "Others" bucket, and cap
 * the number of rendered rows so the section cannot grow without bound.
 */
function compactSkillGroups(skills: string[] | SkillGroup[]): SkillGroup[] {
  const flat = flattenSkills(skills);
  if (flat.length === 0) return [];

  const counts = new Map<string, number>();
  for (const s of flat) {
    const key = s.category || OTHERS_CATEGORY;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const ranked = [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
  );

  const strong = ranked
    .filter(([name]) => name !== OTHERS_CATEGORY)
    .slice(0, SKILLS_STRONG_CATEGORIES)
    .map(([name]) => name);
  const rest = ranked.filter(([name]) => !strong.includes(name));

  const groups: SkillGroup[] = strong.map((category) => ({
    category,
    items: flat.filter((s) => s.category === category).map((s) => s.name),
  }));

  if (rest.length > 0) {
    groups.push({
      category: OTHERS_CATEGORY,
      items: flat.filter((s) => {
        const key = s.category || OTHERS_CATEGORY;
        return rest.some(([name]) => name === key);
      }).map((s) => s.name),
    });
  }

  // Keep the two strongest categories intact; if they alone exceed the row cap,
  // trim items inside them rather than dropping a whole group.
  if (groups.length > SKILLS_MAX_CATEGORY_ROWS) {
    return groups.slice(0, SKILLS_MAX_CATEGORY_ROWS);
  }
  return groups;
}

async function renderToPdf(html: string, filename: string): Promise<void> {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  // The HTML is a full A4 page with its margins baked in as padding, so the
  // capture maps 1:1 onto the PDF sheet: image (0,0) -> page (0,0) at 210x297mm.
  container.style.width = `${PAGE_WIDTH_PX}px`;
  container.style.minHeight = `${PAGE_HEIGHT_PX}px`;
  container.style.background = "white";
  container.innerHTML = html;
  document.body.appendChild(container);

  await new Promise((resolve) => setTimeout(resolve, 800));

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const pdf = new jsPDF("p", "mm", "a4");
    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    // The capture is the whole sheet. When the content fits (the enforced
    // single-page case) the image is drawn at full page size and the margins --
    // which live inside the HTML -- land exactly where the geometry specifies.
    // Only if the document still overflows do we shrink it to keep one page.
    const naturalHeightMm = (canvas.height * PAGE_WIDTH_MM) / canvas.width;
    if (naturalHeightMm <= PAGE_HEIGHT_MM) {
      pdf.addImage(imgData, "JPEG", 0, 0, PAGE_WIDTH_MM, PAGE_HEIGHT_MM);
    } else {
      // Content taller than one page: shrink it to fit the sheet height and
      // centre it horizontally so any residual space is split evenly instead of
      // leaving a blank band on the right edge.
      const scale = PAGE_HEIGHT_MM / naturalHeightMm;
      const scaledWidth = PAGE_WIDTH_MM * scale;
      const x = (PAGE_WIDTH_MM - scaledWidth) / 2;
      pdf.addImage(imgData, "JPEG", x, 0, scaledWidth, PAGE_HEIGHT_MM);
    }

    const scaleToFit = Math.min(1, PAGE_HEIGHT_MM / naturalHeightMm);
    if (scaleToFit < 1) {
      console.warn(
        `Page content exceeded one page and was scaled to ${(scaleToFit * 100).toFixed(1)}% to fit.`
      );
    }

    pdf.save(filename);
  } catch (err) {
    console.error("PDF generation failed:", err);
    throw new Error("Failed to generate PDF. Please try again.");
  } finally {
    document.body.removeChild(container);
  }
}

function descParagraphs(text: unknown): string {
  if (!text) return "";
  const lines = Array.isArray(text) ? text.join("\n") : String(text);
  return lines.split("\n").filter(Boolean).map((line) =>
    `<p style="font-size: 10pt; color: #000000; margin: 0 0 2px 0;">${escapeHtml(line)}</p>`
  ).join("\n");
}

export interface RenderResumeOptions {
  /**
   * Apply the single-page A4 rules: cap every section and clip long lines, and
   * render at the exact printable box size. Used by both the export and the
   * editor preview so the on screen page matches the downloaded PDF.
   */
  compact?: boolean;
}

export function renderResumeHtml(
  data: ResumeData,
  options: RenderResumeOptions = {}
): string {
  const compact = options.compact === true;
  const pi = data.personal_info || {};
  // Content is compacted before rendering so the document fits one page by
  // construction rather than by cropping.
  const summary = compact
    ? clampSentences(data.summary || "", SUMMARY_MAX_SENTENCES)
    : data.summary || "";
  const cap = <T>(items: T[] | undefined, limit: number): T[] =>
    compact ? (items || []).slice(0, limit) : items || [];
  const experience = cap(data.experience, EXPERIENCE_MAX);
  const education = cap(data.education, EDUCATION_MAX);
  const skills = compact
    ? compactSkillGroups(data.skills || [])
    : ([] as SkillGroup[]).concat(
        ...((data.skills || []).map((s) =>
          typeof s === "string" ? [{ category: "", items: [s] }] : [s]
        ) as SkillGroup[][])
      );
  const projects = cap(data.projects, PROJECTS_MAX);
  const achievements = cap(data.achievements, ACHIEVEMENTS_MAX);
  const languages = cap(data.languages, 3);
  const certifications = cap(data.certifications, CERTIFICATIONS_MAX);
  const clipLine = (text: unknown): string =>
    compact ? clipToSingleLine(text) : String(text ?? "").trim();

let sections = "";

  sections += `<div style="text-align: center; margin-bottom: 14px;">`;
  sections += `<div style="font-size: 12pt; margin-bottom: 2px;">${escapeHtml(pi.name || "Your Name")}</div>`;
  if (pi.title) {
    sections += `<div style="font-size: 9.5pt; margin-bottom: 2px;">${escapeHtml(pi.title)}</div>`;
  }
  const contacts: string[] = [];
  if (pi.email) contacts.push(escapeHtml(pi.email));
  if (pi.phone) contacts.push(escapeHtml(pi.phone));
  if (pi.location) contacts.push(escapeHtml(pi.location));
  if (pi.linkedin) contacts.push(escapeHtml(pi.linkedin));
  if (pi.github) contacts.push(escapeHtml(pi.github));
  if (contacts.length > 0) {
    sections += `<div style="font-size: 9.5pt;">${contacts.join(' <span style="color: #000000;">|</span> ')}</div>`;
  }
  sections += `</div>`;

  if (summary) {
    sections += `<div style="margin-bottom: 12px;">`;
    sections += `<div style="font-size: 10pt; font-weight: 400; text-transform: uppercase; margin-bottom: 2px;">CAREER SUMMARY</div>`;
    sections += `<p style="font-size: 10pt; color: #000000; margin: 0;">${escapeHtml(summary)}</p>`;
    sections += `</div>`;
  }

  if (skills.length > 0) {
    sections += `<div style="margin-bottom: 10px;">`;
    sections += `<div style="font-size: 10pt; font-weight: 400; text-transform: uppercase; margin-bottom: 2px;">TECHNICAL SKILLS</div>`;
    // One row per category: at most the two strongest plus "Others" when
    // compacting, or every stored category in the editor preview.
    for (const cat of skills as SkillGroup[]) {
      const items = (cat.items || []).join(", ");
      if (cat.category) {
        sections += `<div style="font-size: 10pt; color: #000000;"><strong>${escapeHtml(cat.category)}:</strong> ${escapeHtml(items)}</div>`;
      } else {
        sections += `<div style="font-size: 10pt; color: #000000;">${escapeHtml(items)}</div>`;
      }
    }
    sections += `</div>`;
  }

  if (experience.length > 0) {
    sections += `<div style="margin-bottom: 12px;">`;
    sections += `<div style="font-size: 10pt; font-weight: 400; text-transform: uppercase; margin-bottom: 2px;">WORK EXPERIENCE</div>`;
    for (const exp of experience) {
      const parts: string[] = [];
      if (exp.company) parts.push(`<strong>${escapeHtml(exp.company)}</strong>`);
      if (exp.position) parts.push(escapeHtml(exp.position));
      if (exp.location) parts.push(escapeHtml(exp.location));
      if (exp.start_date || exp.end_date) {
        parts.push(`${escapeHtml(exp.start_date || "")}${exp.start_date && exp.end_date ? " – " : ""}${escapeHtml(exp.end_date || "Present")}`);
      }
      sections += `<div style="margin-bottom: 6px;">`;
      sections += `<div style="font-size: 9.5pt;">${parts.join(' | ')}</div>`;
      sections += descParagraphs(exp.description || "");
      sections += `</div>`;
    }
    sections += `</div>`;
  }

  if (projects.length > 0) {
    sections += `<div style="margin-bottom: 12px;">`;
    sections += `<div style="font-size: 10pt; font-weight: 400; text-transform: uppercase; margin-bottom: 2px;">KEY PROJECTS</div>`;
    for (let i = 0; i < projects.length; i++) {
      const proj = projects[i];
      const techLabel = proj.tech_stack || proj.technologies || "";
      sections += `<div style="margin-bottom: 6px;">`;
      sections += `<div style="font-size: 9.5pt;"><strong>${i + 1}. ${escapeHtml(proj.title || "Project")}</strong>${techLabel ? ` | ${escapeHtml(techLabel)}` : ""}</div>`;
      sections += descParagraphs(proj.description || "");
      sections += `</div>`;
    }
    sections += `</div>`;
  }

  if (education.length > 0) {
    sections += `<div style="margin-bottom: 12px;">`;
    sections += `<div style="font-size: 10pt; font-weight: 400; text-transform: uppercase; margin-bottom: 2px;">EDUCATION</div>`;
    for (const edu of education) {
      const instParts: string[] = [];
      if (edu.institution) instParts.push(escapeHtml(edu.institution));
      if (edu.location) instParts.push(escapeHtml(edu.location));
      sections += `<div style="margin-bottom: 6px;">`;
      if (instParts.length > 0) {
        sections += `<div style="font-size: 10pt;">${instParts.join(', ')}</div>`;
      }
      const degreeParts: string[] = [];
      if (edu.degree || edu.field) {
        degreeParts.push(`${escapeHtml(edu.degree || "")}${edu.degree && edu.field ? " " : ""}${escapeHtml(edu.field || "")}`);
      }
      if (edu.start_date || edu.end_date) {
        degreeParts.push(`${escapeHtml(edu.start_date || "")}${edu.start_date && edu.end_date ? " – " : ""}${escapeHtml(edu.end_date || "")}`);
      }
      if (degreeParts.length > 0) {
        sections += `<div style="font-size: 10pt;">${degreeParts.join(' | ')}</div>`;
      }
      sections += `</div>`;
    }
    sections += `</div>`;
  }

  if (achievements.length > 0) {
    sections += `<div style="margin-bottom: 10px;">`;
    sections += `<div style="font-size: 10pt; font-weight: 400; text-transform: uppercase; margin-bottom: 2px;">ACHIEVEMENTS</div>`;
    // At most two points, each hard-clipped to a single line on export.
    // No overflow: hidden -- html2canvas miscuts such lines vertically. The 90
    // char clip keeps the line within the pane, wrapping is disabled instead.
    for (const a of achievements) {
      const clipStyle = compact ? "white-space: nowrap;" : "";
      sections += `<div style="font-size: 10pt; color: #000000; margin: 0; ${clipStyle}">• ${escapeHtml(clipLine(a))}</div>`;
    }
    sections += `</div>`;
  }

  if (languages.length > 0) {
    sections += `<div style="margin-bottom: 12px;">`;
    sections += `<div style="font-size: 10pt; font-weight: 400; text-transform: uppercase; margin-bottom: 2px;">LANGUAGES</div>`;
    const langStrs = languages.map((l) =>
      typeof l === "string" ? escapeHtml(l) : escapeHtml(`${l.language || ""}${l.proficiency ? ` (${l.proficiency})` : ""}`)
    );
    sections += `<div style="font-size: 10pt; color: #000000;">${langStrs.join(' | ')}</div>`;
    sections += `</div>`;
  }

  if (certifications.length > 0) {
    sections += `<div style="margin-bottom: 10px;">`;
    sections += `<div style="font-size: 10pt; font-weight: 400; text-transform: uppercase; margin-bottom: 2px;">CERTIFICATIONS</div>`;
    // All certifications on a single line, hard-clipped, at most two. No overflow:
    // hidden -- html2canvas miscuts such lines vertically (text cut from below).
    const certText = certifications
      .map((cert) => {
        if (typeof cert === "string") return cert;
        const parts: string[] = [];
        if (cert.name) parts.push(String(cert.name));
        if (cert.issuer) parts.push(String(cert.issuer));
        if (cert.date) parts.push(String(cert.date));
        return parts.join(" | ");
      })
      .filter(Boolean)
      .join(" | ");
    const clipStyle = compact ? "white-space: nowrap;" : "";
    sections += `<div style="font-size: 10pt; color: #000000; ${clipStyle}">${escapeHtml(clipLine(certText))}</div>`;
    sections += `</div>`;
  }

  return pageShell(
    RESUME_GEOMETRY,
    sections,
    "'Helvetica Neue', Helvetica, Arial, sans-serif",
    "1.2"
  );
}

function stripAddressBlock(text: string): string {
  const lines = text.split('\n');
  const start = lines.findIndex(l => /^(Dear|To|Hello|Greetings|Hi)\b/i.test(l.trim()));
  return start >= 0 ? lines.slice(start).join('\n') : text;
}

function renderClosingBlock(paragraphs: string[], signOffIndex: number): string {
  // The sign-off is the "Yours sincerely," line plus the name/position rows that
  // follow it. Render them flush left in one block instead of treating "Yours
  // sincerely," as an indented body paragraph.
  const signOff = paragraphs
    .slice(signOffIndex)
    .map((p) => escapeHtml(p.trim()).replace(/\n/g, '<br>'))
    .join('<br>');
  return `<div style="font-size: 10.5pt; color: #000000; margin-top: 18px;">${signOff}</div>`;
}

export function renderCoverLetterHtml(letter: {
  content: string;
  job_title?: string;
  company_name?: string;
}): string {
  const stripped = stripAddressBlock(letter.content);
  const normalized = stripped.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  const paragraphs = normalized.split('\n\n').filter(Boolean);

  const signOffIndex = paragraphs.findIndex((p) => /^Yours sincerely[,:]?$/i.test(p.trim()));
  const body = signOffIndex >= 0 ? paragraphs.slice(0, signOffIndex) : paragraphs;

  const sections = `<div style="margin-bottom: 12px; text-align: center;">
        <div style="font-size: 12pt; font-weight: 400; text-transform: uppercase; margin-bottom: 3px;">COVER LETTER</div>
        <div style="font-size: 12pt; color: #000000;">
          <strong>${escapeHtml(letter.job_title)}</strong>
          ${letter.company_name ? ` | <span>${escapeHtml(letter.company_name)}</span>` : ""}
        </div>
      </div>
      <div style="font-size: 10.5pt; color: #000000; line-height: 1.45;">
        ${body.map((p, i, arr) =>
          `<p style="margin: 0 0 18px 0; line-height: 1.45;${i > 0 && i < arr.length - 1 ? ' text-indent: 2em;' : ''}">${escapeHtml(p.trim()).replace(/\n/g, '<br>')}</p>`
        ).join('')}
        ${signOffIndex >= 0 ? renderClosingBlock(paragraphs, signOffIndex) : ''}
      </div>`;
  return pageShell(
    COVER_LETTER_GEOMETRY,
    sections,
    "'Helvetica Neue', Helvetica, Arial, sans-serif",
    "1.45"
  );
}

export async function generateResumePDF(
  resumeData: ResumeData,
  filename?: string
): Promise<void> {
  // compact: the exported page must fit A4, so sections are capped and lines
  // clipped here; the editor preview renders the same compact page so the on
  // screen scale matches the downloaded file.
  const html = renderResumeHtml(resumeData, { compact: true });
  const name = resumeData.personal_info?.name || "Resume";
  const safeName = String(name).replace(/[^a-zA-Z0-9]/g, "_");
  await renderToPdf(html, filename || `${safeName}_Resume.pdf`);
}

export async function generateCoverLetterPDF(
  coverLetter: {
    content: string;
    job_title?: string;
    company_name?: string;
  },
  filename: string
): Promise<void> {
  const html = renderCoverLetterHtml(coverLetter);
  await renderToPdf(html, filename);
}

export async function downloadAll(
  resumeData: ResumeData,
  coverLetter: {
    content: string;
    job_title?: string;
    company_name?: string;
  },
  baseName: string
): Promise<void> {
  const safeBase = String(baseName).replace(/[^a-zA-Z0-9]/g, "_");
  const resumePromise = generateResumePDF(resumeData, `${safeBase}_Resume.pdf`);
  const clPromise = generateCoverLetterPDF(
    coverLetter,
    `${safeBase}_Cover_Letter.pdf`
  );
  await Promise.all([resumePromise, clPromise]);
}
