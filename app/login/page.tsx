"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Unable to log in right now.");
        return;
      }

      router.replace("/dashboard");
    } catch {
      setError("Unable to log in right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-8 text-foreground">
      <div className="w-full max-w-sm">
        <div className="mb-4 flex justify-end">
          <ThemeToggle />
        </div>
        <section className="rounded-lg border border-border bg-surface p-6 shadow-sm shadow-[var(--shadow)]">
          <h1 className="text-2xl font-semibold text-foreground">CEO Command Center</h1>
          <p className="mt-2 text-sm text-muted">Sign in to continue.</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            <label className="block text-sm font-medium text-foreground" htmlFor="email">
              Email
              <input
                className="mt-1 w-full rounded-md border border-border bg-surface-alt px-3 py-2 text-foreground placeholder:text-muted"
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                disabled={isLoading}
              />
            </label>

            <label className="block text-sm font-medium text-foreground" htmlFor="password">
              Password
              <input
                className="mt-1 w-full rounded-md border border-border bg-surface-alt px-3 py-2 text-foreground placeholder:text-muted"
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                disabled={isLoading}
              />
            </label>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                {error}
              </p>
            )}

            <button
              className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
