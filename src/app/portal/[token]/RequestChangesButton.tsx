"use client";

import { useState } from "react";
import { MessageSquare, CheckCircle } from "lucide-react";

interface Props {
  token: string;
}

type State = "idle" | "confirming" | "loading" | "done" | "error";

export default function RequestChangesButton({ token }: Props) {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit() {
    if (!message.trim()) return;
    setState("loading");
    setErrorMsg("");
    try {
      const res = await fetch(`/api/portal/${token}/request-changes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() }),
      });
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
        <div className="flex items-center gap-2 text-amber-700 font-semibold text-lg">
          <CheckCircle className="w-6 h-6" />
          Request Sent
        </div>
        <p className="text-gray-500 text-sm">
          We&apos;ll review your feedback and get back to you shortly.
        </p>
      </div>
    );
  }

  if (state === "confirming" || state === "loading" || state === "error") {
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto">
        <p className="text-gray-700 font-medium text-base">
          What changes would you like?
        </p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe the changes you'd like to this quote..."
          rows={4}
          maxLength={2000}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
        />
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={state === "loading" || !message.trim()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60"
          >
            <MessageSquare className="w-4 h-4" />
            {state === "loading" ? "Sending\u2026" : "Send Request"}
          </button>
          <button
            onClick={() => { setState("idle"); setMessage(""); setErrorMsg(""); }}
            disabled={state === "loading"}
            className="px-6 py-3 rounded-lg border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
        {state === "error" && (
          <p className="text-red-600 text-sm">
            {errorMsg || "Something went wrong."} Please call{" "}
            <a href="tel:+14357096999" className="font-semibold underline">(435) 709-6999</a>.
          </p>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => setState("confirming")}
      className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg font-semibold text-base transition-colors border-2 border-amber-500 text-amber-600 hover:bg-amber-50"
    >
      <MessageSquare className="w-5 h-5" />
      Request Changes
    </button>
  );
}
