import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-6xl font-bold text-zinc-900 dark:text-zinc-100">404</h1>
      <p className="mt-4 text-xl text-zinc-600 dark:text-zinc-400">
        Page not found
      </p>
      <p className="mt-2 text-zinc-500 dark:text-zinc-500">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-zinc-900 px-6 py-3 font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Go Home
      </Link>
    </div>
  );
}
