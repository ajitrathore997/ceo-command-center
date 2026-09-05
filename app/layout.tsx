import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CEO Command Center",
  description: "Internal real-estate leadership dashboard",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">{children}</body>
    </html>
  );
}
