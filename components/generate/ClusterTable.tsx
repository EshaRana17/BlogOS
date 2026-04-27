"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, Loader2, XCircle, ExternalLink, Rocket, CalendarDays } from "lucide-react";
import type { ClusterPlan, ClusterDay } from "@/types";

interface Props {
  cluster: ClusterPlan;
  onUpdate: (cluster: ClusterPlan) => void;
}

type QueueSize = 1 | 7 | 30;

const FUNNEL_COLORS: Record<string, string> = {
  TOFU: "bg-blue-500/10 text-blue-600",
  MOFU: "bg-amber-500/10 text-amber-600",
  BOFU: "bg-green-500/10 text-green-600",
};

export default function ClusterTable({ cluster, onUpdate }: Props) {
  const router = useRouter();
  const [queueing, setQueueing] = useState(false);
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });

  /* Generate a single day — sequential within the queue so we respect API limits */
  async function generateDay(day: number): Promise<boolean> {
    setActiveDay(day);
    try {
      const res = await fetch("/api/cluster/generate-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clusterId: cluster.id, day }),
      });
      const data = await res.json();
      if (!res.ok) {
        onUpdate({
          ...cluster,
          days: cluster.days.map((d) => (d.day === day ? { ...d, status: "error" } : d)),
        });
        return false;
      }
      onUpdate({
        ...cluster,
        days: cluster.days.map((d) =>
          d.day === day ? { ...d, status: "done", blogId: data.blogId, generatedAt: new Date().toISOString() } : d
        ),
      });
      return true;
    } catch {
      return false;
    } finally {
      setActiveDay(null);
    }
  }

  async function runQueue(size: QueueSize) {
    /* Pick the next N days that are not already done */
    const targets = cluster.days
      .filter((d) => d.status !== "done")
      .slice(0, size)
      .map((d) => d.day);

    if (targets.length === 0) return;

    setQueueing(true);
    setProgress({ done: 0, total: targets.length });

    for (let i = 0; i < targets.length; i++) {
      const ok = await generateDay(targets[i]);
      setProgress({ done: i + 1, total: targets.length });
      if (!ok) break;
    }

    setQueueing(false);
    setProgress({ done: 0, total: 0 });
  }

  const completed = cluster.days.filter((d) => d.status === "done").length;

  return (
    <div className="space-y-4">
      {/* Queue controls */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 mr-auto">
          <CalendarDays size={14} className="text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">30-Day Plan</p>
          <span className="text-xs text-muted-foreground">
            ({completed} / 30 generated)
          </span>
        </div>

        {queueing ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 size={14} className="animate-spin text-primary" />
            Generating {progress.done} / {progress.total}
            {activeDay ? <span>· Day {activeDay}</span> : null}
          </div>
        ) : (
          <>
            <Button size="sm" variant="outline" onClick={() => runQueue(1)} disabled={completed >= 30}>
              <Rocket size={12} className="mr-1.5" />
              Next 1
            </Button>
            <Button size="sm" variant="outline" onClick={() => runQueue(7)} disabled={completed >= 30}>
              <Rocket size={12} className="mr-1.5" />
              Next 7
            </Button>
            <Button size="sm" variant="gradient" onClick={() => runQueue(30)} disabled={completed >= 30}>
              <Rocket size={12} className="mr-1.5" />
              All 30
            </Button>
          </>
        )}
      </div>

      {/* Scrollable table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 border-b border-border">
              <tr className="text-muted-foreground uppercase tracking-wide">
                <Th>#</Th>
                <Th>Title</Th>
                <Th>Funnel</Th>
                <Th>NLP</Th>
                <Th>Permalink</Th>
                <Th>Primary KW</Th>
                <Th>Status</Th>
                <Th>Action</Th>
              </tr>
            </thead>
            <tbody>
              {cluster.days.map((d) => (
                <Row
                  key={d.day}
                  day={d}
                  active={activeDay === d.day}
                  onGenerate={() => generateDay(d.day)}
                  onOpen={(blogId) => router.push(`/blog/${blogId}`)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left font-semibold px-3 py-2.5 text-[10px]">{children}</th>;
}

function Row({
  day,
  active,
  onGenerate,
  onOpen,
}: {
  day: ClusterDay;
  active: boolean;
  onGenerate: () => void;
  onOpen: (blogId: string) => void;
}) {
  return (
    <tr className="border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors">
      <td className="px-3 py-2.5 font-bold text-muted-foreground">{day.day}</td>
      <td className="px-3 py-2.5 text-foreground max-w-[280px] truncate" title={day.title}>
        {day.title}
      </td>
      <td className="px-3 py-2.5">
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${FUNNEL_COLORS[day.funnel] ?? "bg-muted text-muted-foreground"}`}>
          {day.funnel}
        </span>
      </td>
      <td className="px-3 py-2.5 text-muted-foreground text-[10px]">{day.nlpCategory}</td>
      <td className="px-3 py-2.5 font-mono text-[10px] text-primary truncate max-w-[160px]" title={day.slug}>
        /{day.slug}
      </td>
      <td className="px-3 py-2.5 text-muted-foreground truncate max-w-[180px]" title={day.primaryKeyword}>
        {day.primaryKeyword}
      </td>
      <td className="px-3 py-2.5">
        <StatusPill status={active ? "generating" : day.status} />
      </td>
      <td className="px-3 py-2.5">
        {day.status === "done" && day.blogId ? (
          <button
            onClick={() => onOpen(day.blogId!)}
            className="text-primary hover:underline flex items-center gap-1"
          >
            Open <ExternalLink size={10} />
          </button>
        ) : (
          <button
            onClick={onGenerate}
            disabled={active || day.status === "generating"}
            className="text-[11px] px-2 py-1 rounded border border-border hover:border-primary/60 hover:text-primary transition-colors disabled:opacity-50"
          >
            Generate
          </button>
        )}
      </td>
    </tr>
  );
}

function StatusPill({ status }: { status: string }) {
  if (status === "done") {
    return (
      <span className="flex items-center gap-1 text-green-600">
        <CheckCircle2 size={11} /> Done
      </span>
    );
  }
  if (status === "generating" || status === "queued") {
    return (
      <span className="flex items-center gap-1 text-primary">
        <Loader2 size={11} className="animate-spin" /> {status === "queued" ? "Queued" : "Writing"}
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="flex items-center gap-1 text-destructive">
        <XCircle size={11} /> Error
      </span>
    );
  }
  return <span className="text-muted-foreground">Pending</span>;
}
