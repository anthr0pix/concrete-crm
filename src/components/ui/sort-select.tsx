"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface SortOption {
  value: string;
  label: string;
}

interface SortSelectProps {
  options: SortOption[];
  basePath: string;
}

export default function SortSelect({ options, basePath }: SortSelectProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") || options[0]?.value || "";

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", e.target.value);
    params.delete("page"); // reset to page 1 on sort change
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  return (
    <select
      value={currentSort}
      onChange={handleChange}
      className="border rounded-md px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
