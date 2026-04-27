"use client";

import { Star } from "lucide-react";

const TESTIMONIALS = [
  { name: "Sarah Mitchell", role: "SEO Consultant", text: "BlogOS cut my content production time by 80%. Worth 10x the price." },
  { name: "James Okafor", role: "Agency Owner", text: "My clients' rankings jumped within 3 weeks. Game changer." },
  { name: "Priya Nair", role: "E-Commerce Founder", text: "The 30-day cluster engine mapped out my entire content calendar." },
  { name: "Daniel Reyes", role: "Freelance Writer", text: "I deliver 5x more articles now. BlogOS handles the research." },
  { name: "Aisha Kamara", role: "Marketing Director", text: "We went from page 3 to page 1 in 6 weeks. E-E-A-T focus works." },
  { name: "Tom Brennan", role: "Digital Strategist", text: "First AI tool that understands search intent. Output reads human." },
  { name: "Fatima Al-Rashid", role: "Content Agency", text: "WordPress integration is seamless. Write, click publish, done." },
  { name: "Carlos Mendez", role: "Local Business Owner", text: "Ranking for 'best plumber Miami' and phone won't stop ringing." },
];

export default function TestimonialsMarquee({ direction = "left", duration = 50 }: { direction?: "left" | "right"; duration?: number }) {
  const style = {
    "--duration": `${duration}s`,
    "--direction": direction === "right" ? "reverse" : "normal",
  } as React.CSSProperties & { "--duration": string; "--direction": string };

  return (
    <style>{`
      @keyframes marquee {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      .marquee-container {
        animation: marquee var(--duration) linear infinite;
        animation-direction: var(--direction);
      }
      .marquee-container:hover {
        animation-play-state: paused;
      }
    `}
      <div className="relative overflow-hidden" style={style}>
        <div className="marquee-container flex gap-6 w-max" style={style}>
          {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
            <div
              key={`${i}-${t.name}`}
              className="flex-shrink-0 w-80 rounded-lg border border-border bg-card p-6 space-y-3"
            >
              <div className="flex gap-1">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} size={14} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-foreground leading-relaxed">&ldquo;{t.text}&rdquo;</p>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">{t.name}</p>
                <p className="text-[11px] text-muted-foreground">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </style>
  );
}
