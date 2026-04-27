import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { IconThemeToggle } from "@/components/theme/ThemeToggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      {/* Back to home */}
      <Link
        href="/"
        className="fixed top-4 left-4 z-50 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
        Home
      </Link>
      {/* Compact theme toggle */}
      <div className="fixed top-4 right-4 z-50">
        <IconThemeToggle />
      </div>
      {children}
    </div>
  );
}
