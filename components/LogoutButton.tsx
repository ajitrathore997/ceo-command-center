"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <button
      className="min-h-11 rounded-md border border-border bg-surface-alt px-3 text-sm font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-60"
      type="button"
      onClick={() => void handleLogout()}
      disabled={isLoggingOut}
    >
      {isLoggingOut ? "Signing out..." : "Logout"}
    </button>
  );
}