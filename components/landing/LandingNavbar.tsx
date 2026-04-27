"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BlogOSLogo from "@/components/logo/BlogOSLogo";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/blog",        label: "Blog", external: false },
  { href: "#features",    label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#pricing",     label: "Pricing" },
  { href: "#industries",  label: "Industries" },
];

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-colors",
        scrolled
          ? "border-border bg-background/80 backdrop-blur-md"
          : "border-transparent bg-background/40 backdrop-blur-sm"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <BlogOSLogo size="sm" showTagline={false} />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {LINKS.map((l) =>
            l.external === false ? (
              <Link key={l.href} href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {l.label}
              </Link>
            ) : (
              <a key={l.href} href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {l.label}
              </a>
            )
          )}
        </nav>

        <div className="hidden md:flex items-center gap-2.5">
          <Link
            href="/signup"
            className="text-sm font-medium px-3.5 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Get Started
          </Link>
          <div className="flex flex-col items-center gap-1">
            <Link
              href="/login"
              className="text-sm font-medium px-3.5 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors"
            >
              Sign In
            </Link>
            <div className="scale-75 origin-top -mt-1">
              <ThemeToggle />
            </div>
          </div>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="md:hidden p-2 rounded-lg hover:bg-muted text-foreground"
          aria-label="Menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="px-4 py-4 space-y-3">
            {LINKS.map((l) =>
              l.external === false ? (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block text-sm text-muted-foreground">
                  {l.label}
                </Link>
              ) : (
                <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="block text-sm text-muted-foreground">
                  {l.label}
                </a>
              )
            )}
            <div className="flex gap-2 pt-2 border-t border-border">
              <Link href="/signup" className="flex-1 text-sm font-medium text-center py-2 rounded-lg bg-primary text-primary-foreground">
                Get Started
              </Link>
              <Link href="/login" className="flex-1 text-sm font-medium text-center py-2 rounded-lg border border-border">
                Sign In
              </Link>
            </div>
            <ThemeToggle />
          </div>
        </div>
      )}
    </header>
  );
}
