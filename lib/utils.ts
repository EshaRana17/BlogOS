import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ─── Slugify ──────────────────────────────────────────── */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/* ─── WhatsApp upgrade link (manual payment override) ── */
export const WHATSAPP_NUMBER = "923290503919";

export function whatsAppUpgradeUrl(plan: "pro" | "business", email?: string) {
  const planLabel = plan === "pro" ? "Pro ($19/mo)" : "Business ($39/mo)";
  const message = `Hi Esha, I want to upgrade my BlogOS account to ${planLabel}.${email ? ` My email: ${email}.` : ""} Please share bank / EasyPaisa details for the transfer.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function whatsAppGeneralUrl(message = "Hi Esha, I saw your website and want to discuss a project.") {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
