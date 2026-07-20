"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { resumeApi } from "@/lib/api/resume";
import type { ResumeDetail } from "@/types/resume";

interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
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

function getExperience(data: Record<string, unknown>) {
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

function getProjects(data: Record<string, unknown>) {
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

function getEducation(data: Record<string, unknown>) {
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

export default function ResumePrintPage() {
  const searchParams = useSearchParams();
  const resumeId = searchParams.get("id");
  const [resume, setResume] = useState<ResumeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!resumeId) {
      setError("No resume ID provided");
      setLoading(false);
      return;
    }

    resumeApi
      .get(resumeId)
      .then((data) => {
        setResume(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load resume");
        setLoading(false);
      });
  }, [resumeId]);

  useEffect(() => {
    if (resume && !loading) {
      const timer = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timer);
    }
  }, [resume, loading]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">Loading resume...</p>
      </div>
    );
  }

  if (error || !resume) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">{error || "Resume not found"}</p>
      </div>
    );
  }

  const data = (resume.resume_data as Record<string, unknown>) || {};
  const pi = getPersonalInfo(data);
  const summary = getSummary(data);
  const experience = getExperience(data);
  const projects = getProjects(data);
  const skills = getSkills(data);
  const education = getEducation(data);

  return (
    <>
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
          .resume-container { box-shadow: none; border: none; max-width: 100%; margin: 0; padding: 30px; }
        }
        @page { margin: 0.5in; size: letter; }
      `}</style>

      <div className="no-print fixed top-4 right-4 z-50">
        <button
          onClick={() => window.print()}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Print / Save as PDF
        </button>
      </div>

      <div className="resume-container mx-auto max-w-[800px] bg-white p-10 font-sans text-zinc-800 shadow-lg">
        {/* Header */}
        <div className="mb-6 border-b-2 border-blue-600 pb-5 text-center">
          <h1 className="mb-2 text-[28px] font-bold text-blue-800">
            {pi.name || "Your Name"}
          </h1>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-zinc-500">
            {pi.email && <span>{pi.email}</span>}
            {pi.phone && <span>{pi.phone}</span>}
            {pi.location && <span>{pi.location}</span>}
            {pi.linkedin && <span>{pi.linkedin}</span>}
            {pi.github && <span>{pi.github}</span>}
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div className="mb-5">
            <h2 className="mb-3 text-[18px] uppercase tracking-wide text-blue-800 border-b border-zinc-200 pb-1">
              Professional Summary
            </h2>
            <p className="text-sm leading-relaxed text-zinc-600">{summary}</p>
          </div>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <div className="mb-5">
            <h2 className="mb-3 text-[18px] uppercase tracking-wide text-blue-800 border-b border-zinc-200 pb-1">
              Experience
            </h2>
            {experience.map((exp, i) => (
              <div key={i} className="mb-4 border-l-3 border-blue-600 pl-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-base font-semibold text-zinc-800">
                    {exp.position || "Position"}
                  </span>
                  <span className="text-sm text-zinc-500">
                    {exp.company || "Company"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-600">{exp.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {education.length > 0 && (
          <div className="mb-5">
            <h2 className="mb-3 text-[18px] uppercase tracking-wide text-blue-800 border-b border-zinc-200 pb-1">
              Education
            </h2>
            {education.map((edu, i) => (
              <div key={i} className="mb-3 border-l-3 border-blue-600 pl-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-base font-semibold text-zinc-800">
                    {edu.institution || "Institution"}
                  </span>
                  <span className="text-sm text-zinc-500">
                    {[edu.degree, edu.field].filter(Boolean).join(" ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Skills */}
        {skills.length > 0 && (
          <div className="mb-5">
            <h2 className="mb-3 text-[18px] uppercase tracking-wide text-blue-800 border-b border-zinc-200 pb-1">
              Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, i) => (
                <span
                  key={i}
                  className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div className="mb-5">
            <h2 className="mb-3 text-[18px] uppercase tracking-wide text-blue-800 border-b border-zinc-200 pb-1">
              Projects
            </h2>
            {projects.map((proj, i) => (
              <div key={i} className="mb-3 border-l-3 border-blue-600 pl-4">
                <span className="text-base font-semibold text-zinc-800">
                  {proj.title || "Project"}
                </span>
                <p className="mt-1 text-sm text-zinc-600">{proj.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
