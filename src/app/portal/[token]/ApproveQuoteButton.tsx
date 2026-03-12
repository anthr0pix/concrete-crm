"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";

interface Props {
  token: string;
}

type State = "idle" | "confirming" | "loading" | "done" | "error";

export default function ApproveQuoteButton({ token }: Props) {
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleApprove() {
    setState("loading");
    setErrorMsg("");
    try {
      const res = await fetch(`/api/portal/${token}/approve`, { method: "POST" });
      if (res.ok) {
        setState("done");
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error ?? "Something went wrong.");
        setState("error");
      }
    } catch {
      setErrorMsg("Network error. Please check your connection.");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 text-status-success-text font-semibold text-lg">
          <CheckCircle className="w-6 h-6" />
          Quote Approved!
        </div>
        <p className="text-muted-foreground text-sm">
          We&apos;ll be in touch soon to schedule your service.
        </p>
      </div>
    );
  }

  if (state === "confirming") {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-foreground font-medium text-base">
          Are you sure you want to approve this quote?
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleApprove}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-opacity"
          >
            <CheckCircle className="w-4 h-4" />
            Yes, Approve
          </button>
          <button
            onClick={() => setState("idle")}
            className="px-6 py-3 rounded-lg border border-border text-muted-foreground font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={() => setState("confirming")}
        disabled={state === "loading"}
        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base transition-opacity disabled:opacity-60"
      >
        <CheckCircle className="w-5 h-5" />
        {state === "loading" ? "Approving…" : "Approve This Quote"}
      </button>
      {state === "error" && (
        <p className="text-status-danger-text text-sm">
          {errorMsg || "Something went wrong."} Please call{" "}
          <a href="tel:+14357096999" className="font-semibold underline">(435) 709-6999</a>.
        </p>
      )}
    </div>
  );
}
