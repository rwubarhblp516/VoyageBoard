# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VoyageBoard is a trip planning and expense-splitting SPA. The UI is in Chinese. Built with React 19, Vite 6, TypeScript, Supabase (auth + Postgres + storage), and deployed to Cloudflare Pages.

## Commands

```bash
npm run dev          # Start dev server on 127.0.0.1:5173
npm run build        # Type-check (tsc -b) + Vite production build
npm run preview      # Preview production build locally
```

No test runner or linter is configured in this project.

## Supabase

```bash
npx supabase link --project-ref ochnzkzadpkhjyeokbkd   # Link to remote project
npx supabase migration list                              # Check migration status
npx supabase db push                                     # Apply pending migrations
```

Migrations live in `supabase/migrations/` as timestamped SQL files. The TypeScript types are auto-generated at `src/types/database.types.ts`.

## Architecture

**Routing** — `src/App.tsx` defines all routes. The app shell uses a top nav bar and a dock-style bottom nav (`MainLayout`). Protected routes wrap in `ProtectedRoute` which redirects to `/login` when unauthenticated. Auth state is initialized in `AuthInitializer` via Supabase `onAuthStateChange`.

**Feature modules** — `src/features/` is organized by domain: `auth`, `trips`, `expenses`. Each feature has `pages/` and optionally `components/` subdirectories. Route components are imported directly in App.tsx.

**State management** — Zustand stores in `src/stores/`:
- `useAuthStore` — current Supabase user, sign-out
- `useTripStore` — persisted (localStorage) current trip and trip list
- `useUIStore` — modal open/close state (add expense modal)

**Server data** — React Query (`@tanstack/react-query`) fetches Supabase data. Query keys follow the pattern `['expenses']`, `['dashboard', tripId]`, `['settlement', tripId]`, etc. Invalidate these keys after mutations.

**Supabase client** — `src/lib/supabase.ts` exports a typed `supabase` client. All database access goes through this client using the Supabase JS SDK query builder (`.from().select()`, etc.).

**UI components** — `src/components/ui/` contains shadcn/ui components (base-nova style). `src/components/` has shared visual components (animations, layout). Path alias `@/` maps to `src/`.

## Key Conventions

- **Amounts are stored in cents** (integer). Display by dividing by 100: `(amount / 100).toFixed(2)`.
- **Path alias**: `@/` → `src/` (configured in both `vite.config.ts` and `tsconfig.json`).
- **CSS**: Tailwind CSS v4 via `@tailwindcss/vite` plugin. Custom fonts: Geist (variable), Outfit, MiSans. Styles in `src/styles/index.css`.
- **Animations**: Framer Motion (`motion` package) for layout transitions. `src/components/` has several WebGL/canvas visual effects (Aurora, Particles, Waves, etc.).
- **shadcn/ui**: Component config in `components.json`. Use `npx shadcn add <component>` to add new UI components.

## Environment Variables

Required in `.env` (gitignored):
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase connection
- `VITE_AMAP_JS_API_KEY` / `VITE_AMAP_SECURITY_JS_CODE` — Amap (高德地图) JSAPI

## Deployment

Cloudflare Pages project `trip`, production domain `trip.hpptools.top`. Git integration on `main` branch auto-deploys. Manual deploy: `npm run build && npx wrangler pages deploy dist --project-name trip --branch main`.
