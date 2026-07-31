import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import type { CoverLetter } from "@/types/ai";

export interface SkillCategory {
  category: string;
  items: string[];
}

export interface ResumeData {
  personal_info?: Record<string, string>;
  summary?: string;
  experience?: Array<Record<string, string>>;
  education?: Array<Record<string, string>>;
  skills?: string[] | SkillCategory[];
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

async function renderToPdf(html: string, filename: string): Promise<void> {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "800px";
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

    const imgWidth = 210;
    const pageHeight = 297;
    const rawHeight = (canvas.height * imgWidth) / canvas.width;
    const imgHeight = Math.min(rawHeight, pageHeight);
    const pdf = new jsPDF("p", "mm", "a4");
    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);

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

export function renderResumeHtml(data: ResumeData): string {
  const pi = data.personal_info || {};
  const summary = data.summary || "";
  const experience = data.experience || [];
  const education = data.education || [];
  const skills = data.skills || [];
  const projects = data.projects || [];
  const achievements = data.achievements || [];
  const languages = data.languages || [];
  const certifications = data.certifications || [];

  let html = `<div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #000000; line-height: 1.25; padding: 39px; max-width: 800px; margin: 0 auto; overflow-wrap: break-word; word-wrap: break-word;">`;

  html += `<div style="text-align: center; margin-bottom: 14px;">`;
  html += `<div style="font-size: 12pt; margin-bottom: 2px;">${escapeHtml(pi.name || "Your Name")}</div>`;
  if (pi.title) {
    html += `<div style="font-size: 9.5pt; margin-bottom: 2px;">${escapeHtml(pi.title)}</div>`;
  }
  const contacts: string[] = [];
  if (pi.email) contacts.push(escapeHtml(pi.email));
  if (pi.phone) contacts.push(escapeHtml(pi.phone));
  if (pi.location) contacts.push(escapeHtml(pi.location));
  if (pi.linkedin) contacts.push(escapeHtml(pi.linkedin));
  if (pi.github) contacts.push(escapeHtml(pi.github));
  if (contacts.length > 0) {
    html += `<div style="font-size: 9.5pt;">${contacts.join(' <span style="color: #000000;">|</span> ')}</div>`;
  }
  html += `</div>`;

  if (summary) {
    html += `<div style="margin-bottom: 12px;">`;
    html += `<div style="font-size: 10pt; font-weight: 400; text-transform: uppercase; margin-bottom: 2px;">CAREER SUMMARY</div>`;
    html += `<p style="font-size: 10pt; color: #000000; margin: 0;">${escapeHtml(summary)}</p>`;
    html += `</div>`;
  }

  if (skills.length > 0) {
    html += `<div style="margin-bottom: 12px;">`;
    html += `<div style="font-size: 10pt; font-weight: 400; text-transform: uppercase; margin-bottom: 2px;">TECHNICAL SKILLS</div>`;
    if (typeof skills[0] === "object" && skills[0] !== null && "category" in (skills[0] as SkillCategory)) {
      const cats = skills as SkillCategory[];
      for (const cat of cats) {
        const items = (cat.items || []).join(', ');
        html += `<div style="font-size: 10pt; color: #000000;"><strong>${escapeHtml(cat.category)}:</strong> ${escapeHtml(items)}</div>`;
      }
    } else {
      html += `<div style="font-size: 10pt; color: #000000;">${escapeHtml((skills as string[]).join(', '))}</div>`;
    }
    html += `</div>`;
  }

  if (experience.length > 0) {
    html += `<div style="margin-bottom: 12px;">`;
    html += `<div style="font-size: 10pt; font-weight: 400; text-transform: uppercase; margin-bottom: 2px;">WORK EXPERIENCE</div>`;
    for (const exp of experience) {
      const parts: string[] = [];
      if (exp.company) parts.push(`<strong>${escapeHtml(exp.company)}</strong>`);
      if (exp.position) parts.push(escapeHtml(exp.position));
      if (exp.location) parts.push(escapeHtml(exp.location));
      if (exp.start_date || exp.end_date) {
        parts.push(`${escapeHtml(exp.start_date || "")}${exp.start_date && exp.end_date ? " – " : ""}${escapeHtml(exp.end_date || "Present")}`);
      }
      html += `<div style="margin-bottom: 6px;">`;
      html += `<div style="font-size: 9.5pt;">${parts.join(' | ')}</div>`;
      html += descParagraphs(exp.description || "");
      html += `</div>`;
    }
    html += `</div>`;
  }

  if (projects.length > 0) {
    html += `<div style="margin-bottom: 12px;">`;
    html += `<div style="font-size: 10pt; font-weight: 400; text-transform: uppercase; margin-bottom: 2px;">KEY PROJECTS</div>`;
    for (let i = 0; i < projects.length; i++) {
      const proj = projects[i];
      const techLabel = proj.tech_stack || proj.technologies || "";
      html += `<div style="margin-bottom: 6px;">`;
      html += `<div style="font-size: 9.5pt;"><strong>${i + 1}. ${escapeHtml(proj.title || "Project")}</strong>${techLabel ? ` | ${escapeHtml(techLabel)}` : ""}</div>`;
      html += descParagraphs(proj.description || "");
      html += `</div>`;
    }
    html += `</div>`;
  }

  if (education.length > 0) {
    html += `<div style="margin-bottom: 12px;">`;
    html += `<div style="font-size: 10pt; font-weight: 400; text-transform: uppercase; margin-bottom: 2px;">EDUCATION</div>`;
    for (const edu of education) {
      const instParts: string[] = [];
      if (edu.institution) instParts.push(escapeHtml(edu.institution));
      if (edu.location) instParts.push(escapeHtml(edu.location));
      html += `<div style="margin-bottom: 6px;">`;
      if (instParts.length > 0) {
        html += `<div style="font-size: 10pt;">${instParts.join(', ')}</div>`;
      }
      const degreeParts: string[] = [];
      if (edu.degree || edu.field) {
        degreeParts.push(`${escapeHtml(edu.degree || "")}${edu.degree && edu.field ? " " : ""}${escapeHtml(edu.field || "")}`);
      }
      if (edu.start_date || edu.end_date) {
        degreeParts.push(`${escapeHtml(edu.start_date || "")}${edu.start_date && edu.end_date ? " – " : ""}${escapeHtml(edu.end_date || "")}`);
      }
      if (degreeParts.length > 0) {
        html += `<div style="font-size: 10pt;">${degreeParts.join(' | ')}</div>`;
      }
      html += `</div>`;
    }
    html += `</div>`;
  }

  if (achievements.length > 0) {
    html += `<div style="margin-bottom: 12px;">`;
    html += `<div style="font-size: 10pt; font-weight: 400; text-transform: uppercase; margin-bottom: 2px;">ACHIEVEMENTS</div>`;
    for (const a of achievements) {
      html += `<div style="font-size: 10pt; color: #000000; margin: 0;">\u2022 ${escapeHtml(a)}</div>`;
    }
    html += `</div>`;
  }

  if (languages.length > 0) {
    html += `<div style="margin-bottom: 12px;">`;
    html += `<div style="font-size: 10pt; font-weight: 400; text-transform: uppercase; margin-bottom: 2px;">LANGUAGES</div>`;
    const langStrs = languages.map((l) =>
      typeof l === "string" ? escapeHtml(l) : escapeHtml(`${l.language || ""}${l.proficiency ? ` (${l.proficiency})` : ""}`)
    );
    html += `<div style="font-size: 10pt; color: #000000;">${langStrs.join(' | ')}</div>`;
    html += `</div>`;
  }

  if (certifications.length > 0) {
    html += `<div style="margin-bottom: 12px;">`;
    html += `<div style="font-size: 10pt; font-weight: 400; text-transform: uppercase; margin-bottom: 2px;">CERTIFICATIONS</div>`;
    for (const cert of certifications) {
      const parts: string[] = [];
      if (typeof cert === "string") {
        parts.push(escapeHtml(cert));
      } else {
        if (cert.name) parts.push(escapeHtml(cert.name));
        if (cert.issuer) parts.push(escapeHtml(cert.issuer));
        if (cert.date) parts.push(escapeHtml(cert.date));
      }
      html += `<div style="font-size: 10pt; color: #000000; margin-bottom: 2px;">${parts.join(' | ')}</div>`;
    }
    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

function stripAddressBlock(text: string): string {
  const lines = text.split('\n');
  const start = lines.findIndex(l => /^(Dear|To|Hello|Greetings|Hi)\b/i.test(l.trim()));
  return start >= 0 ? lines.slice(start).join('\n') : text;
}

export function renderCoverLetterHtml(letter: { content: string; job_title?: string; company_name?: string }): string {
  const stripped = stripAddressBlock(letter.content);
  const normalized = stripped.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #000000; line-height: 1.6; padding: 50px 40px 40px 40px; max-width: 800px; margin: 0 auto;">
      <div style="margin-bottom: 16px; text-align: center;">
        <div style="font-size: 14pt; font-weight: 400; text-transform: uppercase; margin-bottom: 4px;">COVER LETTER</div>
        <div style="font-size: 14pt; color: #000000;">
          <strong>${escapeHtml(letter.job_title)}</strong>
          ${letter.company_name ? ` | <span>${escapeHtml(letter.company_name)}</span>` : ""}
        </div>
      </div>
      <div style="font-size: 11pt; color: #000000; line-height: 1.6;">
        ${normalized.split('\n\n').filter(Boolean).map((p, i, arr) =>
          `<p style="margin: 0 0 24px 0; line-height: 1.6;${i > 0 && i < arr.length - 1 ? ' text-indent: 2em;' : ''}">${escapeHtml(p.trim()).replace(/\n/g, '<br>')}</p>`
        ).join('')}
      </div>
    </div>`;
}

export async function generateResumePDF(
  resumeData: ResumeData,
  filename?: string
): Promise<void> {
  const html = renderResumeHtml(resumeData);
  const name = resumeData.personal_info?.name || "Resume";
  const safeName = String(name).replace(/[^a-zA-Z0-9]/g, "_");
  await renderToPdf(html, filename || `${safeName}_Resume.pdf`);
}

export async function generateCoverLetterPDF(
  content: string,
  filename: string
): Promise<void> {
  const html = renderCoverLetterHtml({ content, job_title: "", company_name: "" } as CoverLetter);
  await renderToPdf(html, filename);
}

export async function downloadAll(
  resumeData: ResumeData,
  coverLetterContent: string,
  baseName: string
): Promise<void> {
  const safeBase = String(baseName).replace(/[^a-zA-Z0-9]/g, "_");
  const resumePromise = generateResumePDF(resumeData, `${safeBase}_Resume.pdf`);
  const clPromise = generateCoverLetterPDF(coverLetterContent, `${safeBase}_Cover_Letter.pdf`);
  await Promise.all([resumePromise, clPromise]);
}
