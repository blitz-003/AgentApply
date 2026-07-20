import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import type { CoverLetter } from "@/types/ai";

interface ResumeData {
  personal_info?: Record<string, string>;
  summary?: string;
  experience?: Array<Record<string, string>>;
  education?: Array<Record<string, string>>;
  skills?: string[];
  projects?: Array<Record<string, string>>;
}

function escapeHtml(str: string): string {
  return str
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

  await new Promise((resolve) => setTimeout(resolve, 300));

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pdf = new jsPDF("p", "mm", "a4");

    let position = 0;
    const pageHeight = 297;
    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    while (position < imgHeight) {
      if (position > 0) pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, -position, imgWidth, imgHeight);
      position += pageHeight;
    }

    pdf.save(filename);
  } finally {
    document.body.removeChild(container);
  }
}

function renderResumeHtml(data: ResumeData): string {
  const pi = data.personal_info || {};
  const summary = data.summary || "";
  const experience = data.experience || [];
  const education = data.education || [];
  const skills = data.skills || [];
  const projects = data.projects || [];

  let html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto;">
      <div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #2563eb;">
        <h1 style="font-size: 26px; color: #1e40af; margin: 0 0 8px 0;">${escapeHtml(pi.name || "Your Name")}</h1>
        <div style="display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; font-size: 13px; color: #6b7280;">`;

  if (pi.email) html += `<span>${escapeHtml(pi.email)}</span>`;
  if (pi.phone) html += `<span>${escapeHtml(pi.phone)}</span>`;
  if (pi.location) html += `<span>${escapeHtml(pi.location)}</span>`;
  if (pi.linkedin) html += `<span>${escapeHtml(pi.linkedin)}</span>`;
  if (pi.github) html += `<span>${escapeHtml(pi.github)}</span>`;

  html += `</div></div>`;

  if (summary) {
    html += `
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 16px; color: #1e40af; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb;">Professional Summary</h2>
        <p style="font-size: 13px; line-height: 1.7; color: #374151; margin: 0;">${escapeHtml(summary)}</p>
      </div>`;
  }

  if (experience.length > 0) {
    html += `<div style="margin-bottom: 20px;"><h2 style="font-size: 16px; color: #1e40af; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb;">Experience</h2>`;
    for (const exp of experience) {
      const dates = exp.start_date || exp.end_date
        ? `<div style="font-size: 11px; color: #6b7280; margin-top: 2px;">${escapeHtml(exp.start_date || "")}${exp.start_date && exp.end_date ? " - " : ""}${escapeHtml(exp.end_date || "Present")}</div>`
        : "";
      html += `
        <div style="margin-bottom: 14px; padding-left: 12px; border-left: 3px solid #2563eb;">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <span style="font-size: 14px; font-weight: 600; color: #111827;">${escapeHtml(exp.position || "Position")}</span>
            <span style="font-size: 13px; color: #6b7280;">${escapeHtml(exp.company || "Company")}</span>
          </div>
          ${dates}
          <p style="font-size: 13px; color: #374151; margin: 4px 0 0 0;">${escapeHtml(exp.description || "")}</p>
        </div>`;
    }
    html += `</div>`;
  }

  if (education.length > 0) {
    html += `<div style="margin-bottom: 20px;"><h2 style="font-size: 16px; color: #1e40af; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb;">Education</h2>`;
    for (const edu of education) {
      const dates = edu.start_date || edu.end_date
        ? `<div style="font-size: 11px; color: #6b7280; margin-top: 2px;">${escapeHtml(edu.start_date || "")}${edu.start_date && edu.end_date ? " - " : ""}${escapeHtml(edu.end_date || "")}</div>`
        : "";
      html += `
        <div style="margin-bottom: 10px; padding-left: 12px; border-left: 3px solid #2563eb;">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <span style="font-size: 14px; font-weight: 600; color: #111827;">${escapeHtml(edu.institution || "Institution")}</span>
            <span style="font-size: 13px; color: #6b7280;">${escapeHtml([edu.degree, edu.field].filter(Boolean).join(" "))}</span>
          </div>
          ${dates}
        </div>`;
    }
    html += `</div>`;
  }

  if (skills.length > 0) {
    html += `
      <div style="margin-bottom: 20px;">
        <h2 style="font-size: 16px; color: #1e40af; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb;">Skills</h2>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">`;
    for (const skill of skills) {
      html += `<span style="background: #eff6ff; color: #1e40af; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 500; display: inline-flex; align-items: center; justify-content: center; text-align: center;">${escapeHtml(skill)}</span>`;
    }
    html += `</div></div>`;
  }

  if (projects.length > 0) {
    html += `<div style="margin-bottom: 20px;"><h2 style="font-size: 16px; color: #1e40af; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb;">Projects</h2>`;
    for (const proj of projects) {
      const dates = proj.start_date || proj.end_date
        ? `<div style="font-size: 11px; color: #6b7280; margin-top: 2px;">${escapeHtml(proj.start_date || "")}${proj.start_date && proj.end_date ? " - " : ""}${escapeHtml(proj.end_date || "Present")}</div>`
        : "";
      html += `
        <div style="margin-bottom: 10px; padding-left: 12px; border-left: 3px solid #2563eb;">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <span style="font-size: 14px; font-weight: 600; color: #111827;">${escapeHtml(proj.title || "Project")}</span>
          </div>
          ${dates}
          <p style="font-size: 13px; color: #374151; margin: 4px 0 0 0;">${escapeHtml(proj.description || "")}</p>
        </div>`;
    }
    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

function renderCoverLetterHtml(letter: CoverLetter): string {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; line-height: 1.7; padding: 40px; max-width: 800px; margin: 0 auto;">
      <div style="margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #2563eb;">
        <h2 style="font-size: 18px; color: #1e40af; margin: 0 0 4px 0;">Cover Letter</h2>
        <div style="font-size: 13px; color: #6b7280;">
          <span style="font-weight: 600; color: #374151;">${escapeHtml(letter.job_title)}</span>
          ${letter.company_name ? ` at <span style="font-weight: 600; color: #374151;">${escapeHtml(letter.company_name)}</span>` : ""}
        </div>
      </div>
      <div style="font-size: 13px; white-space: pre-wrap; color: #374151;">${escapeHtml(letter.content)}</div>
    </div>`;
}

export async function generateResumePDF(
  resumeData: ResumeData,
  filename?: string
): Promise<void> {
  const html = renderResumeHtml(resumeData);
  const name = resumeData.personal_info?.name || "Resume";
  const safeName = name.replace(/[^a-zA-Z0-9]/g, "_");
  await renderToPdf(html, filename || `${safeName}_Resume.pdf`);
}

export async function generateCoverLetterPDFs(
  coverLetters: CoverLetter[],
  baseName?: string
): Promise<void> {
  for (const letter of coverLetters) {
    const html = renderCoverLetterHtml(letter);
    const safeBase = (baseName || "Cover_Letter").replace(/[^a-zA-Z0-9]/g, "_");
    const safeCompany = (letter.company_name || "Company").replace(/[^a-zA-Z0-9]/g, "_");
    await renderToPdf(html, `${safeBase}_${safeCompany}_Cover_Letter.pdf`);
  }
}
