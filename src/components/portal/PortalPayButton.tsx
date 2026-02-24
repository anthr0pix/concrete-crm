"use client";

import { useState } from "react";

interface Props {
  token: string;
  type: "invoice" | "deposit";
  label: string;
  amount: number;
}

type State = "idle" | "loading" | "error";

export default function PortalPayButton({ token, type, label, amount }: Props) {
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handlePay() {
    setState("loading");
    setErrorMsg("");

    const endpoint =
      type === "invoice"
        ? `/api/portal/${token}/pay`
        : `/api/portal/${token}/deposit`;

    try {
      const res = await fetch(endpoint, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          setErrorMsg("Payment URL not available. Please try again.");
          setState("error");
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        setState("error");
      }
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
      setState("error");
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handlePay}
        disabled={state === "loading"}
        className="inline-block px-8 py-3 rounded-lg text-white font-bold text-lg transition-all hover:opacity-90 disabled:opacity-50"
        style={{ backgroundColor: "#e94560" }}
      >
        {state === "loading"
          ? "Preparing payment..."
          : `${label} — $${amount.toFixed(2)}`}
      </button>
      {state === "error" && (
        <p className="text-red-600 text-sm">
          {errorMsg} Please call{" "}
          <a href="tel:+14357096999" className="font-semibold underline">
            (435) 709-6999
          </a>{" "}
          if the issue persists.
        </p>
      )}
    </div>
  );
}
