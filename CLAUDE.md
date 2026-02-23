# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A full-featured CRM for a concrete sealing company. Core features: customer management, job tracking, quoting, invoicing, scheduling, and before/after photo documentation.

## Commands

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npx prisma studio    # Open DB browser UI
npx prisma migrate dev --name <name>   # Create and apply a migration
npx prisma generate  # Regenerate Prisma client after schema changes (Prisma 7: connection URL lives in prisma.config.ts, not schema.prisma)
```

## Architecture

**Stack:** Next.js 14 (App Router) · TypeScript · Supabase (Postgres + Auth + Storage) · Prisma ORM · shadcn/ui · Tailwind CSS

### Key conventions

- **Server Components by default.** Only add `"use client"` when you need interactivity, browser APIs, or hooks.
- **API routes** live in `src/app/api/`. Use them for mutations (POST/PATCH/DELETE). Reads can be done directly in Server Components via Prisma.
- **Auth** is handled by Supabase. Use `src/lib/supabase/server.ts` in Server Components/API routes and `src/lib/supabase/client.ts` in Client Components.
- **Prisma client** is a singleton exported from `src/lib/prisma.ts`. Never instantiate `PrismaClient` elsewhere. Prisma 7 uses `@prisma/adapter-pg` — the adapter is wired in `prisma.ts`, connection URL comes from `DATABASE_URL` env var.
- **Types** are re-exported from `src/types/index.ts`.
- **Forms** use `react-hook-form@7` + `@hookform/resolvers@3` + `zod@3`. Keep these pinned together — v5 resolvers require react-hook-form v8 which breaks things. Use `zodResolver` from `@hookform/resolvers/zod`. Prisma-generated types are the source of truth — do not duplicate them.

### Folder structure

```
src/
  app/
    dashboard/       # Main dashboard with KPIs
    customers/       # Customer list + detail pages
    jobs/            # Job list + detail + photo upload
    quotes/          # Quote builder + PDF view
    invoices/        # Invoice management
    schedule/        # Calendar view of scheduled jobs
    login/           # Auth page
    api/             # API route handlers
  components/
    layout/          # Sidebar, nav, shell
    ui/              # shadcn/ui primitives (do not edit)
    customers/       # Customer-specific components
    jobs/            # Job-specific components
    quotes/          # Quote builder components
    invoices/        # Invoice components
    schedule/        # Calendar components
  lib/
    prisma.ts        # Prisma singleton
    supabase/
      client.ts      # Browser Supabase client
      server.ts      # Server Supabase client
  types/
    index.ts         # Re-exports Prisma types + status label maps
```

### Data model relationships

```
Customer → Jobs → JobPhotos (before/after, stored in Supabase Storage)
Customer → Quotes → QuoteLineItems
Customer → Invoices → InvoiceLineItems
Job → Quote (optional link)
Job → Invoice (optional link)
Quote → Invoice (optional link, when converting quote to invoice)
```

### Environment variables

See `.env` for required variables. All `NEXT_PUBLIC_` vars are safe for the browser. `SUPABASE_SERVICE_ROLE_KEY` must only be used in server-side code.

### Supabase Storage

Use the `job-photos` bucket for before/after photos. Upload via the browser Supabase client in a Client Component, store the resulting public URL in `JobPhoto.url`.

### Quote/Invoice numbering

Generate sequential numbers server-side in API routes (e.g. `Q-0001`, `INV-0001`). Query `MAX(quoteNumber)` or use a counter table to avoid collisions.
