"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/features/auth/auth-context";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster
            theme="light"
            position="top-center"
            duration={3750}
            toastOptions={{
              classNames: {
                toast:
                  "!bg-surface-soft !border !border-hairline !text-ink !shadow-card !rounded-sm !py-3 !px-4",
                title: "!text-sm !font-medium !text-ink",
                description: "!text-sm !text-muted",
                success: "!bg-surface-soft",
                error: "!bg-surface-soft !text-error",
              },
            }}
          />
      </AuthProvider>
    </QueryClientProvider>
  );
}
