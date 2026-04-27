"use client";

import { useState } from "react";
import { Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import type { ContentType } from "@/types";
import { CONTENT_TYPE_LABELS } from "@/types";

interface TopicFormProps {
  onSubmit: (data: {
    niche: string;
    topic: string;
    region: string;
    contentType: ContentType;
  }) => void;
  loading: boolean;
  onBrainstorm: (niche: string, region: string) => void;
  brainstormLoading: boolean;
  suggestions: string[];
}

export function TopicForm({
  onSubmit,
  loading,
  onBrainstorm,
  brainstormLoading,
  suggestions,
}: TopicFormProps) {
  const [niche, setNiche] = useState("");
  const [topic, setTopic] = useState("");
  const [region, setRegion] = useState("");
  const [contentType, setContentType] = useState<ContentType>("informational");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!niche || !topic || !region) return;
    onSubmit({ niche, topic, region, contentType });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="niche">Niche</Label>
          <Input
            id="niche"
            placeholder="e.g. plumbing, digital marketing"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="region">Region / Location</Label>
          <Input
            id="region"
            placeholder="e.g. London, New York, UK"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="topic">Blog Topic</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 text-xs gap-1.5 text-primary"
            onClick={() => onBrainstorm(niche, region)}
            loading={brainstormLoading}
            disabled={!niche || !region}
          >
            <Wand2 size={11} />
            Brainstorm ideas
          </Button>
        </div>
        <Input
          id="topic"
          placeholder="e.g. how to fix a leaking pipe in London"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          required
        />
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setTopic(s)}
                className="text-xs px-2.5 py-1 rounded-full border border-border bg-muted/50 hover:bg-primary/10 hover:border-primary/40 hover:text-primary transition-colors text-left"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Content Type</Label>
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(CONTENT_TYPE_LABELS) as ContentType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setContentType(type)}
              className={`text-sm px-4 py-2 rounded-lg border transition-colors ${
                contentType === type
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              }`}
            >
              {CONTENT_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {contentType === "informational" && "Educational content — how-to guides, tips, tutorials."}
          {contentType === "commercial" && "Comparison content — reviews, best-of lists, pros/cons."}
          {contentType === "transactional" && "Conversion content — pricing, hire/buy, trust signals."}
        </p>
      </div>

      <Button
        type="submit"
        variant="gradient"
        size="lg"
        loading={loading}
        disabled={!niche || !topic || !region}
        className="w-full gap-2"
      >
        <Sparkles size={16} />
        Generate Blog
      </Button>
    </form>
  );
}
