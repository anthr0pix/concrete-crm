# Mountain West Surface — CRM

Business management platform for Mountain West Surface LLC.

**Live:** https://app.mountainwestsurface.com

---

## Features

- **Customers** — contact management, notes, referral tracking
- **Jobs** — status tracking, before/after photo upload, service types
- **Quotes** — line item builder, PDF generation, email delivery, customer approval portal
- **Invoices** — PDF generation, email delivery, mark paid
- **Schedule** — calendar view of upcoming jobs
- **Customer Portal** — magic link pages for customers to view/approve quotes and view invoices (no login required)
- **Website Lead Capture** — public API endpoint receives form submissions from mountainwestsurface.com

## Stack

Next.js 16 · TypeScript · Supabase (Postgres + Auth + Storage) · Prisma 7 · shadcn/ui · Tailwind CSS 4 · Resend (email) · @react-pdf/renderer · jose (JWT)

## Development

```bash
npm install --cache /tmp/npm-cache
npm run dev
```

Open http://localhost:3000.

## Environment variables

Copy `.env` and fill in values. See `CLAUDE.md` for full variable reference.

## Deployment

```bash
vercel deploy --prod
```

Deployed to Vercel, aliased to `app.mountainwestsurface.com`.

## Documentation

See `CLAUDE.md` for full architecture, conventions, and implementation details.
