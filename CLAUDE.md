# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Mountain West Surface CRM — a full-featured business management platform for a concrete/surface sealing company. Features: customer management, job tracking (with costing and crew assignment), quoting with PDF generation and deposits, invoicing with PDF generation, Square payment processing, email delivery with automated follow-ups, customer-facing portal (magic links with payment and change requests), lead capture from the public website, scheduling, before/after photo documentation, expense tracking, sales pipeline (kanban), financial reports, and app-wide settings.

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
- **Types** are re-exported from `src/types/index.ts`. Prisma-generated types are the source of truth — do not duplicate them. Includes `DepositType`, `ExpenseCategory` enums and `EXPENSE_CATEGORY_LABELS` map.
- **Forms** use `react-hook-form@7` + `@hookform/resolvers@3` + `zod@3`. Keep these pinned together — v5 resolvers require react-hook-form v8 which breaks things.
- **Public routes** (no auth required): `/login`, `/api/auth/*`, `/api/public/*`, `/api/square/webhook`, `/api/cron/*`, `/portal/*` — configured in `src/middleware.ts`.
- **Portal routes** (`/portal/*`) are excluded from the AppShell sidebar layout — configured in `src/components/layout/AppShell.tsx`.

### Folder structure

```
src/
  app/
    dashboard/          # KPI dashboard with "Needs Attention" alerts
    customers/          # Customer list + detail + edit
    jobs/               # Job list (status tabs, filtering) + detail + photo upload
    quotes/             # Quote builder (deposits, line items) + detail
    invoices/           # Invoice list + detail (PDF, Send, Square payment)
    expenses/           # Expense tracking — list + create/edit
    pipeline/           # Sales pipeline kanban board (drag-and-drop)
    reports/            # Financial reports hub (P&L, AR aging, revenue, tax)
    schedule/           # Calendar view
    settings/           # App-wide configuration (review requests, reseal reminders)
    login/              # Auth page
    portal/[token]/     # PUBLIC customer portal (approve, decline, pay, request changes)
      payment-success/  # Post-payment success page
      payment-cancel/   # Post-payment cancellation page
    api/
      auth/             # Login/logout handlers
      customers/        # Customer CRUD
      jobs/             # Job CRUD + photo upload
        [id]/reschedule/  # PATCH — reschedule job scheduledDate
      quotes/[id]/
        pdf/            # GET → generate + return PDF
        send/           # POST → PDF + email via Resend → status SENT
        duplicate/      # POST → clone quote with new number
      invoices/[id]/
        pdf/            # GET → generate + return PDF
        send/           # POST → PDF + email via Resend → status SENT
        duplicate/      # POST → clone invoice with new number
      expenses/         # Expense CRUD
      portal/[token]/
        approve/        # POST → customer approves quote → status ACCEPTED
        pay/            # POST → create Square payment link for invoice
        deposit/        # POST → create Square deposit payment link for quote
        request-changes/  # POST → customer requests quote modifications
      square/
        checkout/       # POST → create Square payment link
        deposit/        # POST → create Square deposit payment link
        webhook/        # POST → Square webhook (HMAC verified, no auth)
      cron/
        quote-followup/   # POST → automated follow-up emails for stale SENT quotes
        reseal-reminders/ # POST → reminders for jobs with reseal due dates
        review-requests/  # POST → Google review request emails after completion
      dashboard/
        profitability/  # GET → current & previous month profit data
      reports/
        profit-loss/       # GET → P&L statement data
        ar-aging/          # GET → accounts receivable aging
        revenue-by-service/  # GET → revenue breakdown by service type
        tax-summary/       # GET → tax-related summary
        export/            # GET → export report data
      settings/         # GET/PATCH — AppSettings singleton
      public/
        leads/          # POST, no auth, CORS — website lead capture
        reviews/        # GET, no auth, CORS — hardcoded customer reviews (1hr cache)
  components/
    layout/             # Sidebar (MWS branded), AppShell, nav
    ui/                 # shadcn/ui primitives (do not edit)
    pdf/                # QuotePDF.tsx, InvoicePDF.tsx (@react-pdf/renderer)
    emails/             # Email templates (see Email section below)
    customers/          # Customer-specific components
    jobs/               # JobCostingSection, JobDetailActions, JobProgressBar,
                        #   MarkCompleteButton, PhotoUpload (w/ browser-image-compression)
    quotes/             # QuoteBuilder, QuoteStatusSelect, ConvertToInvoiceButton,
                        #   SendQuoteButton, DepositSettings, DuplicateQuoteButton
    invoices/           # InvoiceStatusSelect, MarkPaidButton, SendInvoiceButton,
                        #   DuplicateInvoiceButton, PayNowButton
    expenses/           # ExpenseForm, ExpenseTable
    pipeline/           # PipelineBoard, PipelineColumn, PipelineCard (@dnd-kit)
    reports/            # ProfitLossChart, ARAgingTable, RevenueByCategoryChart,
                        #   TaxSummaryCard, ExportButton
    settings/           # SettingsForm
    portal/             # PortalPayButton
    schedule/           # Calendar components
  lib/
    prisma.ts           # Prisma singleton
    email.ts            # Resend client singleton
    portal-token.ts     # jose JWT sign/verify for customer portal magic links
    square.ts           # Square client singleton — getSquareClient(), getLocationId()
    numbering.ts        # getNextQuoteNumber() (Q-0001), getNextInvoiceNumber() (INV-0001)
    supabase/
      client.ts         # Browser Supabase client
      server.ts         # Server Supabase client
  types/
    index.ts            # Re-exports Prisma types + status/category label maps
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
Quote → PaymentEvents (Square deposit payments)
Invoice → PaymentEvents (Square invoice payments)
Job → Expenses (optional, for job-specific costs)
AppSettings (singleton — app-wide configuration)
```

**Key model fields (beyond basic CRUD):**

- **Job**: `laborHours`, `laborRate`, `materialCost`, `crewAssignment`, `resealDueDate`, `resealReminderSentAt`, `reviewRequestSentAt`
- **Quote**: `depositAmount`, `depositType` (FIXED|PERCENTAGE), `depositPaid`, `depositPaidAt`, `squareDepositPaymentId`, `followUpCount`, `lastFollowUpAt`, `validUntil`
- **Invoice**: `squarePaymentId`, `squareOrderId`
- **Expense**: `date`, `category` (ExpenseCategory enum), `description`, `amount`, `vendor`, `receiptUrl`, `notes`, optional `jobId` link
- **PaymentEvent**: `squarePaymentId`, `squareOrderId`, `eventType`, `amount`, `currency`, `status`, `metadata` (JSON)
- **AppSettings**: `reviewDelayDays`, `reviewRequestEnabled`, `googleReviewUrl`, `resealReminderMonths`, `resealReminderEnabled`

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

**Email templates** in `src/components/emails/`:
- `QuoteEmail.tsx`, `InvoiceEmail.tsx` — sent when quote/invoice is delivered
- `QuoteFollowUpEmail.tsx` — automated follow-up for stale SENT quotes
- `ResealReminderEmail.tsx` — reminder to schedule reseal service
- `ReviewRequestEmail.tsx` — Google review request after job completion
- `NewLeadNotificationEmail.tsx` — notification for new website leads
- `PaymentConfirmationEmail.tsx` — Square payment confirmation
- `DepositConfirmationEmail.tsx` — deposit payment confirmation

### Square payment integration

- Square SDK (`square@^44`) — singleton in `src/lib/square.ts`
- `getSquareClient()` — uses `SQUARE_ACCESS_TOKEN` + `SQUARE_ENVIRONMENT`
- `getLocationId()` — requires `SQUARE_LOCATION_ID` env var
- Payment links created via `square.checkout.paymentLinks.create()`
- Webhook at `/api/square/webhook` — HMAC SHA-256 signature verification using `x-square-hmacsha256-validation` header
- Deposit calculation: `depositType === "PERCENTAGE" ? total * depositAmount / 100 : depositAmount`

### Cron jobs / automation

- All cron routes at `/api/cron/*` verify `Authorization: Bearer ${CRON_SECRET}` header (401 if missing/invalid)
- **quote-followup**: sends follow-up emails for SENT quotes at configurable intervals (`QUOTE_FOLLOWUP_DAYS` env var, default `"3,7"`)
- **reseal-reminders**: sends reminders for completed jobs with `resealDueDate` approaching
- **review-requests**: sends Google review request emails after job completion (delay configurable via `AppSettings.reviewDelayDays`)

### Customer portal (magic links)

- JWT signed with `PORTAL_JWT_SECRET` via `jose` library
- Token payload: `{ type: 'quote'|'invoice', id: string }`, expires 30 days
- Helpers in `src/lib/portal-token.ts`: `signPortalToken()`, `verifyPortalToken()`
- Portal page at `/portal/[token]` is fully public, shows read-only quote or invoice
- **Actions**: approve quote, decline quote (SENT only), request changes (with message), pay invoice (Square), pay deposit (Square)
- Payment success/cancel pages at `/portal/[token]/payment-success` and `/portal/[token]/payment-cancel`
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

# Square payments
SQUARE_ACCESS_TOKEN             # Square API access token
SQUARE_ENVIRONMENT              # "sandbox" or "production"
SQUARE_LOCATION_ID              # Square location ID for payments
SQUARE_WEBHOOK_SIGNATURE_KEY    # HMAC key for webhook verification

# Cron / automation
CRON_SECRET                     # Bearer token for cron endpoint authorization
QUOTE_FOLLOWUP_DAYS             # Comma-separated days for follow-ups (default: "3,7")
GOOGLE_REVIEW_URL               # Google review link for review request emails

# App
NEXT_PUBLIC_APP_URL             # https://app.mountainwestsurface.com (or http://localhost:3000 locally)
WEBSITE_ORIGIN                  # https://mountainwestsurface.com (for CORS)
```

### Supabase Storage

Use the `job-photos` bucket for before/after photos. Upload via the browser Supabase client in a Client Component (with `browser-image-compression` for client-side compression), store the resulting public URL in `JobPhoto.url`.

### Quote/Invoice numbering

Sequential numbers generated via helpers in `src/lib/numbering.ts`:
- `getNextQuoteNumber()` → `Q-0001` format (queries max, increments)
- `getNextInvoiceNumber()` → `INV-0001` format (queries max, increments)

### Key UI patterns

**Send button (4-state machine):** `idle → confirming → sending → sent`
The `confirming` state shows "Send to email@example.com? Yes / Cancel" inline to prevent accidental double-sends. Once sent, the button shows a permanent `Sent` badge for the page lifetime. Used by `SendQuoteButton` and `SendInvoiceButton`.

**Confirm-step delete:** `DeleteQuoteButton`, `DeleteInvoiceButton`, `DeleteJobButton` all use a confirm-step pattern before deletion.

**Duplicate record:** `DuplicateQuoteButton` and `DuplicateInvoiceButton` POST to `/api/quotes/[id]/duplicate` or `/api/invoices/[id]/duplicate`, which clone the record with a new auto-generated number.

**Pipeline kanban:** Uses `@dnd-kit/core` + `@dnd-kit/sortable` for drag-and-drop between status columns.

**Dashboard "Needs Attention":** Surfaces unquoted leads (>3 days), stale SENT quotes (>7 days), and expiring quotes (within 3 days). Hidden when nothing needs attention.

---

## Website integration

The public website at `mountainwestsurface.com` is hosted on **Vercel** (static HTML site at `/Users/nickguerriero/mountainwest-site/`). Contact forms POST to `https://app.mountainwestsurface.com/api/public/leads`. The CRM also serves a public reviews endpoint at `/api/public/reviews` (GET, CORS-enabled, 1hr cache).
