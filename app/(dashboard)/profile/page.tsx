"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { getEffectivePlan, type Blog } from "@/types";
import { whatsAppUpgradeUrl } from "@/lib/utils";
import Link from "next/link";
import {
  User,
  CreditCard,
  Globe,
  FileText,
  Calendar,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react";

const PLAN_LABELS: Record<string, string> = {
  free: "Free — $0/mo",
  pro: "Pro — $19/mo",
  business: "Business — $39/mo",
};

export default function UserProfile() {
  const { user } = useAuth();

  const [wpUrl, setWpUrl] = useState("");
  const [wpUser, setWpUser] = useState("");
  const [wpPass, setWpPass] = useState("");
  const [wpStatus, setWpStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [wpSaving, setWpSaving] = useState(false);

  const [blogs, setBlogs] = useState<Blog[]>([]);

  useEffect(() => {
    if (user) {
      setWpUrl(user.wordpressSiteUrl ?? "");
      setWpUser(user.wordpressUsername ?? "");
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "blogs"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setBlogs(snap.docs.map((d) => d.data() as Blog));
    });
    return unsub;
  }, [user]);

  if (!user) return null;

  const effectivePlan = getEffectivePlan(user);
  const canConnectWp = effectivePlan !== "free";

  const joined = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const trialEnd =
    user.trialActive && user.trialEndsAt
      ? new Date(user.trialEndsAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : null;

  async function handleWpConnect(e: React.FormEvent) {
    e.preventDefault();
    setWpSaving(true);
    setWpStatus(null);
    try {
      const res = await fetch("/api/wordpress/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteUrl: wpUrl, username: wpUser, appPassword: wpPass }),
      });
      const data = await res.json();
      setWpStatus({ ok: res.ok, message: res.ok ? `Connected as ${data.user?.name ?? "user"}` : data.error });
      if (res.ok) setWpPass("");
    } catch (err) {
      setWpStatus({ ok: false, message: err instanceof Error ? err.message : "Connection failed" });
    } finally {
      setWpSaving(false);
    }
  }

  async function handleWpDisconnect() {
    setWpSaving(true);
    try {
      await fetch("/api/wordpress/connect", { method: "DELETE" });
      setWpStatus({ ok: true, message: "Disconnected" });
      setWpUrl("");
      setWpUser("");
      setWpPass("");
    } finally {
      setWpSaving(false);
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account and subscription</p>
      </div>

      {/* Trial banner */}
      {user.trialActive && trialEnd && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="font-semibold">30-day Pro trial active</p>
            <p className="text-xs text-muted-foreground">
              Ends on {trialEnd}. You get 12 blogs + WordPress publishing until then.
            </p>
          </div>
          <a href={whatsAppUpgradeUrl("pro", user.email)} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline">Keep Pro on WhatsApp</Button>
          </a>
        </div>
      )}

      {/* Account info */}
      <section className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <User size={15} />
          Account
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <Field label="Name" value={user.name} />
          <Field label="Email" value={user.email} />
          <Field label="Member since" value={<span className="flex items-center gap-1"><Calendar size={13} className="text-muted-foreground" />{joined}</span>} />
          <Field label="User ID" value={<span className="font-mono text-xs text-muted-foreground truncate">{user.uid}</span>} />
        </div>
      </section>

      {/* Subscription */}
      <section className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <CreditCard size={15} />
            Subscription
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold capitalize">
            {user.trialActive ? "pro (trial)" : user.plan}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <Field label="Plan" value={PLAN_LABELS[effectivePlan]} />
          <Field label="Blogs used" value={`${user.blogsUsed} / ${user.blogsLimit}`} />
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700"
            style={{ width: `${Math.min(Math.round((user.blogsUsed / user.blogsLimit) * 100), 100)}%` }}
          />
        </div>

        {effectivePlan !== "business" && (
          <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
            <p className="text-xs text-muted-foreground">Need more blogs or the Cluster Engine?</p>
            <div className="flex gap-2">
              {effectivePlan === "free" && (
                <a href={whatsAppUpgradeUrl("pro", user.email)} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline">Upgrade to Pro</Button>
                </a>
              )}
              <a href={whatsAppUpgradeUrl("business", user.email)} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="gradient">Upgrade to Business</Button>
              </a>
            </div>
          </div>
        )}
      </section>

      {/* WordPress */}
      <section className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Globe size={15} />
          WordPress Integration
          {!canConnectWp && (
            <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground ml-auto font-normal">Pro+ only</span>
          )}
        </div>

        {!canConnectWp ? (
          <p className="text-sm text-muted-foreground">
            Upgrade to Pro or Business to publish directly to your WordPress site.
          </p>
        ) : (
          <>
            {user.wordpressConnected ? (
              <div className="space-y-3">
                <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Connected to {user.wordpressSiteUrl}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleWpDisconnect} loading={wpSaving}>
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : null}
            <form onSubmit={handleWpConnect} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="wp-url">WordPress site URL</Label>
                <Input id="wp-url" type="url" placeholder="https://yoursite.com" value={wpUrl} onChange={(e) => setWpUrl(e.target.value)} required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="wp-user">Username</Label>
                  <Input id="wp-user" value={wpUser} onChange={(e) => setWpUser(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="wp-pass">Application password</Label>
                  <Input id="wp-pass" type="password" placeholder="xxxx xxxx xxxx xxxx" value={wpPass} onChange={(e) => setWpPass(e.target.value)} required />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Create an Application Password in your WordPress dashboard: Users → Profile → Application Passwords.
              </p>
              <Button type="submit" size="sm" loading={wpSaving}>
                {user.wordpressConnected ? "Update connection" : "Connect WordPress"}
              </Button>
              {wpStatus && (
                <p className={`text-xs flex items-center gap-1.5 ${wpStatus.ok ? "text-green-600" : "text-destructive"}`}>
                  {wpStatus.ok ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                  {wpStatus.message}
                </p>
              )}
            </form>
          </>
        )}
      </section>

      {/* Blog history */}
      <section className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <FileText size={15} />
          Blog History
          <span className="text-xs text-muted-foreground ml-auto font-normal">{blogs.length}</span>
        </div>

        {blogs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Your generated blogs will appear here once you start writing.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {blogs.slice(0, 20).map((b) => (
              <li key={b.id} className="py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/blog/${b.id}`} className="text-sm font-medium text-foreground hover:text-primary truncate block">
                    {b.seoTitle || b.topic}
                  </Link>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {b.wordCount?.toLocaleString() ?? 0} words · {b.aiScore ?? 0} score · /{b.permalink}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium capitalize ${b.status === "published" ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}>
                    {b.status}
                  </span>
                  {b.wordpressPostUrl && (
                    <a href={b.wordpressPostUrl} target="_blank" rel="noopener noreferrer" className="text-primary">
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  );
}
