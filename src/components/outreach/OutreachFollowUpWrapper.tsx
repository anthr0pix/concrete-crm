"use client";

import { useRouter } from "next/navigation";
import OutreachFollowUp from "./OutreachFollowUp";

interface Props {
  managerId: string;
  nextFollowUpAt: string | null;
  lastContactedAt: string | null;
}

export default function OutreachFollowUpWrapper({
  managerId,
  nextFollowUpAt,
  lastContactedAt,
}: Props) {
  const router = useRouter();

  if (!nextFollowUpAt) return null;

  return (
    <OutreachFollowUp
      managerId={managerId}
      nextFollowUpAt={nextFollowUpAt}
      lastContactedAt={lastContactedAt}
      onUpdate={() => router.refresh()}
    />
  );
}
