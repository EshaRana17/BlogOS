"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  User,
  Shield,
  LogOut,
  Building2,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import BlogOSLogo from "@/components/logo/BlogOSLogo";
import { IconThemeToggle } from "@/components/theme/ThemeToggle";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/generate", label: "Generate Blog", icon: Sparkles },
  { href: "/profile", label: "My Profile", icon: User },
];

const PLAN_COLORS: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  pro: "bg-primary/10 text-primary",
  business: "bg-accent/10 text-accent",
};

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  async function handleLogout() {
    await signOut(auth);
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <aside className="w-60 shrink-0 min-h-screen bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <BlogOSLogo size="sm" showTagline={false} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive(href)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon size={16} strokeWidth={isActive(href) ? 2.5 : 1.75} />
            {label}
          </Link>
        ))}

        {/* Business cluster (only for business plan) */}
        {user?.plan === "business" && (
          <Link
            href="/generate/business"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive("/generate/business")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Building2 size={16} />
            Cluster Engine
          </Link>
        )}

        {/* Admin panel (only for admins) */}
        {user?.isAdmin && (
          <>
            <div className="my-2 h-px bg-border" />
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive("/admin")
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Shield size={16} />
              Admin Panel
            </Link>
          </>
        )}
      </nav>

      {/* Bottom: theme toggle + user info + logout */}
      <div className="px-3 py-4 border-t border-border space-y-3">
        <div className="px-2">
          <IconThemeToggle />
        </div>

        {user && (
          <div className="flex items-center gap-2.5 px-2">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary text-sm font-bold shrink-0">
              {user.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                {user.name}
              </p>
              <span
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded font-medium capitalize",
                  PLAN_COLORS[user.plan]
                )}
              >
                {user.plan} plan
              </span>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LogOut size={14} />
          Log out
        </button>
      </div>
    </aside>
  );
}
