"use client";

type ViewType = "week" | "month" | "day";

interface ViewToggleProps {
  view: ViewType;
  onChange: (view: ViewType) => void;
}

const views: { value: ViewType; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "day", label: "Day" },
];

export default function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="bg-muted rounded-lg p-0.5 flex">
      {views.map((v) => (
        <button
          key={v.value}
          onClick={() => onChange(v.value)}
          className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
            view === v.value
              ? "bg-card shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}
