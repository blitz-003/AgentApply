import type { Metadata } from "next";
import Link from "next/link";
import { blogPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog | Agent Apply",
  description:
    "Practical, no-fluff guides on resume writing, ATS optimization, remote job hunting, and getting interview callbacks.",
};

export default function BlogPage() {
  return (
    <div className="bg-canvas">
      <section className="border-b border-hairline-soft">
        <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-8 lg:py-24">
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">
            Blog
          </span>
          <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight text-ink md:text-5xl">
            Guides that get you hired
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
            No filler. Practical advice on resumes, ATS systems, and the job
            search — tested against thousands of real applications.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {blogPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col rounded-md border border-hairline-soft p-6 transition-shadow duration-200 hover:shadow-card"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex rounded-full bg-surface-strong px-3 py-1 text-xs font-medium text-muted">
                    {post.category}
                  </span>
                  <span className="text-xs text-muted-soft">
                    {post.readTime}
                  </span>
                </div>
                <h2 className="mt-4 text-xl font-semibold text-ink transition-colors group-hover:text-primary">
                  {post.title}
                </h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                  {post.description}
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-soft">
                  <span>{post.date}</span>
                  <span>&middot;</span>
                  <span className="inline-flex items-center gap-1 font-medium text-ink group-hover:text-primary">
                    Read article
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
