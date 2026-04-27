"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Send } from "lucide-react";
import { whatsAppGeneralUrl } from "@/lib/utils";

export default function LeadForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "sent">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    /* Redirect to WhatsApp with pre-filled message — manual funnel per Override #4 */
    const text = `Hi Esha, I'm ${name} (${email}). ${message}`;
    window.open(whatsAppGeneralUrl(text), "_blank");
    setStatus("sent");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 max-w-md">
      <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
      <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <textarea
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        placeholder="What can BlogOS help you with?"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        required
      />
      <Button type="submit" variant="gradient" loading={status === "submitting"} className="w-full gap-2">
        <Send size={13} />
        {status === "sent" ? "Sent on WhatsApp" : "Start Conversation on WhatsApp"}
      </Button>
    </form>
  );
}
