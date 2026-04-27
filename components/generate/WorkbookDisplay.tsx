"use client";

import { useState } from "react";
import { NLP_CATEGORIES, type Workbook } from "@/types";
import { BookOpen, Layers, Search, Sparkles } from "lucide-react";

interface Props {
  workbook: Workbook;
}

const TABS = [
  { id: "sheet1", label: "NLP Categories", icon: BookOpen },
  { id: "sheet2", label: "Content Map",    icon: Layers },
  { id: "sheet3", label: "SERP Insights",  icon: Search },
  { id: "sheet4", label: "LSI Semantic",   icon: Sparkles },
] as const;

type TabId = typeof TABS[number]["id"];

export default function WorkbookDisplay({ workbook }: Props) {
  const [active, setActive] = useState<TabId>("sheet1");

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Tab strip */}
      <div className="flex border-b border-border bg-muted/30 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors ${
              active === id
                ? "bg-card text-foreground border-b-2 border-primary -mb-px"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {/* Meta header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4 mb-4 border-b border-border">
          <MetaRow label="Primary keyword" value={workbook.primaryKeyword} highlight />
          <MetaRow label="Permalink" value={`/${workbook.permalink}`} mono />
          <MetaRow label="SEO title" value={workbook.seoTitle} />
          <MetaRow label="Meta description" value={workbook.metaDescription} />
        </div>

        {active === "sheet1" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {NLP_CATEGORIES.map((cat) => {
              const list = workbook.sheet1?.categories?.[cat] ?? [];
              return (
                <div key={cat} className="border border-border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-foreground uppercase tracking-wide">{cat}</p>
                    <span className="text-[10px] text-muted-foreground">{list.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {list.length > 0 ? (
                      list.slice(0, 12).map((kw) => (
                        <span key={kw} className="text-[11px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                          {kw}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic">none generated</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {active === "sheet2" && (
          <div className="space-y-3">
            {(workbook.sheet2?.clusters ?? []).map((c, i) => (
              <div key={i} className="border border-border rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{c.clusterName}</p>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                      c.priority === "high"
                        ? "bg-destructive/10 text-destructive"
                        : c.priority === "medium"
                        ? "bg-amber-500/10 text-amber-600"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {c.priority}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {c.targetKeywords?.map((k) => (
                    <span key={k} className="text-[11px] px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                      {k}
                    </span>
                  ))}
                </div>
                <ul className="text-xs text-muted-foreground space-y-0.5 pl-4 list-disc">
                  {c.pages?.map((p, j) => (
                    <li key={j}>
                      <span className="text-foreground">{p.title}</span> — {p.intent}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {active === "sheet3" && (
          <div className="space-y-4">
            <Section title="Ranking competitors">
              <ul className="space-y-1.5">
                {(workbook.sheet3?.ranking ?? []).map((r, i) => (
                  <li key={i} className="text-xs">
                    <p className="font-medium text-foreground">{r.title}</p>
                    <p className="text-muted-foreground">
                      <span className="text-primary">{r.url}</span> — {r.strength}
                    </p>
                  </li>
                ))}
              </ul>
            </Section>
            <Section title="Content gaps">
              <div className="flex flex-wrap gap-1.5">
                {(workbook.sheet3?.gaps ?? []).map((g) => (
                  <span key={g} className="text-[11px] px-2 py-0.5 bg-destructive/10 text-destructive rounded-full">
                    {g}
                  </span>
                ))}
              </div>
            </Section>
            <Section title="Opportunities">
              <div className="flex flex-wrap gap-1.5">
                {(workbook.sheet3?.opportunities ?? []).map((o) => (
                  <span key={o} className="text-[11px] px-2 py-0.5 bg-green-500/10 text-green-600 rounded-full">
                    {o}
                  </span>
                ))}
              </div>
            </Section>
          </div>
        )}

        {active === "sheet4" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(workbook.sheet4?.groups ?? []).map((g, i) => (
              <div key={i} className="border border-border rounded-lg p-3 space-y-2">
                <p className="text-xs font-bold text-foreground uppercase tracking-wide">{g.group}</p>
                <div className="flex flex-wrap gap-1">
                  {g.keywords?.map((k) => (
                    <span key={k} className="text-[11px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MetaRow({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`text-xs ${mono ? "font-mono" : ""} ${highlight ? "text-primary font-medium" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-foreground uppercase tracking-wide">{title}</p>
      {children}
    </div>
  );
}
