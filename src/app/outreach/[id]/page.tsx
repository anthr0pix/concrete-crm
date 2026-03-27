"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { format, isPast } from "date-fns";
import {
  Pencil,
  Trash2,
  Phone,
  Mail,
  Globe,
  Building2,
  MapPin,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OUTREACH_STATUS_LABELS, STATUS_COLORS } from "@/types";

interface PropertyManager {
  id: string;
  companyName: string;
  contactName: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  propertyCount: number | null;
  estimatedValue: number | null;
  status: string;
  lastContactedAt: string | null;
  nextFollowUpAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function OutreachDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [manager, setManager] = useState<PropertyManager | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fetchManager = useCallback(async () => {
    try {
      const res = await fetch(`/api/outreach/${id}`);
      if (!res.ok) {
        router.push("/outreach");
        return;
      }
      setManager(await res.json());
    } catch {
      router.push("/outreach");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchManager();
  }, [fetchManager]);

  const handleStatusChange = async (newStatus: string) => {
    if (!manager) return;
    const prev = manager.status;
    setManager({ ...manager, status: newStatus });

    try {
      const res = await fetch(`/api/outreach/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      toast.success("Status updated");
    } catch {
      setManager({ ...manager, status: prev });
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/outreach/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Prospect deleted");
      router.push("/outreach");
      router.refresh();
    } catch {
      toast.error("Failed to delete");
      setConfirmDelete(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-3xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-4 bg-muted rounded w-64" />
          <div className="h-40 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!manager) return null;

  const overdue =
    manager.nextFollowUpAt && isPast(new Date(manager.nextFollowUpAt));

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <Link
        href="/outreach"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Pipeline
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {manager.companyName}
          </h1>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              {manager.contactName}
            </span>
            {manager.phone && (
              <a
                href={`tel:${manager.phone}`}
                className="flex items-center gap-1 hover:text-foreground"
              >
                <Phone className="w-3.5 h-3.5" />
                {manager.phone}
              </a>
            )}
            {manager.email && (
              <a
                href={`mailto:${manager.email}`}
                className="flex items-center gap-1 hover:text-foreground"
              >
                <Mail className="w-3.5 h-3.5" />
                {manager.email}
              </a>
            )}
            {manager.website && (
              <a
                href={
                  manager.website.match(/^https?:\/\//)
                    ? manager.website
                    : `https://${manager.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-foreground"
              >
                <Globe className="w-3.5 h-3.5" />
                Website
              </a>
            )}
            {(manager.address || manager.city) && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {[manager.address, manager.city, manager.state]
                  .filter(Boolean)
                  .join(", ")}
                {manager.zip ? ` ${manager.zip}` : ""}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/outreach/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
            </Button>
          </Link>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                Confirm Delete
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
      </div>

      {/* Status + Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div className="bg-card border rounded-xl shadow-sm p-5 space-y-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Status
            </p>
            <Select value={manager.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-48">
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
          </div>

          {manager.propertyCount != null && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                Properties Managed
              </p>
              <p className="text-sm font-medium">{manager.propertyCount}</p>
            </div>
          )}

          {manager.estimatedValue != null && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                Estimated Annual Value
              </p>
              <p className="text-sm font-medium">
                $
                {manager.estimatedValue.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
                /yr
              </p>
            </div>
          )}
        </div>

        <div className="bg-card border rounded-xl shadow-sm p-5 space-y-4">
          {manager.lastContactedAt && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                Last Contacted
              </p>
              <p className="text-sm">
                {format(new Date(manager.lastContactedAt), "MMM d, yyyy")}
              </p>
            </div>
          )}

          {manager.nextFollowUpAt && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
                Next Follow-Up
              </p>
              <p
                className={`text-sm font-medium ${
                  overdue ? "text-status-danger-text" : ""
                }`}
              >
                {format(new Date(manager.nextFollowUpAt), "MMM d, yyyy")}
                {overdue && " (Overdue)"}
              </p>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
              Added
            </p>
            <p className="text-sm">
              {format(new Date(manager.createdAt), "MMM d, yyyy")}
            </p>
          </div>
        </div>
      </div>

      {/* Notes */}
      {manager.notes && (
        <div className="bg-card border rounded-xl shadow-sm p-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Notes
          </p>
          <p className="text-sm whitespace-pre-wrap">{manager.notes}</p>
        </div>
      )}
    </div>
  );
}
