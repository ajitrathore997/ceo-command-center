import { getAuthenticatedUserFromCookies } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getAuthenticatedUserFromCookies();

  redirect(user ? "/dashboard" : "/login");
}
