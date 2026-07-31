export type BlogBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "quote"; text: string };

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: string;
  category: string;
  blocks: BlogBlock[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: "how-to-apply-for-jobs",
    title: "How to Apply for Jobs (and Actually Get a Reply)",
    description:
      "Most applications never reach a human. Here's the application strategy that actually gets responses.",
    date: "July 28, 2026",
    readTime: "6 min read",
    category: "Job Search",
    blocks: [
      {
        type: "paragraph",
        text: "Applying for jobs by blasting the same resume to a hundred listings is the fastest way to hear nothing back. Recruiters and applicant tracking systems (ATS) are looking for fit signals, and a generic application sends none. The good news: the fix is systematic, not mysterious.",
      },
      {
        type: "heading",
        text: "Quality over volume",
      },
      {
        type: "paragraph",
        text: "Send 10 tailored applications instead of 100 identical ones. Recruiters can tell when a resume was written for their specific role, and the response rate difference is dramatic. Before you apply, spend 15 minutes understanding what the company actually needs from this hire.",
      },
      {
        type: "list",
        items: [
          "Read the job description twice and highlight the top five requirements.",
          "Check the company's product and recent news so your cover letter references something real.",
          "Look up the hiring manager or recruiter on LinkedIn when possible.",
        ],
      },
      {
        type: "heading",
        text: "Match the language of the job description",
      },
      {
        type: "paragraph",
        text: "ATS software ranks candidates by keyword matches against the job description. If the posting says 'customer-facing' and your resume says 'client-facing,' many systems won't connect them. Use the same phrasing the company uses, naturally, in your actual experience — never keyword stuffing.",
      },
      {
        type: "heading",
        text: "Apply within the first few days",
      },
      {
        type: "paragraph",
        text: "Many roles have a soft deadline. Applications submitted in the first 72 hours are far more likely to be reviewed before the flood of later applicants. Set aside one block of time per week to scan new postings and apply immediately.",
      },
      {
        type: "quote",
        text: "A tailored resume for the right role beats a perfect resume for the wrong role every single time.",
      },
      {
        type: "heading",
        text: "Follow up once, then move on",
      },
      {
        type: "paragraph",
        text: "A single polite follow-up after 5-7 business days is professional, not pushy. If you still hear nothing after that, treat it as a no and keep moving. The goal is momentum: a steady pipeline of tailored applications beats waiting on any single one.",
      },
    ],
  },
  {
    slug: "ats-friendly-resume-guide",
    title: "How to Create an ATS-Friendly Resume",
    description:
      "Up to 75% of resumes are rejected before a human sees them. Here's how to beat the bots.",
    date: "July 21, 2026",
    readTime: "7 min read",
    category: "Resume Tips",
    blocks: [
      {
        type: "paragraph",
        text: "An Applicant Tracking System (ATS) is software that parses your resume, extracts your information, and scores it against the job. It's not evil — it's just literal. It can't infer meaning, it reads what's written. Optimize for the parser first, the human second.",
      },
      {
        type: "heading",
        text: "Use a simple, parseable layout",
      },
      {
        type: "list",
        items: [
          "One column, standard headings (Experience, Education, Skills).",
          "Standard fonts and no text boxes, tables, images, or graphics.",
          "PDF or DOCX — never an image or a scanned file.",
          "No headers or footers with contact information; parsers often miss them.",
        ],
      },
      {
        type: "heading",
        text: "Mirror the job description's keywords",
      },
      {
        type: "paragraph",
        text: "Extract the exact keywords from the job description — both hard skills (React, SQL, Figma) and soft skills (collaboration, stakeholder management) — and work them into your bullet points. Your bullet points should describe what you did using the same terms the employer used.",
      },
      {
        type: "heading",
        text: "Quantify everything you can",
      },
      {
        type: "paragraph",
        text: "ATS score matters, but so does the human who eventually reads it. Strong resumes combine keyword alignment with evidence: numbers, percentages, and scope. 'Reduced load time by 40%' beats 'Improved website performance.'",
      },
      {
        type: "heading",
        text: "The three-second scan test",
      },
      {
        type: "paragraph",
        text: "After the ATS passes your resume, a human spends roughly 3-7 seconds on a first pass. Make sure the most important information — your current role, most relevant achievements, and contact details — appears in the top third of the page. Don't bury your strongest bullets below the fold.",
      },
      {
        type: "quote",
        text: "Write for the machine so you get a chance to win over the human.",
      },
      {
        type: "paragraph",
        text: "Running every resume against a live ATS check, including a score and keyword gaps, is exactly what Agent Apply's analyzer does before you ever send a file.",
      },
    ],
  },
  {
    slug: "find-remote-jobs",
    title: "How to Find Remote Jobs in 2026",
    description:
      "Remote roles are competitive but findable. A practical playbook for locating and landing them.",
    date: "July 14, 2026",
    readTime: "6 min read",
    category: "Job Search",
    blocks: [
      {
        type: "paragraph",
        text: "Remote work isn't going anywhere, but the hunt has changed. Fully remote roles get flooded with applicants, so the strategy is to find the ones that are quietly posted, and to signal your remote-readiness loudly.",
      },
      {
        type: "heading",
        text: "Know the four kinds of remote jobs",
      },
      {
        type: "list",
        items: [
          "Fully remote: work from anywhere in the company's allowed countries.",
          "Remote-first: companies built around distributed teams from day one.",
          "Hybrid-flexible: mostly office-based with remote allowance.",
          "Remote-only niche boards: startup and developer-focused remote job boards.",
        ],
      },
      {
        type: "heading",
        text: "Go where the roles actually are",
      },
      {
        type: "paragraph",
        text: "General job boards bury remote listings. Dedicated remote boards, company career pages filtered by 'remote,' and LinkedIn's 'Remote' location filter surface the real inventory. Also search for remote roles directly on company websites — many never get posted externally.",
      },
      {
        type: "heading",
        text: "Show proof you thrive remotely",
      },
      {
        type: "paragraph",
        text: "Remote hiring is a trust game. On your resume, call out asynchronous collaboration, written communication, and self-directed work. Mention distributed tools you've used (Slack, Notion, GitHub, Loom) and, if you've worked remotely before, say so explicitly.",
      },
      {
        type: "heading",
        text: "Beware the flood zone",
      },
      {
        type: "paragraph",
        text: "Popular remote postings can receive hundreds of applications in a day. Apply early, and make the very first lines of your resume and cover letter reference the specific role. Generic openings get skipped; tailored ones get read.",
      },
      {
        type: "quote",
        text: "Remote employers aren't looking for the best resume. They're looking for proof you can deliver without being watched.",
      },
      {
        type: "paragraph",
        text: "When you find a remote role you love, paste the job description into Agent Apply and let the AI tailor your resume and cover letter to it in under a minute.",
      },
    ],
  },
  {
    slug: "no-interview-callbacks",
    title: "Why You're Not Getting Interview Callbacks",
    description:
      "Great experience, zero interviews. The five most common reasons — and what to change today.",
    date: "July 7, 2026",
    readTime: "7 min read",
    category: "Career Advice",
    blocks: [
      {
        type: "paragraph",
        text: "If you've sent out dozens of applications and heard nothing, your experience probably isn't the problem. The problem is almost always one of five fixable issues in how your application is presented.",
      },
      {
        type: "heading",
        text: "1. Your resume is being filtered by the ATS",
      },
      {
        type: "paragraph",
        text: "Before a human ever sees your resume, software decides whether it passes. Unusual fonts, multi-column layouts, text in headers or footers, and missing keywords all get your resume silently rejected. If your resume has any of these, it doesn't matter how good you are — nobody is reading it.",
      },
      {
        type: "heading",
        text: "2. You're not matching the job description",
      },
      {
        type: "paragraph",
        text: "A generic resume sent to twenty different roles matches none of them well. Every job description has a language of its own. If the posting emphasizes 'growth marketing' and your resume says 'digital marketing,' the connection is never made.",
      },
      {
        type: "heading",
        text: "3. No measurable results",
      },
      {
        type: "paragraph",
        text: "Duties describe a job; results prove you did it well. 'Responsible for managing a sales team' is a responsibility. 'Grew regional revenue 34% in two quarters' is evidence. Replace responsibility phrasing with outcome phrasing everywhere you can.",
      },
      {
        type: "heading",
        text: "4. You're applying too late",
      },
      {
        type: "paragraph",
        text: "Many roles receive enough applications to close early. Applying within days of a posting, rather than weeks, dramatically improves your odds of being reviewed at all.",
      },
      {
        type: "heading",
        text: "5. The first screen is weak",
      },
      {
        type: "paragraph",
        text: "Even when a human opens your resume, they scan for a few seconds. If your headline, summary, and first bullet don't immediately say what you do and how well you do it, they move on. The top third of your resume is prime real estate — use it for your strongest content.",
      },
      {
        type: "quote",
        text: "You don't need to be a better candidate. You need to present the candidate you already are more clearly.",
      },
      {
        type: "paragraph",
        text: "Run your resume through an ATS analyzer and fix the exact gaps it finds before your next application. That's the fastest path from silence to interviews.",
      },
    ],
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getLatestPosts(count = 3): BlogPost[] {
  return blogPosts.slice(0, count);
}
