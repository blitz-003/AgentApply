import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts, getPostBySlug } from "@/lib/blog";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Not Found | Agent Apply" };
  return {
    title: `${post.title} | Agent Apply`,
    description: post.description,
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <div className="bg-canvas">
      <article className="mx-auto max-w-3xl px-6 py-16 lg:py-20">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-ink"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 17l-5-5m0 0l5-5m-5 5h12"
            />
          </svg>
          All articles
        </Link>

        <div className="mt-8 flex items-center gap-3">
          <span className="inline-flex rounded-full bg-surface-strong px-3 py-1 text-xs font-medium text-muted">
            {post.category}
          </span>
          <span className="text-xs text-muted-soft">{post.readTime}</span>
        </div>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-ink md:text-5xl">
          {post.title}
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-body">
          {post.description}
        </p>
        <div className="mt-4 text-sm text-muted-soft">
          {post.date} &middot; Agent Apply Team
        </div>

        <div className="mt-10 border-t border-hairline-soft pt-8">
          {post.blocks.map((block, i) => {
            switch (block.type) {
              case "heading":
                return (
                  <h2
                    key={i}
                    className="mb-4 mt-10 text-2xl font-bold tracking-tight text-ink"
                  >
                    {block.text}
                  </h2>
                );
              case "list":
                return (
                  <ul key={i} className="mb-6 space-y-3">
                    {block.items.map((item, j) => (
                      <li
                        key={j}
                        className="flex items-start gap-3 text-base leading-relaxed text-body"
                      >
                        <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                );
              case "quote":
                return (
                  <blockquote
                    key={i}
                    className="mb-6 border-l-4 border-primary py-2 pl-6 text-xl font-semibold leading-relaxed text-ink"
                  >
                    {block.text}
                  </blockquote>
                );
              default:
                return (
                  <p
                    key={i}
                    className="mb-6 text-base leading-relaxed text-body"
                  >
                    {block.text}
                  </p>
                );
            }
          })}
        </div>

        <div className="mt-12 rounded-md bg-surface-soft p-8 text-center">
          <h2 className="text-xl font-bold text-ink">
            Ready to put this into practice?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
            Paste a job description and get an ATS-optimized resume plus cover
            letter in under a minute.
          </p>
          <Link
            href="/register"
            className="mt-6 inline-flex h-12 items-center rounded-full bg-primary px-7 text-base font-medium text-white transition-colors hover:bg-primary-active"
          >
            Build My Resume
          </Link>
        </div>
      </article>
    </div>
  );
}
