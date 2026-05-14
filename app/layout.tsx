import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";

import "./globals.css";

export const metadata: Metadata = {
  title: "AI Resume Builder",
  description: "Create, tailor, and export role-specific resumes."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="border-b bg-card">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
              <span>AI Resume Builder</span>
            </Link>
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link className="rounded-md px-3 py-2 hover:bg-muted" href="/dashboard">
                工作台
              </Link>
              <Link className="rounded-md px-3 py-2 hover:bg-muted" href="/resumes/new">
                新建简历
              </Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
