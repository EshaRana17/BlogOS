"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";

const STARS = [
  { left: "58%", top: "22%", size: 2.5 },
  { left: "71%", top: "58%", size: 1.8 },
  { left: "63%", top: "76%", size: 1.4 },
];

export function IconThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />;
  const isDark = resolvedTheme === "dark";
  return (
    <motion.button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      whileTap={{ scale: 0.9 }}
      className="w-9 h-9 rounded-full flex items-center justify-center border border-border bg-background hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <AnimatePresence mode="wait">
        {isDark ? (
          <motion.div key="moon" initial={{ opacity: 0, rotate: -20 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 20 }} transition={{ duration: 0.18 }}>
            <Moon size={15} className="text-blue-300" strokeWidth={1.5} />
          </motion.div>
        ) : (
          <motion.div key="sun" initial={{ opacity: 0, rotate: 20 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -20 }} transition={{ duration: 0.18 }}>
            <Sun size={15} className="text-amber-500" strokeWidth={1.5} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* Render a static placeholder until hydrated to avoid layout shift */
  if (!mounted) {
    return (
      <div
        aria-hidden
        className="w-[84px] h-11 rounded-full bg-muted animate-pulse"
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <motion.button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="relative w-[84px] h-11 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      whileTap={{ scale: 0.93 }}
    >
      {/* ── Track ─────────────────────────────────────────── */}
      <motion.div
        className="absolute inset-0 rounded-full border-2"
        animate={{
          backgroundColor: isDark ? "#0f172a" : "#fef3c7",
          borderColor: isDark ? "#1e293b" : "#fbbf24",
        }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
      >
        {/* Ambient glow behind the sun */}
        <AnimatePresence>
          {!isDark && (
            <motion.div
              className="absolute inset-0 rounded-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                background:
                  "radial-gradient(ellipse at 72% 50%, rgba(251, 191, 36, 0.35) 0%, transparent 65%)",
              }}
            />
          )}
        </AnimatePresence>

        {/* Stars that appear in dark mode */}
        <AnimatePresence>
          {isDark &&
            STARS.map((star, i) => (
              <motion.span
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  left: star.left,
                  top: star.top,
                  width: star.size,
                  height: star.size,
                  transform: "translate(-50%, -50%)",
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 0.85, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ delay: i * 0.07, duration: 0.2, ease: "easeOut" }}
              />
            ))}
        </AnimatePresence>
      </motion.div>

      {/* ── Sliding knob ──────────────────────────────────── */}
      <motion.div
        className="absolute top-[4px] w-[34px] h-[34px] rounded-full flex items-center justify-center shadow-lg z-10"
        animate={{
          x: isDark ? 3 : 43,
          backgroundColor: isDark ? "#1e3a5f" : "#fffbeb",
          boxShadow: isDark
            ? "0 2px 8px rgba(0,0,0,0.5)"
            : "0 2px 8px rgba(251, 191, 36, 0.4)",
        }}
        transition={{ type: "spring", stiffness: 600, damping: 40 }}
      >
        {/* ── Icon inside knob ────────────────────────────── */}
        <AnimatePresence mode="wait">
          {isDark ? (
            <motion.div
              key="moon"
              initial={{ opacity: 0, rotate: -30, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 30, scale: 0.5 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <Moon size={17} className="text-blue-200" strokeWidth={1.5} />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ opacity: 0, scale: 0.5, rotate: 30 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.5, rotate: -30 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              {/* Sun continuously rotates */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
              >
                <Sun size={17} className="text-amber-500" strokeWidth={1.5} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.button>
  );
}
