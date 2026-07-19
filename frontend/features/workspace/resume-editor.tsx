"use client";

import { useState, useCallback } from "react";
import type { ResumeDetail } from "@/types/resume";
import {
  useUpdateResume,
  useImproveSummary,
  useRewriteSummary,
  useImproveExperience,
  useImproveProject,
  useSuggestSkills,
  useExportResume,
} from "./hooks";
import { ATSAnalysisPanel } from "./ats-analysis-panel";
import { CoverLettersPanel } from "./cover-letters-panel";

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
}

interface ProjectEntry {
  title: string;
  description: string;
}

interface EducationEntry {
  institution: string;
  degree: string;
  field: string;
  start_date: string;
  end_date: string;
}

function getPersonalInfo(data: Record<string, unknown>): PersonalInfo {
  const info = (data.personal_information as Record<string, string>) || {};
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
  return (data.professional_summary as string) || "";
}

function getExperience(data: Record<string, unknown>): ExperienceEntry[] {
  const exp = data.experience;
  if (Array.isArray(exp)) {
    return exp.map((e) => ({
      company: (e as Record<string, string>).company || "",
      position: (e as Record<string, string>).position || "",
      description: (e as Record<string, string>).description || "",
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
    }));
  }
  return [];
}

function getSkills(data: Record<string, unknown>): string[] {
  const skills = data.skills;
  if (Array.isArray(skills)) {
    return skills.map(String);
  }
  return [];
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

function getCoverLetter(data: Record<string, unknown>): string {
  return (data.cover_letter as string) || "";
}

export function ResumeEditor({ resumeId, resume }: ResumeEditorProps) {
  const resumeData = (resume.resume_data as Record<string, unknown>) || {};

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>(() => getPersonalInfo(resumeData));
  const [summary, setSummary] = useState(() => getSummary(resumeData));
  const [experience, setExperience] = useState<ExperienceEntry[]>(() => getExperience(resumeData));
  const [projects, setProjects] = useState<ProjectEntry[]>(() => getProjects(resumeData));
  const [skills, setSkills] = useState<string[]>(() => getSkills(resumeData));
  const [education] = useState<EducationEntry[]>(() => getEducation(resumeData));
  const [coverLetter, setCoverLetter] = useState(() => getCoverLetter(resumeData));
  const [newSkill, setNewSkill] = useState("");

  const updateMutation = useUpdateResume(resumeId);
  const improveSummaryMutation = useImproveSummary(resumeId);
  const rewriteSummaryMutation = useRewriteSummary(resumeId);
  const improveExperienceMutation = useImproveExperience(resumeId);
  const improveProjectMutation = useImproveProject(resumeId);
  const suggestSkillsMutation = useSuggestSkills(resumeId);
  const exportMutation = useExportResume();

  const buildResumeData = useCallback((): Record<string, unknown> => ({
    personal_information: personalInfo,
    professional_summary: summary,
    experience,
    projects,
    skills,
    education,
    cover_letter: coverLetter,
  }), [personalInfo, summary, experience, projects, skills, education, coverLetter]);

  const handleSave = () => {
    updateMutation.mutate({ resume_data: buildResumeData() });
  };

  const handleImproveSummary = () => {
    improveSummaryMutation.mutate(summary, {
      onSuccess: (result) => setSummary(result.summary),
    });
  };

  const handleRewriteSummary = () => {
    rewriteSummaryMutation.mutate(summary, {
      onSuccess: (result) => setSummary(result.summary),
    });
  };

  const handleImproveExperience = (index: number) => {
    const entry = experience[index];
    improveExperienceMutation.mutate(entry, {
      onSuccess: (result) => {
        setExperience((prev) =>
          prev.map((e, i) => (i === index ? result.experience : e))
        );
      },
    });
  };

  const handleImproveProject = (index: number) => {
    const entry = projects[index];
    improveProjectMutation.mutate(entry, {
      onSuccess: (result) => {
        setProjects((prev) =>
          prev.map((p, i) => (i === index ? result.project : p))
        );
      },
    });
  };

  const handleSuggestSkills = () => {
    suggestSkillsMutation.mutate(skills, {
      onSuccess: (result) => setSkills(result.skills),
    });
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills((prev) => [...prev, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
  };

  const handleExport = () => {
    exportMutation.mutate(resumeId);
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {resume.title}
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exportMutation.isPending}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            {exportMutation.isPending ? "Exporting..." : "Export PDF"}
          </button>
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {updateMutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl space-y-8">
          {/* Personal Information */}
          <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Personal Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Full Name"
                value={personalInfo.name}
                onChange={(e) => setPersonalInfo((p) => ({ ...p, name: e.target.value }))}
                className="col-span-2 rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
              <input
                type="email"
                placeholder="Email"
                value={personalInfo.email}
                onChange={(e) => setPersonalInfo((p) => ({ ...p, email: e.target.value }))}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={personalInfo.phone}
                onChange={(e) => setPersonalInfo((p) => ({ ...p, phone: e.target.value }))}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
              <input
                type="text"
                placeholder="Location"
                value={personalInfo.location}
                onChange={(e) => setPersonalInfo((p) => ({ ...p, location: e.target.value }))}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
              <input
                type="text"
                placeholder="LinkedIn URL"
                value={personalInfo.linkedin}
                onChange={(e) => setPersonalInfo((p) => ({ ...p, linkedin: e.target.value }))}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
              <input
                type="text"
                placeholder="GitHub URL"
                value={personalInfo.github}
                onChange={(e) => setPersonalInfo((p) => ({ ...p, github: e.target.value }))}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
          </section>

          {/* ATS Analysis */}
          <ATSAnalysisPanel resumeId={resumeId} />

          {/* Professional Summary */}
          <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Professional Summary
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={handleImproveSummary}
                  disabled={improveSummaryMutation.isPending}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  {improveSummaryMutation.isPending ? "Improving..." : "Improve"}
                </button>
                <button
                  onClick={handleRewriteSummary}
                  disabled={rewriteSummaryMutation.isPending}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  {rewriteSummaryMutation.isPending ? "Rewriting..." : "Rewrite"}
                </button>
              </div>
            </div>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="Write a brief professional summary..."
            />
          </section>

          {/* Experience */}
          <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Experience
            </h2>
            <div className="space-y-4">
              {experience.map((entry, index) => (
                <div key={index} className="space-y-3 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
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
                      className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
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
                      className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
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
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                  <button
                    onClick={() => handleImproveExperience(index)}
                    disabled={improveExperienceMutation.isPending}
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    {improveExperienceMutation.isPending ? "Improving..." : "Improve with AI"}
                  </button>
                </div>
              ))}
              {experience.length === 0 && (
                <p className="text-sm text-zinc-500 dark:text-zinc-500">
                  No experience entries yet. They will be added during AI generation.
                </p>
              )}
            </div>
          </section>

          {/* Projects */}
          <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Projects
            </h2>
            <div className="space-y-4">
              {projects.map((entry, index) => (
                <div key={index} className="space-y-3 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
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
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
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
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                  <button
                    onClick={() => handleImproveProject(index)}
                    disabled={improveProjectMutation.isPending}
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    {improveProjectMutation.isPending ? "Improving..." : "Improve with AI"}
                  </button>
                </div>
              ))}
              {projects.length === 0 && (
                <p className="text-sm text-zinc-500 dark:text-zinc-500">
                  No project entries yet.
                </p>
              )}
            </div>
          </section>

          {/* Skills */}
          <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Skills
              </h2>
              <button
                onClick={handleSuggestSkills}
                disabled={suggestSkillsMutation.isPending}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {suggestSkillsMutation.isPending ? "Suggesting..." : "Suggest Skills"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {skill}
                  <button
                    onClick={() => handleRemoveSkill(skill)}
                    className="ml-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                placeholder="Add a skill..."
                className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
              <button
                onClick={handleAddSkill}
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Add
              </button>
            </div>
          </section>

          {/* Education */}
          <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Education
            </h2>
            <div className="space-y-4">
              {education.map((entry, index) => (
                <div key={index} className="grid grid-cols-2 gap-3 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
                  <input
                    type="text"
                    placeholder="Institution"
                    value={entry.institution}
                    readOnly
                    className="col-span-2 rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                  <input
                    type="text"
                    placeholder="Degree"
                    value={entry.degree}
                    readOnly
                    className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                  <input
                    type="text"
                    placeholder="Field of Study"
                    value={entry.field}
                    readOnly
                    className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>
              ))}
              {education.length === 0 && (
                <p className="text-sm text-zinc-500 dark:text-zinc-500">
                  No education entries yet.
                </p>
              )}
            </div>
          </section>

          {/* Cover Letter */}
          <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Cover Letter
            </h2>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={10}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              placeholder="Your cover letter will be generated during AI analysis..."
            />
          </section>

          {/* Saved Cover Letters */}
          <CoverLettersPanel resumeId={resumeId} />
        </div>
      </div>
    </div>
  );
}
