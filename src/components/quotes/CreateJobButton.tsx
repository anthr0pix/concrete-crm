"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Hammer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SERVICE_TYPE_LABELS } from "@/types";

interface Props {
  quoteId: string;
  quoteNumber: string;
  linkedJobId: string | null;
}

export default function CreateJobButton({ quoteId, quoteNumber, linkedJobId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serviceType, setServiceType] = useState<string>("CONCRETE_SEALING");
  const [title, setTitle] = useState<string>(`Job for ${quoteNumber}`);

  if (linkedJobId) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {/* span so a disabled button still fires tooltip events */}
            <span tabIndex={0}>
              <Button size="sm" variant="outline" disabled>
                <Hammer className="w-3.5 h-3.5 mr-1" />
                Create Job
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>This quote is already linked to a job.</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const submit = async () => {
    setLoading(true);
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromQuoteId: quoteId, serviceType, title: title.trim() || undefined }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (res.status === 409 && data.existingJobId) {
        toast.error("This quote already has a linked job.");
        router.push(`/jobs/${data.existingJobId}`);
        return;
      }
      toast.error(data.error ?? "Failed to create job");
      return;
    }
    const job = await res.json();
    setOpen(false);
    toast.success(`Job created from ${quoteNumber}`);
    router.push(`/jobs/${job.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Hammer className="w-3.5 h-3.5 mr-1" />
        Create Job from Quote
      </Button>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Job from Quote {quoteNumber}</DialogTitle>
          <DialogDescription>
            This will create a new job linked to this quote and prefill the customer address.
            You can set the schedule and crew on the job page after.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="job-service-type">Service type</Label>
            <Select value={serviceType} onValueChange={setServiceType}>
              <SelectTrigger id="job-service-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="job-title">Job title</Label>
            <Input
              id="job-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Job for ${quoteNumber}`}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={loading}>
            {loading ? "Creating..." : "Create Job"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
