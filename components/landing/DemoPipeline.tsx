"use client";

import { useEffect, useState } from "react";
import { Search, Brain, FileText, Sparkles, BarChart3, CheckCircle2, Globe } from "lucide-react";

const STEPS = [
  { label: "Scraping 10 competitor pages…", icon: Search },
  { label: "Extracting 25 keywords…", icon: Brain },
  { label: "Building 10-section structure…", icon: FileText },
  { label: "Writing section 1 / 10…", icon: Sparkles },
  { label: "Writing section 5 / 10…", icon: Sparkles },
  { label: "Writing section 10 / 10…", icon: Sparkles },
  { label: "Running AI audit — score 91 / 100", icon: BarChart3 },
  { label: "Generating schema + featured image…", icon: CheckCircle2 },
  { label: "Blog ready to publish", icon: Globe },
];

export default function DemoPipeline() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % (STEPS.length + 2)), 900);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative bg-card/70 backdrop-blur border border-border rounded-2xl p-6 max-w-xl mx-auto shadow-xl">
      <div className="flex items-center gap-1.5 mb-5">
        <span className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        <span className="ml-auto text-[10px] text-muted-foreground font-mono">blogos.live</span>
      </div>

      <div className="space-y-2">
        {STEPS.map(({ label, icon: Icon }, i) => {
          const done = step > i;
          const active = step === i;
          return (
            <div
              key={i}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors ${
                active
                  ? "border-primary/60 bg-primary/10"
                  : done
                  ? "border-border bg-muted/40"
                  : "border-transparent opacity-50"
              }`}
            >
              <Icon
                size={14}
                className={active ? "text-primary animate-pulse" : done ? "text-green-500" : "text-muted-foreground"}
              />
              <span className="text-xs font-medium text-foreground">{label}</span>
              {done && <CheckCircle2 size={12} className="text-green-500 ml-auto" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
