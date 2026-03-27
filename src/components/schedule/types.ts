export interface CalendarJob {
  id: string;
  title: string;
  serviceType: string;
  status: string;
  scheduledDate: string | null;
  createdAt: string;
  customer: { firstName: string; lastName: string; phone: string };
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
}
