"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pencil, MoreVertical } from "lucide-react";
import JobStatusSelect from "./JobStatusSelect";
import DeleteJobButton from "./DeleteJobButton";
import { JobStatus } from "@prisma/client";

interface JobDetailActionsProps {
  jobId: string;
  currentStatus: JobStatus;
}

export default function JobDetailActions({ jobId, currentStatus }: JobDetailActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <JobStatusSelect jobId={jobId} currentStatus={currentStatus} />
      <Link href={`/jobs/${jobId}/edit`}>
        <Button variant="outline" size="sm">
          <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
        </Button>
      </Link>
      {/* Desktop: show delete button inline */}
      <div className="hidden sm:block">
        <DeleteJobButton jobId={jobId} />
      </div>
      {/* Mobile: overflow menu with delete */}
      <div className="sm:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/jobs/${jobId}/edit`} className="w-full">
                Edit Job
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={(e) => {
                // Prevent the dropdown from closing, let DeleteJobButton handle interaction
                e.preventDefault();
              }}
            >
              <DeleteJobButton jobId={jobId} redirectTo="/jobs" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
