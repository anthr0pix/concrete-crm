"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CrewJobCard from "./CrewJobCard";

interface CrewJob {
  id: string;
  title: string;
  serviceType: string;
  status: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  crewAssignment: string | null;
  scheduledDate: string | null;
  customerId: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  _count: { photos: number };
}

interface Props {
  jobs: CrewJob[];
  crews: string[];
}

export default function CrewDayView({ jobs, crews }: Props) {
  const [crewFilter, setCrewFilter] = useState<string>("all");

  const filtered = crewFilter === "all"
    ? jobs
    : jobs.filter((j) => j.crewAssignment === crewFilter);

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-lg font-bold">{format(new Date(), "EEEE, MMMM d")}</h1>
        <p className="text-sm text-muted-foreground">
          {filtered.length} job{filtered.length !== 1 ? "s" : ""} today
        </p>
      </div>

      {/* Crew filter */}
      {crews.length > 0 && (
        <div className="mb-4">
          <Select value={crewFilter} onValueChange={setCrewFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All crews" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All crews</SelectItem>
              {crews.map((crew) => (
                <SelectItem key={crew} value={crew}>
                  {crew}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Job cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-sm">No jobs scheduled for today</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => (
            <CrewJobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
