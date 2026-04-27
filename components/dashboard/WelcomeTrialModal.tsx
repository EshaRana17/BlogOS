"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, X, CheckCircle2 } from "lucide-react";

interface Props {
  userName?: string;
  trialEndsAt?: string;
}

function Confetti({ count = 60 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.4,
        duration: 2.2 + Math.random() * 1.8,
        color: [
          "#2563EB",
          "#06B6D4",
          "#A855F7",
          "#EC4899",
          "#F59E0B",
          "#10B981",
        ][Math.floor(Math.random() * 6)],
        size: 6 + Math.random() * 6,
        rotate: Math.random() * 360,
      })),
    [count]
  );

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ y: -20, x: 0, opacity: 0, rotate: p.rotate }}
          animate={{ y: "110%", opacity: [0, 1, 1, 0], rotate: p.rotate + 540 }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.4,
            backgroundColor: p.color,
            position: "absolute",
            top: 0,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}

export default function WelcomeTrialModal({ userName, trialEndsAt }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (params.get("welcome") === "1") {
      setOpen(true);
    }
  }, [params]);

  function close() {
    setOpen(false);
    const newParams = new URLSearchParams(Array.from(params.entries()));
    newParams.delete("welcome");
    const qs = newParams.toString();
    router.replace(qs ? `/dashboard?${qs}` : "/dashboard");
  }

  const endsLabel = trialEndsAt
    ? new Date(trialEndsAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const firstName = userName?.split(" ")[0] ?? "there";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={close}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.85, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            <Confetti />

            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <X size={16} />
            </button>

            <div className="relative p-8 space-y-5">
              <motion.div
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 240 }}
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/40"
              >
                <Sparkles size={28} className="text-white" />
              </motion.div>

              <div className="text-center space-y-2">
                <h2
                  id="welcome-title"
                  className="text-2xl font-display font-bold text-foreground"
                >
                  Congratulations, {firstName}!
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your BlogOS account is ready — and you just unlocked{" "}
                  <span className="font-semibold text-foreground">
                    Pro free for your first month
                  </span>
                  .
                </p>
              </div>

              <ul className="space-y-2 rounded-xl border border-border bg-background/60 p-4 text-sm">
                {[
                  "12 high-quality SEO blog posts per month",
                  "WordPress auto-publish integration",
                  "AI-generated featured images",
                  "E-E-A-T audit and SEO score for every blog",
                ].map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-foreground">
                    <CheckCircle2
                      size={15}
                      className="mt-0.5 shrink-0 text-green-500"
                    />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              {endsLabel && (
                <p className="text-center text-xs text-muted-foreground">
                  Your Pro trial runs until{" "}
                  <span className="font-semibold text-foreground">{endsLabel}</span>
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <Link
                  href="/generate"
                  onClick={close}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 hover:opacity-90 transition-opacity"
                >
                  <Sparkles size={14} />
                  Write my first blog
                </Link>
                <button
                  type="button"
                  onClick={close}
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Explore dashboard
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
