"use client";

import { useState } from "react";
import { XCircle } from "lucide-react";

interface Props {
  token: string;
}

type State = "idle" | "confirming" | "loading" | "done" | "error";

export default function DeclineQuoteButton({ token }: Props) {
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleDecline() {
    setState("loading");
    setErrorMsg("");
    try {
      const res = await fetch(`/api/portal/${token}/decline`, { method: "POST" });
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
        <div className="flex items-center gap-2 text-red-700 font-semibold text-lg">
          <XCircle className="w-6 h-6" />
          Quote Declined
        </div>
        <p className="text-gray-500 text-sm">
          If you change your mind, please give us a call.
        </p>
      </div>
    );
  }

  if (state === "confirming") {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-gray-700 font-medium text-base">
          Are you sure you want to decline this quote?
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleDecline}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors border-2 border-red-500 text-red-600 hover:bg-red-50"
          >
            <XCircle className="w-4 h-4" />
            Yes, Decline
          </button>
          <button
            onClick={() => setState("idle")}
            className="px-6 py-3 rounded-lg border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
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
        className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg font-semibold text-base transition-colors border-2 border-red-500 text-red-600 hover:bg-red-50 disabled:opacity-60"
      >
        <XCircle className="w-5 h-5" />
        {state === "loading" ? "Declining\u2026" : "Decline Quote"}
      </button>
      {state === "error" && (
        <p className="text-red-600 text-sm">
          {errorMsg || "Something went wrong."} Please call{" "}
          <a href="tel:+14357096999" className="font-semibold underline">(435) 709-6999</a>.
        </p>
      )}
    </div>
  );
}
