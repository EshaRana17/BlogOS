"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface BlogOSLogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

const sizes = {
  sm: { prefix: 22, name: 24, tagline: 7, gap: 2, taglineLeft: 3 },
  md: { prefix: 38, name: 36, tagline: 9, gap: 2, taglineLeft: 4 },
  lg: { prefix: 52, name: 50, tagline: 11, gap: 3, taglineLeft: 5 },
};

export default function BlogOSLogo({
  size = "md",
  showTagline = true,
}: BlogOSLogoProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const s = sizes[size];
  const isDark = mounted && resolvedTheme === "dark";

  const prefixColor = isDark ? "#F8FAFF" : "#07090F";
  const prefixOpacity = 0.6;
  const taglineColor = isDark
    ? "rgba(248, 250, 255, 0.3)"
    : "rgba(7, 9, 15, 0.35)";

  return (
    <div style={{ display: "inline-flex", flexDirection: "column" }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          letterSpacing: "-3px",
          lineHeight: 1,
          fontFamily: "var(--font-syne), 'Syne', sans-serif",
        }}
      >
        <span
          style={{
            fontWeight: 700,
            color: prefixColor,
            opacity: prefixOpacity,
            fontSize: s.prefix,
            transition: "color 0.3s ease",
          }}
        >
          Blog
        </span>

        <span
          style={{
            fontWeight: 800,
            fontSize: s.name,
            textTransform: "lowercase",
            marginLeft: "1px",
            background: "linear-gradient(135deg, #2563EB, #06B6D4)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 0 10px rgba(6, 182, 212, 0.2))",
          }}
        >
          OS
        </span>
      </div>

      {showTagline && (
        <div
          style={{
            fontFamily: "var(--font-syne), 'Syne', sans-serif",
            fontSize: s.tagline,
            color: taglineColor,
            textTransform: "uppercase",
            letterSpacing: "6px",
            marginTop: s.gap,
            marginLeft: s.taglineLeft,
            fontWeight: 400,
          }}
        >
          Build With Esha
        </div>
      )}
    </div>
  );
}
