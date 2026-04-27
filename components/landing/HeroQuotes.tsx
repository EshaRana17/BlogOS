"use client";

import { useEffect, useState } from "react";

const QUOTES = [
  "Be the answer the algorithms crave.",
  "Be the answer Google and ChatGPT is looking for.",
];

export default function HeroQuotes() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % QUOTES.length), 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <h1
      key={index}
      className="text-4xl sm:text-5xl md:text-6xl font-display font-bold tracking-tight text-foreground animate-fade-up"
    >
      {QUOTES[index]}
    </h1>
  );
}
