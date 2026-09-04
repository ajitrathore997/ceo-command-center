import { getAuthenticatedUserFromCookies } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getAuthenticatedUserFromCookies();

  if (!user) {
    redirect("/login");
  }

  return children;
}