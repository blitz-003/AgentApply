"use client";

import { useState, useCallback } from "react";
import type { ResumeDetail, SkillGroup } from "@/types/resume";
import {
  useUpdateResume,
  useImproveSummary,
  useImproveExperience,
  useImproveProject,
  useSuggestSkills,
} from "./hooks";
import { toast } from "sonner";

interface ResumeEditorProps {
  resumeId: string;
  resume: ResumeDetail;
}

interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
}

interface ExperienceEntry {
  company: string;
  position: string;
  description: string;
  start_date: string;
  end_date: string;
}

interface ProjectEntry {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
}

interface EducationEntry {
  institution: string;
  degree: string;
  field: string;
  start_date: string;
  end_date: string;
}

function getPersonalInfo(data: Record<string, unknown>): PersonalInfo {
  const info = (data.personal_info as Record<string, string>) || {};
  return {
    name: info.name || "",
    email: info.email || "",
    phone: info.phone || "",
    location: info.location || "",
    linkedin: info.linkedin || "",
    github: info.github || "",
  };
}

function getSummary(data: Record<string, unknown>): string {
  return (data.summary as string) || "";
}

function getExperience(data: Record<string, unknown>): ExperienceEntry[] {
  const exp = data.experience;
  if (Array.isArray(exp)) {
    return exp.map((e) => ({
      company: (e as Record<string, string>).company || "",
      position: (e as Record<string, string>).position || "",
      description: (e as Record<string, string>).description || "",
      start_date: (e as Record<string, string>).start_date || "",
      end_date: (e as Record<string, string>).end_date || "",
    }));
  }
  return [];
}

function getProjects(data: Record<string, unknown>): ProjectEntry[] {
  const proj = data.projects;
  if (Array.isArray(proj)) {
    return proj.map((p) => ({
      title: (p as Record<string, string>).title || "",
      description: (p as Record<string, string>).description || "",
      start_date: (p as Record<string, string>).start_date || "",
      end_date: (p as Record<string, string>).end_date || "",
    }));
  }
  return [];
}

const DEFAULT_SKILL_CATEGORY = "Skills";
// New suggestions go into an "Others" bucket. This matches the PDF renderer,
// which only ever prints the two strongest categories plus "Others", so a group
// named "Suggested" would be folded into Others anyway and shown as a stray
// heading in the editor.
const SUGGESTED_SKILL_CATEGORY = "Others";
// Older resumes were saved with the previous name; treat them as the same group
// so a reload does not leave two near-duplicate catch-all groups behind.
const LEGACY_SUGGESTED_CATEGORY = "Suggested";
const CATCH_ALL_CATEGORIES = [SUGGESTED_SKILL_CATEGORY, LEGACY_SUGGESTED_CATEGORY];

function getSkills(data: Record<string, unknown>): SkillGroup[] {
  const skills = data.skills;
  if (!Array.isArray(skills)) return [];

  const groups: SkillGroup[] = [];
  const loose: string[] = [];

  for (const entry of skills) {
    if (entry && typeof entry === "object") {
      const group = entry as Record<string, unknown>;
      const items = Array.isArray(group.items)
        ? group.items.map(String).filter(Boolean)
        : [];
      if (items.length === 0) continue;
      const category = String(group.category || "").trim() || DEFAULT_SKILL_CATEGORY;
      groups.push({ category, items });
    } else if (typeof entry === "string" && entry.trim()) {
      loose.push(entry.trim());
    }
  }

  // Older records store a flat list; keep them in one group rather than losing them.
  if (loose.length > 0) {
    groups.push({ category: DEFAULT_SKILL_CATEGORY, items: loose });
  }
  return groups;
}

function flattenSkills(groups: SkillGroup[]): string[] {
  return groups.flatMap((g) => g.items);
}

/** Add a skill to the group it already belongs to, else the default group. */
function addSkillToGroups(groups: SkillGroup[], skill: string): SkillGroup[] {
  const existing = groups.find((g) => g.items.includes(skill));
  if (existing) return groups;
  if (groups.some((g) => g.category === DEFAULT_SKILL_CATEGORY)) {
    return groups.map((g) =>
      g.category === DEFAULT_SKILL_CATEGORY
        ? { ...g, items: [...g.items, skill] }
        : g,
    );
  }
  return [...groups, { category: DEFAULT_SKILL_CATEGORY, items: [skill] }];
}

/**
 * The suggest-skills endpoint returns a flat list with no category mapping, so
 * new suggestions go in their own group instead of being guessed into an
 * existing category.
 */
function mergeSuggestedSkills(
  groups: SkillGroup[],
  suggested: string[],
): SkillGroup[] {
  const existing = new Set(flattenSkills(groups));
  const fresh = (suggested || []).map((s) => String(s).trim()).filter(
    (s) => s && !existing.has(s),
  );
  if (fresh.length === 0) return groups;

  const withoutOld = groups.filter((g) => !CATCH_ALL_CATEGORIES.includes(g.category));
  const previous = groups
    .filter((g) => CATCH_ALL_CATEGORIES.includes(g.category))
    .flatMap((g) => g.items ?? []);
  const merged = [...previous, ...fresh];
  return [...withoutOld, { category: SUGGESTED_SKILL_CATEGORY, items: merged }];
}

function getEducation(data: Record<string, unknown>): EducationEntry[] {
  const edu = data.education;
  if (Array.isArray(edu)) {
    return edu.map((e) => ({
      institution: (e as Record<string, string>).institution || "",
      degree: (e as Record<string, string>).degree || "",
      field: (e as Record<string, string>).field || "",
      start_date: (e as Record<string, string>).start_date || "",
      end_date: (e as Record<string, string>).end_date || "",
    }));
  }
  return [];
}

const EMPTY_EXPERIENCE: ExperienceEntry = { company: "", position: "", description: "", start_date: "", end_date: "" };
const EMPTY_PROJECT: ProjectEntry = { title: "", description: "", start_date: "", end_date: "" };
const EMPTY_EDUCATION: EducationEntry = { institution: "", degree: "", field: "", start_date: "", end_date: "" };

export function ResumeEditor({ resumeId, resume }: ResumeEditorProps) {
  const resumeData = (resume.resume_data as Record<string, unknown>) || {};

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>(() => getPersonalInfo(resumeData));
  const [summary, setSummary] = useState(() => getSummary(resumeData));
  const [experience, setExperience] = useState<ExperienceEntry[]>(() => getExperience(resumeData));
  const [projects, setProjects] = useState<ProjectEntry[]>(() => getProjects(resumeData));
  const [skills, setSkills] = useState<SkillGroup[]>(() => getSkills(resumeData));
  const [education, setEducation] = useState<EducationEntry[]>(() => getEducation(resumeData));
  const [newSkill, setNewSkill] = useState("");
  const [improvingExpIndex, setImprovingExpIndex] = useState<number | null>(null);
  const [improvingProjIndex, setImprovingProjIndex] = useState<number | null>(null);

  const updateMutation = useUpdateResume(resumeId);
  const improveSummaryMutation = useImproveSummary(resumeId);
  const improveExperienceMutation = useImproveExperience(resumeId);
  const improveProjectMutation = useImproveProject(resumeId);
  const suggestSkillsMutation = useSuggestSkills(resumeId);

  const buildResumeData = useCallback((): Record<string, unknown> => ({
    personal_info: personalInfo,
    summary,
    experience,
    projects,
    skills,
    education,
  }), [personalInfo, summary, experience, projects, skills, education]);

  const handleSave = () => {
    updateMutation.mutate(
      { resume_data: buildResumeData() },
      {
        onSuccess: () => toast.success("Resume updated successfully"),
        onError: () => toast.error("Resume save failed"),
      }
    );
  };

  const handleImproveSummary = () => {
    improveSummaryMutation.mutate(summary, {
      onSuccess: (result) => setSummary(result.summary),
      onError: () => toast.error("AI request failed"),
    });
  };

  const handleImproveExperience = (index: number) => {
    setImprovingExpIndex(index);
    const entry = experience[index];
    improveExperienceMutation.mutate(entry, {
      onSuccess: (result) => {
        setExperience((prev) =>
          prev.map((e, i) => (i === index ? result.experience : e))
        );
      },
      onError: () => toast.error("AI request failed"),
      onSettled: () => setImprovingExpIndex(null),
    });
  };

  const handleImproveProject = (index: number) => {
    setImprovingProjIndex(index);
    const entry = projects[index];
    improveProjectMutation.mutate(entry, {
      onSuccess: (result) => {
        setProjects((prev) =>
          prev.map((p, i) => (i === index ? result.project : p))
        );
      },
      onError: () => toast.error("AI request failed"),
      onSettled: () => setImprovingProjIndex(null),
    });
  };

  const handleSuggestSkills = () => {
    suggestSkillsMutation.mutate(flattenSkills(skills), {
      onSuccess: (result) =>
        setSkills((prev) => mergeSuggestedSkills(prev, result.skills)),
      onError: () => toast.error("AI request failed"),
    });
  };

  const handleAddSkill = () => {
    const value = newSkill.trim();
    if (!value) return;
    setSkills((prev) => addSkillToGroups(prev, value));
    setNewSkill("");
  };

  const handleRemoveSkill = (category: string, skill: string) => {
    setSkills((prev) =>
      prev
        .map((group) =>
          group.category === category
            ? { ...group, items: group.items.filter((s) => s !== skill) }
            : group,
        )
        .filter((group) => group.items.length > 0),
    );
  };

  const handleAddExperience = () => {
    if (experience.length < 3) {
      setExperience((prev) => [...prev, { ...EMPTY_EXPERIENCE }]);
    }
  };

  const handleRemoveExperience = (index: number) => {
    setExperience((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddProject = () => {
    if (projects.length < 3) {
      setProjects((prev) => [...prev, { ...EMPTY_PROJECT }]);
    }
  };

  const handleRemoveProject = (index: number) => {
    setProjects((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddEducation = () => {
    setEducation((prev) => [...prev, { ...EMPTY_EDUCATION }]);
  };

  const handleRemoveEducation = (index: number) => {
    setEducation((prev) => prev.filter((_, i) => i !== index));
  };



  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main Editor */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl space-y-8">
          {/* Resume Title + Actions */}
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-ink">
              {resume.title}
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-white transition-shadow hover:bg-primary-active hover:shadow-glow disabled:bg-primary-disabled"
              >
                {updateMutation.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          {/* Personal Information */}
            <section className="rounded-md border border-hairline-soft bg-canvas p-6">
              <h2 className="mb-4 text-lg font-semibold text-ink">
                Personal Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={personalInfo.name}
                  onChange={(e) => setPersonalInfo((p) => ({ ...p, name: e.target.value }))}
                  className="col-span-2 rounded-sm border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted-soft field-focus focus:outline-none focus:ring-0"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={personalInfo.email}
                  onChange={(e) => setPersonalInfo((p) => ({ ...p, email: e.target.value }))}
                  className="rounded-sm border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted-soft field-focus focus:outline-none focus:ring-0"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={personalInfo.phone}
                  onChange={(e) => setPersonalInfo((p) => ({ ...p, phone: e.target.value }))}
                  className="rounded-sm border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted-soft field-focus focus:outline-none focus:ring-0"
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={personalInfo.location}
                  onChange={(e) => setPersonalInfo((p) => ({ ...p, location: e.target.value }))}
                  className="rounded-sm border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted-soft field-focus focus:outline-none focus:ring-0"
                />
                <input
                  type="text"
                  placeholder="LinkedIn URL"
                  value={personalInfo.linkedin}
                  onChange={(e) => setPersonalInfo((p) => ({ ...p, linkedin: e.target.value }))}
                  className="rounded-sm border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted-soft field-focus focus:outline-none focus:ring-0"
                />
                <input
                  type="text"
                  placeholder="GitHub URL"
                  value={personalInfo.github}
                  onChange={(e) => setPersonalInfo((p) => ({ ...p, github: e.target.value }))}
                  className="rounded-sm border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted-soft field-focus focus:outline-none focus:ring-0"
                />
              </div>
            </section>

            {/* Professional Summary */}
            <section className="rounded-md border border-hairline-soft bg-canvas p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink">
                  Professional Summary
                </h2>
                <button
                  onClick={handleImproveSummary}
                  disabled={improveSummaryMutation.isPending}
                  className="rounded-sm border border-hairline px-3 py-1.5 text-xs font-medium text-ink transition-shadow hover:bg-white hover:text-primary hover:shadow-glow disabled:opacity-50"
                >
                  {improveSummaryMutation.isPending ? "Improving..." : "Improve with AI"}
                </button>
              </div>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={4}
                className="w-full rounded-sm border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted-soft field-focus focus:outline-none focus:ring-0"
                placeholder="Write a brief professional summary..."
              />
            </section>

            {/* Experience */}
            <section className="rounded-md border border-hairline-soft bg-canvas p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink">
                  Experience
                </h2>
                {experience.length < 3 && (
                  <button
                    onClick={handleAddExperience}
                    className="rounded-sm border border-hairline px-3 py-1.5 text-xs font-medium text-ink transition-shadow hover:bg-white hover:text-primary hover:shadow-glow"
                  >
                    + Add
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {experience.map((entry, index) => (
                  <div key={index} className="space-y-3 rounded-sm border border-hairline-soft p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted">
                        Entry {index + 1}
                      </span>
                      <button
                        onClick={() => handleRemoveExperience(index)}
                        className="text-xs text-error hover:text-error-hover"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Company"
                        value={entry.company}
                        onChange={(e) =>
                          setExperience((prev) =>
                            prev.map((exp, i) =>
                              i === index ? { ...exp, company: e.target.value } : exp
                            )
                          )
                        }
                        className="rounded-sm border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted-soft field-focus focus:outline-none focus:ring-0"
                      />
                      <input
                        type="text"
                        placeholder="Position"
                        value={entry.position}
                        onChange={(e) =>
                          setExperience((prev) =>
                            prev.map((exp, i) =>
                              i === index ? { ...exp, position: e.target.value } : exp
                            )
                          )
                        }
                        className="rounded-sm border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted-soft field-focus focus:outline-none focus:ring-0"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Start Date (e.g. Jan 2020)"
                        value={entry.start_date}
                        onChange={(e) =>
                          setExperience((prev) =>
                            prev.map((exp, i) =>
                              i === index ? { ...exp, start_date: e.target.value } : exp
                            )
                          )
                        }
                        className="rounded-sm border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted-soft field-focus focus:outline-none focus:ring-0"
                      />
                      <input
                        type="text"
                        placeholder="End Date (e.g. Present)"
                        value={entry.end_date}
                        onChange={(e) =>
                          setExperience((prev) =>
                            prev.map((exp, i) =>
                              i === index ? { ...exp, end_date: e.target.value } : exp
                            )
                          )
                        }
                        className="rounded-sm border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted-soft field-focus focus:outline-none focus:ring-0"
                      />
                    </div>
                    <textarea
                      placeholder="Description of your role and achievements..."
                      value={entry.description}
                      onChange={(e) =>
                        setExperience((prev) =>
                          prev.map((exp, i) =>
                            i === index ? { ...exp, description: e.target.value } : exp
                          )
                        )
                      }
                      rows={3}
                      className="w-full rounded-sm border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted-soft field-focus focus:outline-none focus:ring-0"
                    />
                    <button
                      onClick={() => handleImproveExperience(index)}
                      disabled={improvingExpIndex !== null}
                      className="rounded-sm border border-hairline px-3 py-1.5 text-xs font-medium text-ink transition-shadow hover:bg-white hover:text-primary hover:shadow-glow disabled:opacity-50"
                    >
                      {improvingExpIndex === index ? "Improving..." : "Improve with AI"}
                    </button>
                  </div>
                ))}
                {experience.length === 0 && (
                  <p className="text-sm text-muted">
                    No experience entries yet. Click &quot;+ Add&quot; to add one.
                  </p>
                )}
              </div>
            </section>

            {/* Projects */}
            <section className="rounded-md border border-hairline-soft bg-canvas p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink">
                  Projects
                </h2>
                {projects.length < 3 && (
                  <button
                    onClick={handleAddProject}
                    className="rounded-sm border border-hairline px-3 py-1.5 text-xs font-medium text-ink transition-shadow hover:bg-white hover:text-primary hover:shadow-glow"
                  >
                    + Add
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {projects.map((entry, index) => (
                  <div key={index} className="space-y-3 rounded-sm border border-hairline-soft p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted">
                        Entry {index + 1}
                      </span>
                      <button
                        onClick={() => handleRemoveProject(index)}
                        className="text-xs text-error hover:text-error-hover"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Project Title"
                      value={entry.title}
                      onChange={(e) =>
                        setProjects((prev) =>
                          prev.map((p, i) =>
                            i === index ? { ...p, title: e.target.value } : p
                          )
                        )
                      }
                      className="w-full rounded-sm border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted-soft field-focus focus:outline-none focus:ring-0"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Start Date"
                        value={entry.start_date}
                        onChange={(e) =>
                          setProjects((prev) =>
                            prev.map((p, i) =>
                              i === index ? { ...p, start_date: e.target.value } : p
                            )
                          )
                        }
                        className="rounded-sm border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted-soft field-focus focus:outline-none focus:ring-0"
                      />
                      <input
                        type="text"
                        placeholder="End Date"
                        value={entry.end_date}
                        onChange={(e) =>
                          setProjects((prev) =>
                            prev.map((p, i) =>
                              i === index ? { ...p, end_date: e.target.value } : p
                            )
                          )
                        }
                        className="rounded-sm border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted-soft field-focus focus:outline-none focus:ring-0"
                      />
                    </div>
                    <textarea
                      placeholder="Describe the project..."
                      value={entry.description}
                      onChange={(e) =>
                        setProjects((prev) =>
                          prev.map((p, i) =>
                            i === index ? { ...p, description: e.target.value } : p
                          )
                        )
                      }
                      rows={3}
                      className="w-full rounded-sm border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted-soft field-focus focus:outline-none focus:ring-0"
                    />
                    <button
                      onClick={() => handleImproveProject(index)}
                      disabled={improvingProjIndex !== null}
                      className="rounded-sm border border-hairline px-3 py-1.5 text-xs font-medium text-ink transition-shadow hover:bg-white hover:text-primary hover:shadow-glow disabled:opacity-50"
                    >
                      {improvingProjIndex === index ? "Improving..." : "Improve with AI"}
                    </button>
                  </div>
                ))}
                {projects.length === 0 && (
                  <p className="text-sm text-muted">
                    No project entries yet. Click &quot;+ Add&quot; to add one.
                  </p>
                )}
              </div>
            </section>

            {/* Skills */}
            <section className="rounded-md border border-hairline-soft bg-canvas p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink">
                  Skills
                </h2>
                <button
                  onClick={handleSuggestSkills}
                  disabled={suggestSkillsMutation.isPending}
                  className="rounded-sm border border-hairline px-3 py-1.5 text-xs font-medium text-ink transition-shadow hover:bg-white hover:text-primary hover:shadow-glow disabled:opacity-50"
                >
                  {suggestSkillsMutation.isPending ? "Suggesting..." : "Suggest Skills"}
                </button>
              </div>
              {skills.length === 0 ? (
                <p className="mb-4 text-sm text-muted-soft">
                  No skills yet. Add one below or use Suggest Skills.
                </p>
              ) : (
                skills.map((group) => (
                  <div key={group.category} className="mb-4 last:mb-0">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                      {group.category}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {group.items.map((skill) => (
                        <span
                          key={`${group.category}:${skill}`}
                          className="inline-flex items-center gap-1 rounded-full bg-surface-soft px-3 py-1 text-sm text-ink"
                        >
                          {skill}
                          <button
                            onClick={() => handleRemoveSkill(group.category, skill)}
                            aria-label={`Remove ${skill}`}
                            className="ml-1 text-muted-soft hover:text-muted"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                  placeholder="Add a skill..."
                  className="flex-1 rounded-sm border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted-soft field-focus focus:outline-none focus:ring-0"
                />
                <button
                  onClick={handleAddSkill}
                  className="rounded-sm border border-hairline px-3 py-2 text-sm font-medium text-ink transition-shadow hover:bg-white hover:text-primary hover:shadow-glow"
                >
                  Add
                </button>
              </div>
            </section>

            {/* Education */}
            <section className="rounded-md border border-hairline-soft bg-canvas p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-ink">
                  Education
                </h2>
                <button
                  onClick={handleAddEducation}
                  className="rounded-sm border border-hairline px-3 py-1.5 text-xs font-medium text-ink transition-shadow hover:bg-white hover:text-primary hover:shadow-glow"
                >
                  + Add
                </button>
              </div>
              <div className="space-y-4">
                {education.map((entry, index) => (
                  <div key={index} className="space-y-3 rounded-sm border border-hairline-soft p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted">
                        Entry {index + 1}
                      </span>
                      <button
                        onClick={() => handleRemoveEducation(index)}
                        className="text-xs text-error hover:text-error-hover"
                      >
                        Remove
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Institution"
                      value={entry.institution}
                      onChange={(e) =>
                        setEducation((prev) =>
                          prev.map((edu, i) =>
                            i === index ? { ...edu, institution: e.target.value } : edu
                          )
                        )
                      }
                      className="w-full rounded-sm border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted-soft field-focus focus:outline-none focus:ring-0"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Degree"
                        value={entry.degree}
                        onChange={(e) =>
                          setEducation((prev) =>
                            prev.map((edu, i) =>
                              i === index ? { ...edu, degree: e.target.value } : edu
                            )
                          )
                        }
                        className="rounded-sm border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted-soft field-focus focus:outline-none focus:ring-0"
                      />
                      <input
                        type="text"
                        placeholder="Field of Study"
                        value={entry.field}
                        onChange={(e) =>
                          setEducation((prev) =>
                            prev.map((edu, i) =>
                              i === index ? { ...edu, field: e.target.value } : edu
                            )
                          )
                        }
                        className="rounded-sm border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted-soft field-focus focus:outline-none focus:ring-0"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Start Date"
                        value={entry.start_date}
                        onChange={(e) =>
                          setEducation((prev) =>
                            prev.map((edu, i) =>
                              i === index ? { ...edu, start_date: e.target.value } : edu
                            )
                          )
                        }
                        className="rounded-sm border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted-soft field-focus focus:outline-none focus:ring-0"
                      />
                      <input
                        type="text"
                        placeholder="End Date"
                        value={entry.end_date}
                        onChange={(e) =>
                          setEducation((prev) =>
                            prev.map((edu, i) =>
                              i === index ? { ...edu, end_date: e.target.value } : edu
                            )
                          )
                        }
                        className="rounded-sm border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted-soft field-focus focus:outline-none focus:ring-0"
                      />
                    </div>
                  </div>
                ))}
                {education.length === 0 && (
                  <p className="text-sm text-muted">
                    No education entries yet. Click &quot;+ Add&quot; to add one.
                  </p>
                )}
              </div>
            </section>

          </div>
        </div>
    </div>
  );
}
