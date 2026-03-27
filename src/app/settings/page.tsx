import { prisma } from "@/lib/prisma";
import SettingsForm from "@/components/settings/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await prisma.appSettings.findUnique({
    where: { id: "singleton" },
  });

  const defaults = {
    reviewDelayDays: settings?.reviewDelayDays ?? 1,
    reviewRequestEnabled: settings?.reviewRequestEnabled ?? true,
    googleReviewUrl: settings?.googleReviewUrl ?? "",
    resealReminderMonths: settings?.resealReminderMonths ?? 24,
    resealReminderEnabled: settings?.resealReminderEnabled ?? true,
  };

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6 bg-muted/40 rounded-xl px-5 py-4 -mx-1">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure automated emails that go out to your customers.</p>
      </div>
      <SettingsForm defaults={defaults} />
    </div>
  );
}
