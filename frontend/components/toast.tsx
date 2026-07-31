"use client";

import { useToast } from "./toast-context";

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 rounded-lg px-4 py-3 shadow-md border ${
            toast.type === "success"
              ? "bg-green-100 text-green-800 border-green-200"
              : toast.type === "error"
              ? "bg-red-100 text-red-800 border-red-200"
              : "bg-blue-100 text-blue-800 border-blue-200"
          }`}
        >
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            aria-label="Close"
            className="ml-2 rounded-full p-1 hover:bg-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
