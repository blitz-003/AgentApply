export interface TemplateSection {
  id: string;
  label: string;
  hint: string;
  fields: TemplateField[];
}

export interface TemplateField {
  key: string;
  label: string;
  hint: string;
  type: "text" | "textarea" | "tags" | "repeating";
  value: string | string[] | Record<string, string>[];
  subFields?: { key: string; label: string; hint: string; type: "text" | "textarea" }[];
}

export const TEMPLATE_PREFILL: TemplateSection[] = [
  {
    id: "personal_info",
    label: "Personal Information",
    hint: "Your basic contact details and professional links",
    fields: [
      { key: "name", label: "Full Name", hint: "Your full name as you want it on the resume", type: "text", value: "Elman Pathan" },
      { key: "email", label: "Email", hint: "Professional email address (name@example.com)", type: "text", value: "elmanpathan@gmail.com" },
      { key: "phone", label: "Phone", hint: "Phone number with country code (+1 234 567 8900)", type: "text", value: "" },
      { key: "location", label: "Location", hint: "City, Country (e.g. Shanghai, China)", type: "text", value: "" },
      { key: "linkedin", label: "LinkedIn URL", hint: "Full LinkedIn profile URL", type: "text", value: "linkedin.com/in/pathan-elman" },
      { key: "github", label: "GitHub URL", hint: "Your GitHub profile URL", type: "text", value: "github.com/blitz-003" },
    ],
  },
  {
    id: "summary",
    label: "Professional Summary",
    hint: "A brief 2-3 sentence overview of your career",
    fields: [
      {
        key: "summary", label: "Summary", hint: "Highlight your years of experience, key skills, and career goals", type: "textarea",
        value: "Full-Stack Developer with a B.Eng. in Computer Science from Fudan University. Experienced building AI-powered products, scalable web applications, and automation solutions using Next.js, FastAPI, AWS.",
      },
    ],
  },
  {
    id: "skills",
    label: "Technical Skills",
    hint: "List your technical skills grouped by category",
    fields: [
      { key: "skills", label: "Skills", hint: "Add individual skills (type and press Enter)", type: "tags", value: ["JavaScript (ES6+)", "TypeScript", "Python", "SQL", "Next.js", "ReactJS", "Tailwind CSS", "FastAPI", "Django", "PostgreSQL", "MongoDB", "Redis", "AWS (EC2, S3, IAM, VPC)", "Docker", "Git"] },
    ],
  },
  {
    id: "experience",
    label: "Work Experience",
    hint: "Your professional work history (up to 3 entries)",
    fields: [
      {
        key: "experience", label: "Experience Entries", hint: "Add your work experience", type: "repeating", value: [
          { company: "Shengyi Zhuanjia", position: "Product Engineer", description: "Designed and deployed AI-powered ERP workflows for SME inventory, procurement, and international operations, reducing manual processing time by 60%.\nCollaborated with product, design, and engineering teams across 3 time zones to deliver production-ready features on schedule.\nDrove a 45% improvement in inventory turnover and 70% increase in customer retention through automated supply chain optimization.", start_date: "Apr 2025", end_date: "Present" },
          { company: "Tianyi Security Technology", position: "Software / Test Engineer", description: "Developed Python automation scripts and backend testing tools, automating 15+ recurring manual tasks and cutting QA cycle time in half.\nBuilt CI/CD pipelines integrating automated regression tests, reducing deployment failures by 80%.\nCollaborated with cross-functional teams to implement code quality standards, improving test coverage from 45% to 92%.", start_date: "Oct 2024", end_date: "Jan 2025" },
          { company: "Freelance", position: "Full-Stack Developer", description: "Solved inefficient booking workflows by architecting a scalable full-stack platform serving 200+ monthly users.\nIntegrated a secure payment system handling 500+ monthly transactions with zero downtime.\nReduced operational costs by 30% through automation of manual invoicing, scheduling, and client communication processes.", start_date: "Jul 2021", end_date: "Jun 2023" },
        ],
        subFields: [
          { key: "company", label: "Company", hint: "Company name", type: "text" },
          { key: "position", label: "Position", hint: "Job title", type: "text" },
          { key: "description", label: "Description", hint: "Describe your role and achievements using STAR method", type: "textarea" },
          { key: "start_date", label: "Start Date", hint: "e.g. Jan 2020", type: "text" },
          { key: "end_date", label: "End Date", hint: "e.g. Present or Dec 2023", type: "text" },
        ],
      },
    ],
  },
  {
    id: "education",
    label: "Education",
    hint: "Your academic background",
    fields: [
      {
        key: "education", label: "Education Entries", hint: "Add your degrees and certifications", type: "repeating", value: [
          { institution: "Fudan University", degree: "B.S.", field: "Computer Science and Engineering", start_date: "Sept 2018", end_date: "Jul 2025" },
        ],
        subFields: [
          { key: "institution", label: "Institution", hint: "School or university name", type: "text" },
          { key: "degree", label: "Degree", hint: "e.g. B.S., M.S., PhD", type: "text" },
          { key: "field", label: "Field of Study", hint: "Your major or specialization", type: "text" },
          { key: "start_date", label: "Start Date", hint: "e.g. Sept 2018", type: "text" },
          { key: "end_date", label: "End Date", hint: "e.g. Jun 2022", type: "text" },
        ],
      },
    ],
  },
  {
    id: "projects",
    label: "Key Projects",
    hint: "Notable projects (up to 3)",
    fields: [
      {
        key: "projects", label: "Project Entries", hint: "Add your key projects", type: "repeating", value: [
          { title: "BiblioDrop - Online Book Marketplace", description: "Developed a responsive frontend using Next.js, HeroUI, and TanStack Query with dynamic routing and SSR for optimal SEO.\nImplemented secure user authentication with role-based dashboards supporting buyer, seller, and admin roles.\nIntegrated Stripe for secure payment processing and Cloudinary for efficient media management and delivery.", start_date: "", end_date: "" },
          { title: "Idea Validation Engine", description: "Built a full-stack collaborative platform using Next.js and MongoDB for validating and reviewing startup ideas in real-time.\nImplemented secure CRUD operations, JWT authentication, and role-based access control for team collaboration.\nDesigned an intuitive voting and feedback system that streamlined the idea iteration process for 50+ beta users.", start_date: "", end_date: "" },
          { title: "AI-Powered Code Review Tool", description: "Created an automated code review system integrating OpenAI API to generate intelligent suggestions for code improvements.\nReduced average code review time by 40% through automated linting, style checking, and best-practice recommendations.\nBuilt a comprehensive dashboard for tracking review metrics, team productivity trends, and code quality over time.", start_date: "", end_date: "" },
        ],
        subFields: [
          { key: "title", label: "Project Title", hint: "Project name with brief tech stack", type: "text" },
          { key: "description", label: "Description", hint: "Describe the project, your role, and key outcomes", type: "textarea" },
          { key: "start_date", label: "Start Date", hint: "e.g. Jan 2022", type: "text" },
          { key: "end_date", label: "End Date", hint: "e.g. Jun 2022", type: "text" },
        ],
      },
    ],
  },
];
