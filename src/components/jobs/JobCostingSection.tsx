interface JobCostingProps {
  job: {
    laborHours?: number | null;
    laborRate?: number | null;
    materialCost?: number | null;
    crewAssignment?: string | null;
    invoices: Array<{ total: number; status: string }>;
  };
}

export default function JobCostingSection({ job }: JobCostingProps) {
  const laborCost = (job.laborHours ?? 0) * (job.laborRate ?? 0);
  const materialCost = job.materialCost ?? 0;
  const totalCost = laborCost + materialCost;
  const revenue = job.invoices
    .filter((inv) => inv.status === "PAID")
    .reduce((sum, inv) => sum + inv.total, 0);
  const profit = revenue - totalCost;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  return (
    <div className="bg-card border rounded-lg p-5">
      <h2 className="font-semibold text-lg mb-4">Cost Breakdown</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Labor</p>
          <p className="font-semibold">${laborCost.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">{job.laborHours ?? 0}h × ${job.laborRate ?? 0}/h</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Materials</p>
          <p className="font-semibold">${materialCost.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Revenue</p>
          <p className="font-semibold text-status-success-text">${revenue.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Profit</p>
          <p className={`font-semibold ${profit >= 0 ? "text-status-success-text" : "text-status-danger-text"}`}>
            ${profit.toFixed(2)}
            {revenue > 0 && <span className="text-xs ml-1">({margin.toFixed(0)}%)</span>}
          </p>
        </div>
      </div>
      {job.crewAssignment && (
        <p className="text-sm text-muted-foreground">Crew: {job.crewAssignment}</p>
      )}
    </div>
  );
}
