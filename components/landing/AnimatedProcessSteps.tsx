"use client";

import { FileText, Brain, Search, Sparkles, BarChart3, CheckCircle2, Globe, Zap } from "lucide-react";

const STEPS = [
  { icon: FileText, title: "Enter Niche + Topic + Region", desc: "Tell us what to write about and where you want to rank." },
  { icon: Brain, title: "AI Brainstorms Topics", desc: "No topic? Our AI suggests 5 high-value ideas instantly." },
  { icon: Search, title: "Scrape Top 10 Ranking Pages", desc: "Firecrawl scans the actual pages outranking you." },
  { icon: Sparkles, title: "Extract Keywords & Meta Data", desc: "1 primary, 4 secondary, 20 semantic keywords." },
  { icon: FileText, title: "Generate SEO Blog Structure", desc: "10 keyword-rich H2 sections built to surpass competitors." },
  { icon: Zap, title: "Write Content Section by Section", desc: "Streamed live. Human-like, E-E-A-T optimised." },
  { icon: BarChart3, title: "AI Audit + SEO Score", desc: "Grammar check, keyword injection, E-E-A-T review." },
  { icon: CheckCircle2, title: "Schema + Featured Image", desc: "JSON-LD markup generated automatically." },
  { icon: Globe, title: "Publish to WordPress", desc: "One click. Blog goes live with correct meta." },
];

export default function AnimatedProcessSteps() {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        return (
          <div
            key={idx}
            className="group rounded-lg border border-border bg-card hover:border-primary/40 p-6 transition-all hover:shadow-lg hover:bg-primary/5"
            style={{
              animationDelay: `${idx * 50}ms`,
            }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <Icon size={24} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{step.title}</p>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
