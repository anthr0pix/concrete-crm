"use client";

import { useState } from "react";
import { Send, Mail, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Props {
  quoteId: string;
  customerEmail: string | null;
}

type State = "idle" | "confirming" | "sending" | "sent";

export default function SendQuoteButton({ quoteId, customerEmail }: Props) {
  const [state, setState] = useState<State>("idle");

  if (!customerEmail) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 font-medium text-slate-400 cursor-not-allowed"
        >
          <Mail className="w-3.5 h-3.5" />
          Send
        </span>
        <span className="text-xs text-amber-600">No email on file</span>
      </span>
    );
  }

  if (state === "sent") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-green-700 bg-green-50 border border-green-200">
        <CheckCircle className="w-3.5 h-3.5" />
        Sent
      </span>
    );
  }

  if (state === "confirming") {
    return (
      <span className="inline-flex flex-wrap items-center gap-1.5 text-sm">
        <span className="text-slate-600">Send to {customerEmail}?</span>
        <span className="inline-flex items-center gap-1.5">
          <button
            onClick={async () => {
              setState("sending");
              try {
                const res = await fetch(`/api/quotes/${quoteId}/send`, { method: "POST" });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error ?? "Failed to send");
                setState("sent");
                toast.success(`Quote sent to ${customerEmail}`);
              } catch (err) {
                setState("idle");
                toast.error(err instanceof Error ? err.message : "Failed to send quote");
              }
            }}
            className="px-3 py-1.5 rounded text-xs font-semibold text-white"
            style={{ backgroundColor: "#e94560" }}
          >
            Yes, Send
          </button>
          <button
            onClick={() => setState("idle")}
            className="px-3 py-1.5 rounded text-xs font-medium text-slate-500 hover:bg-slate-100"
          >
            Cancel
          </button>
        </span>
      </span>
    );
  }

  return (
    <button
      onClick={() => setState("confirming")}
      disabled={state === "sending"}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-white transition-colors disabled:opacity-60"
      style={{ backgroundColor: "#e94560" }}
      title={`Send quote to ${customerEmail}`}
    >
      <Send className="w-3.5 h-3.5" />
      {state === "sending" ? "Sending…" : "Send"}
    </button>
  );
}
