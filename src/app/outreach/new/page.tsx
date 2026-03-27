import OutreachForm from "@/components/outreach/OutreachForm";

export default function NewOutreachPage() {
  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6 bg-muted/40 rounded-xl px-5 py-4 -mx-1">
        <h1 className="text-2xl font-bold">Add Prospect</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Add a new property management company to your outreach pipeline.
        </p>
      </div>
      <OutreachForm />
    </div>
  );
}
