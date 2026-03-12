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
      <h1 className="text-2xl font-bold mb-1">Settings</h1>
      <p className="text-sm text-muted-foreground mb-6">Configure automated emails that go out to your customers.</p>
      <SettingsForm defaults={defaults} />
    </div>
  );
}
