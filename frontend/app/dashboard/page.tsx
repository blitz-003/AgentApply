"use client";

import { ProtectedRoute } from "@/features/auth/protected-route";
import { useAuth } from "@/features/auth/auth-context";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="flex flex-1 items-center justify-center px-6 py-24">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-2 text-zinc-600">Welcome, {user?.name}</p>
          <p className="mt-4 text-zinc-500">
            Resume management coming in Milestone 3
          </p>
        </div>
      </div>
    </ProtectedRoute>
  );
}
