# MandiSmart Frontend

Urdu-first Next.js frontend for `MandiSmart`, a mandi management and ledger SaaS for `مالک / آڑھتی` and `مشی / آپریٹر`.

This project is built on top of an existing Next.js template and is now adapted for:

- Urdu-only visible UI
- RTL layout
- owner and operator workflows
- mandi sales, payments, expenses, supplier and customer ledger flows
- reports and settlement-style business summaries
- light and dark theme support

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui
- TanStack Query
- React Hook Form
- Sonner
- next-themes

## Main Features

- Authentication with tenant slug, email and password
- Protected dashboard routes
- Role-aware navigation and access control
- Urdu-first dashboard
- Customers and customer ledger
- Suppliers and linked vehicle/maal records
- Maal / gaari management
- Sales entry
- Payment entry
- Expense entry
- Reports:
  - daily sales
  - customer ledger
  - maal summary
  - supplier account summary
- Light and dark mode toggle

## Project Structure

```text
app/
  (auth)/
  (dashboard)/
  layout.tsx
  providers.tsx
  globals.css

components/
  mandi/
    forms.tsx
    pages.tsx
    ui.tsx
    urdu-keyboard.tsx
  ui/

lib/
  mandi/
    api.ts
    constants.ts
    session.ts
    types.ts
    utils.ts
```

## Key Application Areas

### Auth

- `app/(auth)/login/page.tsx`
- `app/(auth)/layout.tsx`

### Dashboard

- `app/(dashboard)/dashboard/page.tsx`

### Customers

- `app/(dashboard)/customers/page.tsx`
- `app/(dashboard)/customers/[id]/page.tsx`

### Suppliers

- `app/(dashboard)/suppliers/page.tsx`
- `app/(dashboard)/suppliers/[id]/page.tsx`

### Maal / Gaari

- `app/(dashboard)/consignments/page.tsx`
- `app/(dashboard)/consignments/[id]/page.tsx`

### Sales / Payments / Expenses

- `app/(dashboard)/sales/page.tsx`
- `app/(dashboard)/payments/page.tsx`
- `app/(dashboard)/expenses/page.tsx`

### Reports

- `app/(dashboard)/reports/page.tsx`
- `app/(dashboard)/reports/daily-sales/page.tsx`
- `app/(dashboard)/reports/customer-ledger/page.tsx`
- `app/(dashboard)/reports/consignment-summary/page.tsx`
- `app/(dashboard)/reports/supplier-settlement/page.tsx`

## Environment Variables

Create a `.env.local` file in the project root.

```env
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

Change the URL according to your backend.

## Install

Recommended Node version:

- Node 22 LTS

Install dependencies:

```bash
npm install
```

## Run In Development

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Production Build

```bash
npm run build
npm run start
```

If your shell does not automatically expose the selected `nvm` Node binary in build tooling, run build with proper `PATH` or switch shell session correctly before running.

## Authentication Notes

- Login uses tenant slug + email + password
- Session token is stored in frontend session storage/local store
- `/auth/me` is used to validate active session
- Report routes are owner-only

## Theme Notes

- Light and dark modes are supported
- Theme switcher is available on auth and dashboard layouts
- Styling is optimized for Urdu readability and RTL flow

## Typography Notes

- Headings use a Jameel Noori Nastaleeq-friendly stack
- Body text uses a simpler readable Arabic/Urdu-friendly sans stack
- Font setup is local/offline-safe and does not rely on Google Fonts at build time

## Business Language Notes

Visible Urdu in the app is simplified for practical mandi use. In the UI:

- `Consignment` is shown as `مال / گاڑی` or `گاڑی`
- ledger concepts clearly show:
  - sale = debit
  - payment = credit
  - running balance
  - advance / negative balance

Internal code and API names still use `consignment`, `sale`, `payment`, etc.

## Shared Frontend Files

### `components/mandi/ui.tsx`

Contains shared frontend building blocks:

- app shell
- auth guard
- role guard
- page header
- summary cards
- section cards
- loading, empty and error states
- reusable list/table presentation

### `components/mandi/forms.tsx`

Contains reusable CRUD dialogs for:

- customers
- suppliers
- users
- maal / gaari
- sales
- payments
- expenses

### `components/mandi/pages.tsx`

Contains page clients and feature-level screen logic.

### `lib/mandi/api.ts`

Contains API integration layer and response normalization.

## Urdu Keyboard Status

`components/mandi/urdu-keyboard.tsx` currently exists in the codebase for future work, but it is not mounted in `app/providers.tsx`.

That means:

- it is currently disabled
- it does not show anywhere in the app
- it can be revisited later when the UX is finalized

## Current Conventions

- Use Urdu-only visible UI
- Keep RTL intact
- Follow existing shared components instead of creating one-off page UI
- Prefer real API data over mock data
- Keep owner/operator permissions aligned with backend

## Verification Notes

Recently verified locally:

- TypeScript check passes with:

```bash
npx tsc --noEmit
```

Build also required:

- correct Node path exposure
- offline-safe fonts
- current env setup

## Recommended Next Improvements

- final lint cleanup pass
- report print styling refinement
- deeper mobile usability pass for dense forms
- future rework of Urdu keyboard UX before enabling it globally
