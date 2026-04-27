"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Globe, Trash2, CheckCircle2, AlertCircle, Plus, ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { AdminSite, AdminSiteKind } from "@/types";

/* Pre-filled suggestions so the admin can one-click scaffold their two sites. */
const PRESETS: Array<{ label: string; kind: AdminSiteKind; siteUrl: string; hint: string }> = [
  {
    label: "Surah Baqarah",
    kind: "wordpress",
    siteUrl: "https://surahbaqarah.com",
    hint: "WordPress site — needs username + Application Password.",
  },
  {
    label: "Build With Esha",
    kind: "blogos-internal",
    siteUrl: "https://buildwithesha.firebaseapp.com",
    hint: "Publishes to the BlogOS internal blog, rendered at /blog/<slug>.",
  },
];

type FormState = {
  label: string;
  kind: AdminSiteKind;
  siteUrl: string;
  username: string;
  appPassword: string;
  authorName: string;
};

const EMPTY_FORM: FormState = {
  label: "",
  kind: "wordpress",
  siteUrl: "",
  username: "",
  appPassword: "",
  authorName: "",
};

export default function AdminSitesPage() {
  const [sites, setSites] = useState<AdminSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function fetchSites() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sites", { cache: "no-store" });
      const data = await res.json();
      setSites(data.sites ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchSites(); }, []);

  async function addSite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const res = await fetch("/api/admin/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to connect site");
        return;
      }
      setSuccess(`Connected "${form.label}"`);
      setForm(EMPTY_FORM);
      await fetchSites();
    } finally {
      setSaving(false);
    }
  }

  async function removeSite(id: string, label: string) {
    if (!confirm(`Disconnect "${label}"? Published posts stay live.`)) return;
    await fetch(`/api/admin/sites?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setSites((prev) => prev.filter((s) => s.id !== id));
  }

  function applyPreset(p: typeof PRESETS[number]) {
    setForm((prev) => ({ ...prev, label: p.label, kind: p.kind, siteUrl: p.siteUrl }));
    setError(null);
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm text-primary hover:gap-2 transition-all"
      >
        <ChevronLeft size={16} />
        Admin panel
      </Link>

      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Connected Sites</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Publish admin blogs to your own WordPress sites or to the BlogOS internal blog.
          Free of charge, no quota.
        </p>
      </div>

      {/* Presets */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Quick start
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PRESETS.map((p) => (
            <button
              key={p.siteUrl}
              onClick={() => applyPreset(p)}
              className="text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Globe size={14} className="text-primary" />
                <p className="font-semibold text-sm text-foreground">{p.label}</p>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                  {p.kind === "wordpress" ? "WP" : "BlogOS"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate">{p.siteUrl}</p>
              <p className="text-[11px] text-muted-foreground mt-1.5">{p.hint}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Add-site form */}
      <form onSubmit={addSite} className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Plus size={16} className="text-primary" />
          <p className="font-semibold text-sm text-foreground">Connect a site</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="label">Display name</Label>
            <Input
              id="label"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Surah Baqarah"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="kind">Site kind</Label>
            <select
              id="kind"
              value={form.kind}
              onChange={(e) => setForm({ ...form, kind: e.target.value as AdminSiteKind })}
              className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="wordpress">WordPress (REST API)</option>
              <option value="blogos-internal">BlogOS Internal (built-in blog)</option>
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="siteUrl">Site URL</Label>
            <Input
              id="siteUrl"
              value={form.siteUrl}
              onChange={(e) => setForm({ ...form, siteUrl: e.target.value })}
              placeholder="https://yoursite.com"
              required
              type="url"
            />
          </div>

          {form.kind === "wordpress" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="username">WordPress username</Label>
                <Input
                  id="username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  placeholder="admin"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="appPassword">Application password</Label>
                <Input
                  id="appPassword"
                  value={form.appPassword}
                  onChange={(e) => setForm({ ...form, appPassword: e.target.value })}
                  placeholder="xxxx xxxx xxxx xxxx"
                  required
                  type="password"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="authorName">Author name (optional override)</Label>
                <Input
                  id="authorName"
                  value={form.authorName}
                  onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                  placeholder="Esha Sabir"
                />
              </div>
            </>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs">
            <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Connecting…" : "Connect site"}
          </Button>
          <Button type="button" variant="outline" onClick={() => setForm(EMPTY_FORM)}>
            Reset
          </Button>
        </div>
      </form>

      {/* Sites list */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {sites.length} connected site{sites.length === 1 ? "" : "s"}
        </p>
        {loading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>
        ) : sites.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center border border-dashed border-border rounded-xl">
            No sites yet. Use a preset above or fill the form.
          </p>
        ) : (
          <div className="space-y-2">
            {sites.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 bg-card border border-border rounded-lg p-4"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Globe size={16} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-foreground truncate">{s.label}</p>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase">
                      {s.kind === "wordpress" ? "WP" : "BlogOS"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{s.siteUrl}</p>
                  {s.lastPublishedAt && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Last published{" "}
                      {new Date(s.lastPublishedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeSite(s.id, s.label)}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Disconnect"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
