"use client";

import { useState } from "react";
import { onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { TopicForm } from "@/components/generate/TopicForm";
import WorkbookDisplay from "@/components/generate/WorkbookDisplay";
import ClusterTable from "@/components/generate/ClusterTable";
import { ProgressTracker } from "@/components/generate/ProgressTracker";
import { Button } from "@/components/ui/Button";
import { getEffectivePlan, type ClusterPlan, type ContentType, type PipelineStep, type Workbook } from "@/types";
import { whatsAppUpgradeUrl } from "@/lib/utils";
import { AlertCircle, Building2, Lock } from "lucide-react";

const PLAN_STEPS: PipelineStep[] = [
  { id: "workbook", label: "Generating 10-category NLP workbook", status: "pending" },
  { id: "cluster",  label: "Building 30-day content plan + permalinks", status: "pending" },
];

function setStep(steps: PipelineStep[], id: string, status: PipelineStep["status"], detail?: string) {
  return steps.map((s) => (s.id === id ? { ...s, status, detail } : s));
}

export default function BusinessGeneratePage() {
  const { user } = useAuth();
  const [brainstormLoading, setBrainstormLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<PipelineStep[]>(PLAN_STEPS);
  const [workbook, setWorkbook] = useState<Workbook | null>(null);
  const [cluster, setCluster] = useState<ClusterPlan | null>(null);

  const effectivePlan = user ? getEffectivePlan(user) : "free";
  const hasClusterAccess = effectivePlan === "business";

  /* Gate — only Business plan (or admin) reaches the engine */
  if (!user) return null;

  if (!hasClusterAccess && !user.isAdmin) {
    return (
      <div className="p-8 max-w-xl mx-auto space-y-6 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary">
          <Lock size={22} />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-display font-bold text-foreground">Cluster Engine is a Business feature</h1>
          <p className="text-sm text-muted-foreground">
            Upgrade to Business ($39/mo) to unlock the NLP workbook, 30-day cluster plan, and batch blog generation.
          </p>
          {user.trialActive && user.trialEndsAt && (
            <p className="text-xs text-muted-foreground">
              Your 30-day Pro trial ends {new Date(user.trialEndsAt).toLocaleDateString()}.
            </p>
          )}
        </div>
        <a href={whatsAppUpgradeUrl("business", user.email)} target="_blank" rel="noopener noreferrer">
          <Button variant="gradient" size="lg">Upgrade on WhatsApp</Button>
        </a>
      </div>
    );
  }

  async function brainstorm(niche: string, region: string) {
    if (!niche || !region) return;
    setBrainstormLoading(true);
    try {
      const res = await fetch("/api/generate/brainstorm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, region }),
      });
      const data = await res.json();
      if (data.topics) setSuggestions(data.topics);
    } finally {
      setBrainstormLoading(false);
    }
  }

  async function runPlan(form: { niche: string; topic: string; region: string; contentType: ContentType }) {
    setRunning(true);
    setError(null);
    setWorkbook(null);
    setCluster(null);
    setSteps(PLAN_STEPS);

    try {
      /* Step 1 — NLP workbook */
      setSteps((s) => setStep(s, "workbook", "running"));
      const wbRes = await fetch("/api/workbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: form.topic, region: form.region, contentType: form.contentType }),
      });
      if (!wbRes.ok) throw new Error("Workbook generation failed");
      const wb = (await wbRes.json()) as Workbook;
      setWorkbook(wb);
      setSteps((s) => setStep(s, "workbook", "done", `Primary: "${wb.primaryKeyword}"`));

      /* Step 2 — 30-day cluster (pre-registers all 30 slugs atomically) */
      setSteps((s) => setStep(s, "cluster", "running"));
      const clRes = await fetch("/api/cluster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche: form.niche,
          topic: form.topic,
          region: form.region,
          contentType: form.contentType,
          workbook: wb,
        }),
      });
      if (!clRes.ok) {
        const j = await clRes.json().catch(() => ({}));
        throw new Error(j.error ?? "Cluster generation failed");
      }
      const plan = (await clRes.json()) as ClusterPlan;
      setCluster(plan);

      /* Subscribe to live cluster updates so generate-day progress streams in */
      onSnapshot(doc(db, "clusters", plan.id), (snap) => {
        if (snap.exists()) setCluster(snap.data() as ClusterPlan);
      });

      setSteps((s) => setStep(s, "cluster", "done", `${plan.days.length} days pre-registered`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Plan generation failed");
      setSteps((s) => s.map((step) => (step.status === "running" ? { ...step, status: "error" } : step)));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
          <Building2 size={18} />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Cluster Engine</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Generate a 30-day NLP-driven content plan. Permalinks are pre-registered so internal links go live from Day 1.
          </p>
        </div>
      </div>

      {!workbook && (
        <div className="bg-card border border-border rounded-xl p-6">
          <TopicForm
            onSubmit={runPlan}
            loading={running}
            onBrainstorm={brainstorm}
            brainstormLoading={brainstormLoading}
            suggestions={suggestions}
          />
        </div>
      )}

      {(running || steps.some((s) => s.status !== "pending")) && (
        <div className="bg-card border border-border rounded-xl p-6">
          <ProgressTracker steps={steps} />
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {workbook && <WorkbookDisplay workbook={workbook} />}

      {cluster && <ClusterTable cluster={cluster} onUpdate={setCluster} />}
    </div>
  );
}
