const SECTION_HEADERS = [
  "Personal Information", "Summary", "Skills",
  "Experience", "Education", "Projects",
  "Achievements", "Certifications", "Languages",
] as const;

const SECTION_IDS: Record<string, string> = {
  "Personal Information": "personal_info",
  Summary: "summary",
  Skills: "skills",
  Experience: "experience",
  Education: "education",
  Projects: "projects",
  Achievements: "achievements",
  Certifications: "certifications",
  Languages: "languages",
};

const PI_KEYS: Record<string, string> = {
  Name: "name",
  Email: "email",
  Phone: "phone",
  Location: "location",
  LinkedIn: "linkedin",
  GitHub: "github",
};

function isSectionHeader(line: string): string | null {
  for (const h of SECTION_HEADERS) {
    if (line === h || line.startsWith(h + "  ") || line.startsWith(h + "\t")) {
      return h;
    }
  }
  return null;
}

export function resumeToText(data: Record<string, unknown>): string {
  const parts: string[] = [];

  const pi = data.personal_info as Record<string, string> | undefined;
  if (pi) {
    parts.push("Personal Information");
    for (const label of ["Name", "Email", "Phone", "Location", "LinkedIn", "GitHub"]) {
      const key = PI_KEYS[label];
      parts.push(`${label}: ${pi[key] || ""}`);
    }
  }

  const summary = data.summary as string | undefined;
  if (summary) {
    parts.push("Summary");
    parts.push(summary);
  }

  const skills = data.skills as unknown;
  if (Array.isArray(skills) && skills.length > 0) {
    parts.push("Skills");
    if (typeof skills[0] === "object" && skills[0] !== null && "category" in (skills[0] as Record<string, unknown>)) {
      for (const cat of skills as Array<{ category: string; items: string[] }>) {
        const items = (cat.items || []).join(", ");
        parts.push(`${cat.category}: ${items}`);
      }
    } else {
      parts.push((skills as string[]).join(", "));
    }
  }

  const experience = data.experience as Record<string, string>[] | undefined;
  if (experience && experience.length > 0) {
    parts.push("Experience");
    for (const exp of experience) {
      parts.push(`Company: ${exp.company || ""}`);
      parts.push(`Position: ${exp.position || ""}`);
      const period = [exp.start_date || "", exp.end_date || "Present"].filter(Boolean).join(" - ");
      parts.push(`Period: ${period}`);
      if (exp.description) {
        const bullets = exp.description.split("\n").filter(Boolean);
        for (const b of bullets) {
          parts.push(`- ${b.trim()}`);
        }
      }
      parts.push("");
    }
  }

  const education = data.education as Record<string, string>[] | undefined;
  if (education && education.length > 0) {
    parts.push("Education");
    for (const edu of education) {
      parts.push(`Institution: ${edu.institution || ""}`);
      parts.push(`Degree: ${edu.degree || ""}`);
      parts.push(`Field: ${edu.field || ""}`);
      const period = [edu.start_date || "", edu.end_date || ""].filter(Boolean).join(" - ");
      if (period) parts.push(`Period: ${period}`);
      parts.push("");
    }
  }

  const projects = data.projects as Record<string, string>[] | undefined;
  if (projects && projects.length > 0) {
    parts.push("Projects");
    for (const proj of projects) {
      parts.push(`Title: ${proj.title || ""}`);
      if (proj.description) {
        const bullets = proj.description.split("\n").filter(Boolean);
        for (const b of bullets) {
          parts.push(`- ${b.trim()}`);
        }
      }
      parts.push("");
    }
  }

  const achievements = data.achievements as string[] | undefined;
  if (achievements && achievements.length > 0) {
    parts.push("Achievements");
    for (const a of achievements) {
      parts.push(`- ${a}`);
    }
  }

  const certifications = data.certifications as string[] | undefined;
  if (certifications && certifications.length > 0) {
    parts.push("Certifications");
    for (const c of certifications) {
      parts.push(`- ${c}`);
    }
  }

  const languages = data.languages as string[] | undefined;
  if (languages && languages.length > 0) {
    parts.push("Languages");
    parts.push(languages.join(", "));
  }

  return parts.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function textToResumeData(text: string): Record<string, unknown> {
  const lines = text.split("\n");
  const result: Record<string, unknown> = {};

  let currentSection = "";
  let currentEntry: Record<string, string> | null = null;
  const personalInfo: Record<string, string> = {};
  const experience: Record<string, string>[] = [];
  const education: Record<string, string>[] = [];
  const projects: Record<string, string>[] = [];
  const achievements: string[] = [];
  const certifications: string[] = [];
  const languages: string[] = [];

  let summaryLines: string[] = [];
  let inSummary = false;

  const finalizeEntry = () => {
    if (!currentEntry) return;
    if (currentSection === "experience") experience.push(currentEntry);
    else if (currentSection === "education") education.push(currentEntry);
    else if (currentSection === "projects") projects.push(currentEntry);
    currentEntry = null;
  };

  const isSectionStart = (line: string): string | null => {
    for (const h of SECTION_HEADERS) {
      if (line === h) return h;
    }
    return null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line) continue;

    const header = isSectionStart(line);
    if (header) {
      if (inSummary && summaryLines.length > 0) {
        result.summary = summaryLines.join(" ").trim();
        summaryLines = [];
        inSummary = false;
      }
      finalizeEntry();
      currentSection = SECTION_IDS[header] || "";
      continue;
    }

    if (!currentSection) continue;

    if (currentSection === "personal_info") {
      const ci = line.indexOf(":");
      if (ci > 0) {
        const label = line.substring(0, ci).trim();
        const value = line.substring(ci + 1).trim();
        const key = PI_KEYS[label] || label.toLowerCase();
        personalInfo[key] = value;
      }
    } else if (currentSection === "summary") {
      inSummary = true;
      summaryLines.push(line);
    } else if (currentSection === "skills") {
      const colonIdx = line.indexOf(":");
      if (colonIdx > 0 && colonIdx < 30) {
        const category = line.substring(0, colonIdx).trim();
        const items = line.substring(colonIdx + 1).split(",").map((s) => s.trim()).filter(Boolean);
        if (category && items.length > 0) {
          if (!Array.isArray(result.skills)) result.skills = [];
          (result.skills as Array<{ category: string; items: string[] }>).push({ category, items });
        }
      } else {
        const flat = line.split(",").map((s) => s.trim()).filter(Boolean);
        if (flat.length > 0) result.skills = flat;
      }
    } else if (currentSection === "experience") {
      if (line.startsWith("Company:")) {
        finalizeEntry();
        currentEntry = { company: line.substring(8).trim(), position: "", description: "", start_date: "", end_date: "" };
      } else if (line.startsWith("- ")) {
        if (!currentEntry) {
          currentEntry = { company: "", position: "", description: "", start_date: "", end_date: "" };
        }
        const bullet = line.substring(2).trim();
        if (bullet) {
          currentEntry.description = currentEntry.description
            ? currentEntry.description + "\n" + bullet
            : bullet;
        }
      } else if (currentEntry) {
        if (line.startsWith("Position:")) {
          currentEntry.position = line.substring(9).trim();
        } else if (line.startsWith("Period:")) {
          const period = line.substring(7).trim();
          const sep = period.indexOf(" - ");
          if (sep > 0) {
            currentEntry.start_date = period.substring(0, sep).trim();
            currentEntry.end_date = period.substring(sep + 3).trim();
          } else {
            currentEntry.start_date = period;
            currentEntry.end_date = "";
          }
        }
      }
    } else if (currentSection === "education") {
      if (line.startsWith("Institution:")) {
        finalizeEntry();
        currentEntry = { institution: line.substring(12).trim(), degree: "", field: "", start_date: "", end_date: "" };
      } else if (currentEntry) {
        if (line.startsWith("Degree:")) {
          currentEntry.degree = line.substring(7).trim();
        } else if (line.startsWith("Field:")) {
          currentEntry.field = line.substring(6).trim();
        } else if (line.startsWith("Period:")) {
          const period = line.substring(7).trim();
          const sep = period.indexOf(" - ");
          if (sep > 0) {
            currentEntry.start_date = period.substring(0, sep).trim();
            currentEntry.end_date = period.substring(sep + 3).trim();
          }
        }
      }
    } else if (currentSection === "projects") {
      if (line.startsWith("Title:")) {
        finalizeEntry();
        currentEntry = { title: line.substring(6).trim(), description: "", start_date: "", end_date: "" };
      } else if (line.startsWith("- ")) {
        if (!currentEntry) {
          currentEntry = { title: "", description: "", start_date: "", end_date: "" };
        }
        const bullet = line.substring(2).trim();
        if (bullet) {
          currentEntry.description = currentEntry.description
            ? currentEntry.description + "\n" + bullet
            : bullet;
        }
      }
    } else if (currentSection === "achievements") {
      if (line.startsWith("- ")) {
        const item = line.substring(2).trim();
        if (item) achievements.push(item);
      }
    } else if (currentSection === "certifications") {
      if (line.startsWith("- ")) {
        const item = line.substring(2).trim();
        if (item) certifications.push(item);
      }
    } else if (currentSection === "languages") {
      const langs = line.split(",").map((s) => s.trim()).filter(Boolean);
      if (langs.length > 0) languages.push(...langs);
    }
  }

  if (inSummary && summaryLines.length > 0) {
    result.summary = summaryLines.join(" ").trim();
  }
  finalizeEntry();

  if (Object.keys(personalInfo).length > 0) result.personal_info = personalInfo;
  if (experience.length > 0) result.experience = experience;
  if (education.length > 0) result.education = education;
  if (projects.length > 0) result.projects = projects;
  if (achievements.length > 0) result.achievements = achievements;
  if (certifications.length > 0) result.certifications = certifications;
  if (languages.length > 0) result.languages = languages;

  return result;
}
