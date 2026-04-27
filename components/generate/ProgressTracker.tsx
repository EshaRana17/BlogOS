"use client";

import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import type { PipelineStep } from "@/types";

interface Props {
  steps: PipelineStep[];
}

export function ProgressTracker({ steps }: Props) {
  return (
    <div className="space-y-2">
      {steps.map((step) => (
        <div key={step.id} className="flex items-start gap-3 py-1.5">
          <div className="mt-0.5 shrink-0">
            {step.status === "done" && (
              <CheckCircle2 size={16} className="text-green-500" />
            )}
            {step.status === "running" && (
              <Loader2 size={16} className="text-primary animate-spin" />
            )}
            {step.status === "error" && (
              <XCircle size={16} className="text-destructive" />
            )}
            {step.status === "pending" && (
              <Circle size={16} className="text-muted-foreground/40" />
            )}
          </div>
          <div className="min-w-0">
            <p
              className={`text-sm font-medium leading-tight ${
                step.status === "pending"
                  ? "text-muted-foreground/50"
                  : step.status === "error"
                  ? "text-destructive"
                  : "text-foreground"
              }`}
            >
              {step.label}
            </p>
            {step.detail && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{step.detail}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
