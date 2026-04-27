import { adminDb } from "@/lib/firebase/admin";
import { Shield, Users, FileText, TrendingUp, Globe } from "lucide-react";
import Link from "next/link";

async function getStats() {
  try {
    const usersSnap = await adminDb.collection("users").get();
    const blogsSnap = await adminDb.collection("blogs").get();

    let freePlan = 0, proPlan = 0, businessPlan = 0;
    let totalBlogsUsed = 0;

    usersSnap.forEach((doc) => {
      const d = doc.data();
      if (d.plan === "pro") proPlan++;
      else if (d.plan === "business") businessPlan++;
      else freePlan++;
      totalBlogsUsed += d.blogsUsed ?? 0;
    });

    return {
      totalUsers: usersSnap.size,
      totalBlogs: blogsSnap.size,
      freePlan,
      proPlan,
      businessPlan,
      totalBlogsUsed,
    };
  } catch {
    return {
      totalUsers: 0, totalBlogs: 0,
      freePlan: 0, proPlan: 0, businessPlan: 0, totalBlogsUsed: 0,
    };
  }
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      detail: `Free: ${stats.freePlan} · Pro: ${stats.proPlan} · Business: ${stats.businessPlan}`,
    },
    {
      label: "Total Blogs Generated",
      value: stats.totalBlogs,
      icon: FileText,
      detail: `${stats.totalBlogsUsed} across all users`,
    },
    {
      label: "Revenue (estimated)",
      value: `$${stats.proPlan * 19 + stats.businessPlan * 39}`,
      icon: TrendingUp,
      detail: `${stats.proPlan} Pro + ${stats.businessPlan} Business`,
    },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Shield size={18} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Admin Panel
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage users, plans, and usage
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon, detail }) => (
          <div
            key={label}
            className="bg-card border border-border rounded-xl p-5 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{label}</span>
              <Icon size={15} className="text-muted-foreground" />
            </div>
            <p className="text-2xl font-display font-bold text-foreground">
              {value}
            </p>
            <p className="text-xs text-muted-foreground">{detail}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/users"
          className="bg-card border border-border rounded-xl p-5 hover:bg-muted/50 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Users size={16} className="text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">User Management</p>
              <p className="text-xs text-muted-foreground">View all users, upgrade plans</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/usage"
          className="bg-card border border-border rounded-xl p-5 hover:bg-muted/50 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
              <TrendingUp size={16} className="text-accent" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Usage Monitor</p>
              <p className="text-xs text-muted-foreground">API usage, per-user stats</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/sites"
          className="bg-card border border-border rounded-xl p-5 hover:bg-muted/50 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Globe size={16} className="text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Connected Sites</p>
              <p className="text-xs text-muted-foreground">
                Publish to surahbaqarah.com, buildwithesha, any WP site
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/articles"
          className="bg-card border border-border rounded-xl p-5 hover:bg-muted/50 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
              <FileText size={16} className="text-accent" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Articles</p>
              <p className="text-xs text-muted-foreground">
                Write + publish company blogs — no quota for admins
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
