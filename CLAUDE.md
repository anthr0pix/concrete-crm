# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Mountain West Surface CRM — a full-featured business management platform for a concrete/surface sealing company. Features: customer management, job tracking, quoting with PDF generation, invoicing with PDF generation, email delivery, customer-facing portal (magic links), lead capture from the public website, scheduling, and before/after photo documentation.

**Live URL:** https://app.mountainwestsurface.com
**Vercel project:** `anthr0pixs-projects/concrete-crm`

---

## Commands

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build (runs prisma generate first)
npm run lint         # ESLint
npx prisma studio    # Open DB browser UI
npx prisma migrate dev --name <name>   # Create and apply a migration
npx prisma generate  # Regenerate Prisma client after schema changes

vercel deploy --prod          # Deploy to production
vercel env ls                 # List all Vercel env vars
echo "val" | vercel env add VAR_NAME production   # Add/update Vercel env var

# npm cache has root-owned files — use alternate cache for installs
npm install <pkg> --cache /tmp/npm-cache
```

---

## Architecture

**Stack:** Next.js 16 (App Router) · TypeScript · Supabase (Postgres + Auth + Storage) · Prisma 7 ORM · shadcn/ui · Tailwind CSS 4

### Key conventions

- **Server Components by default.** Only add `"use client"` when you need interactivity, browser APIs, or hooks.
- **API routes** live in `src/app/api/`. Use them for mutations (POST/PATCH/DELETE). Reads can be done directly in Server Components via Prisma.
- **Auth** is handled by Supabase. Use `src/lib/supabase/server.ts` in Server Components/API routes and `src/lib/supabase/client.ts` in Client Components.
- **Prisma client** is a singleton exported from `src/lib/prisma.ts`. Never instantiate `PrismaClient` elsewhere. Prisma 7 uses `@prisma/adapter-pg` — the adapter is wired in `prisma.ts`, connection URL comes from `DATABASE_URL` env var.
- **Types** are re-exported from `src/types/index.ts`. Prisma-generated types are the source of truth — do not duplicate them.
- **Forms** use `react-hook-form@7` + `@hookform/resolvers@3` + `zod@3`. Keep these pinned together — v5 resolvers require react-hook-form v8 which breaks things.
- **Public routes** (no auth required): `/login`, `/api/auth/*`, `/api/public/*`, `/portal/*` — configured in `src/middleware.ts`.
- **Portal routes** (`/portal/*`) are excluded from the AppShell sidebar layout — configured in `src/components/layout/AppShell.tsx`.

### Folder structure

```
src/
  app/
    dashboard/          # KPI dashboard
    customers/          # Customer list + detail + edit
    jobs/               # Job list + detail + photo upload
    quotes/             # Quote builder + detail (PDF download, Send button)
    invoices/           # Invoice list + detail (PDF download, Send button)
    schedule/           # Calendar view
    login/              # Auth page
    portal/[token]/     # PUBLIC customer portal (magic link, no login)
    api/
      auth/             # Login/logout handlers
      customers/        # Customer CRUD
      jobs/             # Job CRUD + photo upload
      quotes/[id]/
        pdf/            # GET → generate + return PDF
        send/           # POST → PDF + email via Resend → status SENT
      invoices/[id]/
        pdf/            # GET → generate + return PDF
        send/           # POST → PDF + email via Resend → status SENT
      portal/[token]/
        approve/        # POST → customer approves quote → status ACCEPTED
      public/
        leads/          # POST, no auth, CORS — website lead capture
  components/
    layout/             # Sidebar (MWS branded), AppShell, nav
    ui/                 # shadcn/ui primitives (do not edit)
    pdf/                # QuotePDF.tsx, InvoicePDF.tsx (@react-pdf/renderer)
    emails/             # QuoteEmail.tsx, InvoiceEmail.tsx (@react-email/components)
    customers/          # Customer-specific components
    jobs/               # Job-specific components
    quotes/             # QuoteStatusSelect, ConvertToInvoiceButton, SendQuoteButton
    invoices/           # InvoiceStatusSelect, MarkPaidButton, SendInvoiceButton
    schedule/           # Calendar components
  lib/
    prisma.ts           # Prisma singleton
    email.ts            # Resend client singleton
    portal-token.ts     # jose JWT sign/verify for customer portal magic links
    supabase/
      client.ts         # Browser Supabase client
      server.ts         # Server Supabase client
  types/
    index.ts            # Re-exports Prisma types + status label maps
```

### Brand / Design

- **Primary color (red):** `#e94560`
- **Navy (sidebar/header):** `#1a1a2e`
- **Deep blue:** `#0f3460`
- **Fonts:** Montserrat (headings, `--font-heading`) + Inter (body, `--font-sans`) via Google Fonts
- **Logo:** `public/logo-white.png` (white version for dark backgrounds)
- CSS variables defined in `src/app/globals.css`, shadcn theme tokens mapped to MWS brand

### Data model relationships

```
Customer → Jobs → JobPhotos (before/after, stored in Supabase Storage)
Customer → Quotes → QuoteLineItems
Customer → Invoices → InvoiceLineItems
Job → Quote (optional link)
Job → Invoice (optional link)
Quote → Invoice (optional link, when converting quote to invoice)
```

### PDF generation

- Uses `@react-pdf/renderer` — components in `src/components/pdf/`
- `renderToBuffer()` requires a type cast: `React.createElement(MyPDF, props) as any`
- Return as `new Uint8Array(buffer)` in NextResponse (Buffer not directly assignable to BodyInit)
- Always wrap in try/catch — PDF rendering can fail and needs a proper 500 response

### Email sending

- Uses `resend` + `@react-email/components`
- Resend singleton in `src/lib/email.ts` — call `getResend()`, never instantiate directly
- `render()` IS exported from `@react-email/components` (confirmed)
- Check Resend's returned `{ error }` field — it doesn't throw on delivery failure
- `FROM_EMAIL` env var controls sender address; falls back to `quotes@` or `invoices@mountainwestsurface.com`
- Domain `mountainwestsurface.com` is verified in Resend with DKIM/SPF/DMARC records

### Customer portal (magic links)

- JWT signed with `PORTAL_JWT_SECRET` via `jose` library
- Token payload: `{ type: 'quote'|'invoice', id: string }`, expires 30 days
- Helpers in `src/lib/portal-token.ts`: `signPortalToken()`, `verifyPortalToken()`
- Portal page at `/portal/[token]` is fully public, shows read-only quote or invoice
- Quote approval: `POST /api/portal/[token]/approve` — sets quote status to ACCEPTED
- Portal token is generated fresh each time a quote/invoice is sent — include it in email

### Public lead capture API

- `POST /api/public/leads` — no auth required, CORS allows `mountainwestsurface.com`
- Rate limited: 5 requests per IP per 10 minutes (in-memory, resets on restart)
- Honeypot field (`bot-field`) for spam protection
- Accepts: `name, phone, email, service, sqFootage, location, message`
- Creates: Customer + Job (status: LEAD) in a single Prisma nested create
- ServiceType imported from `@prisma/client` — no `as any` casts
- Rate limiter Map is pruned every 30 minutes to prevent memory growth

### Environment variables

```bash
# Database
DATABASE_URL                    # Supabase Postgres connection string

# Supabase auth
NEXT_PUBLIC_SUPABASE_URL        # Public — safe for browser
NEXT_PUBLIC_SUPABASE_ANON_KEY   # Public — safe for browser
SUPABASE_SERVICE_ROLE_KEY       # SECRET — server only, never expose to client

# Email
RESEND_API_KEY                  # Resend API key (resend.com)
FROM_EMAIL                      # Sender address, e.g. "MWS <quotes@mountainwestsurface.com>"

# Customer portal
PORTAL_JWT_SECRET               # Strong random secret (openssl rand -base64 32)

# App
NEXT_PUBLIC_APP_URL             # https://app.mountainwestsurface.com (or http://localhost:3000 locally)
WEBSITE_ORIGIN                  # https://mountainwestsurface.com (for CORS)
```

### Supabase Storage

Use the `job-photos` bucket for before/after photos. Upload via the browser Supabase client in a Client Component, store the resulting public URL in `JobPhoto.url`.

### Quote/Invoice numbering

Generate sequential numbers server-side in API routes (e.g. `Q-0001`, `INV-0001`). Query `MAX(quoteNumber)` or use a counter table to avoid collisions.

### Send button UX pattern

Both `SendQuoteButton` and `SendInvoiceButton` use a 4-state machine:
`idle → confirming → sending → sent`

The `confirming` state shows "Send to email@example.com? Yes / Cancel" inline to prevent accidental double-sends. Once sent, the button shows a permanent `Sent` badge for the page lifetime.

---

## Website integration

The public website at `mountainwestsurface.com` is currently hosted on **Squarespace**.

A static HTML version lives at `/Users/nickguerriero/mountainwest-site/` — this has been updated with `fetch()` calls to `/api/public/leads` but is **not yet deployed or live**. The Netlify setup described in that folder's docs is outdated.

**To get lead capture working from the live site**, either:
1. Add an equivalent `<script>` block to the Squarespace contact page that POSTs to `https://app.mountainwestsurface.com/api/public/leads`, or
2. Deploy the static HTML site and point the domain to it (replacing Squarespace)
