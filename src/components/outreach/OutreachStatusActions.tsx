"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OUTREACH_STATUS_LABELS, STATUS_COLORS } from "@/types";

interface Props {
  managerId: string;
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
}

export default function OutreachStatusActions({
  managerId,
  currentStatus,
  onStatusChange,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    const prev = status;
    setStatus(newStatus);

    try {
      const res = await fetch(`/api/outreach/${managerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success("Status updated");
      onStatusChange(newStatus);
    } catch {
      setStatus(prev);
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/outreach/${managerId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("Prospect deleted");
      router.push("/outreach");
      router.refresh();
    } catch {
      toast.error("Failed to delete");
      setConfirmDelete(false);
    }
  };

  return (
    <div className="flex items-center gap-2 shrink-0">
      <Select value={status} onValueChange={handleStatusChange}>
        <SelectTrigger className="w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(OUTREACH_STATUS_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              <span
                className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                  STATUS_COLORS[key] || ""
                }`}
              >
                {label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Link href={`/outreach/${managerId}/edit`}>
        <Button variant="outline" size="sm">
          <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
        </Button>
      </Link>

      {confirmDelete ? (
        <div className="flex items-center gap-1">
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            Confirm
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmDelete(false)}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
        </Button>
      )}
    </div>
  );
}
