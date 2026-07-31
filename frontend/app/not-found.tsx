import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="text-6xl font-bold text-ink">404</h1>
      <p className="mt-4 text-xl text-muted">
        Page not found
      </p>
      <p className="mt-2 text-muted-soft">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-primary px-6 py-3 font-medium text-white hover:bg-primary-active"
      >
        Go Home
      </Link>
    </div>
  );
}
