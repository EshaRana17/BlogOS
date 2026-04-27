"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { BlogOSUser } from "@/types";
import { RefreshCw, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function AdminUsage() {
  const [users, setUsers] = useState<BlogOSUser[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchUsers() {
    setLoading(true);
    try {
      const q = query(
        collection(db, "users"),
        orderBy("blogsUsed", "desc")
      );
      const snap = await getDocs(q);
      setUsers(snap.docs.map((d) => d.data() as BlogOSUser));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchUsers(); }, []);

  const totalBlogsUsed = users.reduce((a, u) => a + u.blogsUsed, 0);
  const heavyUsers = users.filter((u) => u.blogsUsed / u.blogsLimit >= 0.8);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">
            Usage Monitor
          </h1>
          <p className="text-sm text-muted-foreground">
            Track API consumption and blog generation across all users
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchUsers}
          loading={loading}
          className="gap-2"
        >
          <RefreshCw size={13} />
          Refresh
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Blogs Generated", value: totalBlogsUsed, sub: "across all users" },
          { label: "Heavy Users (80%+)", value: heavyUsers.length, sub: "near their limit" },
          { label: "Avg Usage", value: users.length > 0 ? Math.round(totalBlogsUsed / users.length) : 0, sub: "blogs per user" },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{label}</span>
              <TrendingUp size={14} className="text-muted-foreground" />
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Per-user usage table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-border">
          <p className="text-sm font-semibold text-foreground">
            Per-User Usage (sorted by usage)
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["User", "Plan", "Blogs Used", "Limit", "% Used", "WordPress"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-2.5 text-xs text-muted-foreground font-semibold uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const pct = Math.round((u.blogsUsed / u.blogsLimit) * 100);
                  return (
                    <tr
                      key={u.uid}
                      className="border-b border-border last:border-0 hover:bg-muted/20"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-foreground">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">
                        {u.plan}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {u.blogsUsed}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {u.blogsLimit}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                pct >= 90
                                  ? "bg-destructive"
                                  : pct >= 70
                                  ? "bg-amber-500"
                                  : "bg-primary"
                              }`}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <span
                            className={`text-xs font-medium ${
                              pct >= 90 ? "text-destructive" : "text-muted-foreground"
                            }`}
                          >
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            u.wordpressConnected
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {u.wordpressConnected ? "Connected" : "Not connected"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
