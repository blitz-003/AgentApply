"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { registerSchema, type RegisterFormData } from "@/schemas/auth";
import { useAuth } from "@/features/auth/auth-context";
import Link from "next/link";
import { PasswordInput } from "@/components/password-input";

const inputClass =
  "field-focus w-full rounded-sm border border-hairline bg-canvas px-4 py-3 text-base text-ink placeholder:text-muted-soft focus:outline-none focus:ring-0";

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await registerUser(data.name, data.email, data.password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 items-center justify-center bg-surface-soft px-6 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-md border border-hairline bg-canvas p-8 shadow-card">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-ink">Create your account</h1>
            <p className="mt-2 text-sm text-muted">
              Start building resumes that actually get read
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-sm border border-hairline bg-canvas px-4 py-3 text-sm text-primary">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="mb-1.5 block text-sm font-medium text-ink"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                {...register("name")}
                placeholder="Your full name"
                className={inputClass}
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-primary">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-ink"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register("email")}
                placeholder="you@example.com"
                className={inputClass}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-primary">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-ink"
              >
                Password
              </label>
              <PasswordInput
                id="password"
                {...register("password")}
                placeholder="At least 8 characters"
                className={inputClass}
                disabled={isSubmitting}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-primary">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1.5 block text-sm font-medium text-ink"
              >
                Confirm Password
              </label>
              <PasswordInput
                id="confirmPassword"
                {...register("confirmPassword")}
                placeholder="Re-enter your password"
                className={inputClass}
                disabled={isSubmitting}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-primary">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-grow w-full rounded-sm bg-primary py-3 text-base font-medium text-white hover:bg-primary-active disabled:bg-primary-disabled"
            >
              {isSubmitting ? "Creating account..." : "Register"}
            </button>
          </form>

          <p className="mt-6 border-t border-hairline pt-6 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-ink hover:text-primary"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
