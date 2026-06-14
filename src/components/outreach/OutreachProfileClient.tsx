"use client";

import { useRouter } from "next/navigation";
import OutreachStatusActions from "./OutreachStatusActions";

interface Props {
  managerId: string;
  initialStatus: string;
}

export default function OutreachProfileClient({
  managerId,
  initialStatus,
}: Props) {
  const router = useRouter();

  return (
    <OutreachStatusActions
      managerId={managerId}
      currentStatus={initialStatus}
      onStatusChange={() => router.refresh()}
    />
  );
}
