# GitHub Copilot Instructions

## Project Overview

App Studio is a Next.js 16 web app for creating App Store screenshots, app icons, and marketing assets. It features a Konva-based canvas editor, AI-powered editing via Google Gemini (Vercel AI SDK), and multi-device presets.

## Package Manager

**Always use `bun`** as the package manager. Never suggest `npm`, `yarn`, or `pnpm`.

```bash
bun install          # install dependencies
bun add <pkg>        # add a dependency
bun add -d <pkg>     # add a dev dependency
bun dev              # start dev server
bun run build        # production build
bun lint             # ESLint
```

## Tech Stack

- **Framework:** Next.js 16 App Router, React 19, TypeScript 5
- **Styling:** TailwindCSS 4 (configured via CSS `@import "tailwindcss"` + `@theme inline`), Radix UI primitives via single `radix-ui` package, shadcn components
- **Canvas:** Konva + react-konva for 2D drawing/editing
- **Database:** Turso (LibSQL/SQLite) + Drizzle ORM — migrations in `/drizzle`
- **Auth:** NextAuth v5 (`next-auth`) with RxLab OIDC provider
- **AI:** Vercel AI SDK (`ai` package) + `@ai-sdk/gateway` + Google Gemini 3.1 Flash
- **Storage:** Vercel Blob for images
- **Animation:** Motion v12 via `motion/react` (not `framer-motion`)

## Architecture Conventions

### Server Actions over REST
All CRUD operations use server actions in `actions/`. Every action must:
1. Call `auth()` and verify session before any database access
2. Call `revalidatePath()` after mutations

### Data Model
`Projects → Sections (device presets) → Templates (canvas states) + Screenshots (uploaded images)`
- All IDs use `nanoid()`
- Cascade deletes from parent to children

### Canvas System
- State shape: `{ width, height, backgroundColor, backgroundImageUrl, elements[] }`
- Elements are typed as `screenshot | text | accent`
- Managed via `useCanvasState` reducer in `hooks/`
- Auto-saved via `useAutoSave` hook

### AI Editing
- Streaming endpoint at `app/api/ai/edit/route.ts`
- AI tools defined in `lib/ai/tools.ts` (manipulate canvas state)
- `useAiEdit` hook dispatches tool results to canvas reducer
- The AI communicates only through tool calls, not plain text

## Key Conventions

### Imports
- UI primitives: `import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui"` (single package)
- Animation: `import { motion } from "motion/react"` (not `framer-motion`)
- Ease arrays must use `as const`: `const ease = [0.25, 0.4, 0, 1] as const`
- Path alias: `@/*` maps to project root

### CSS / Tailwind
- Tailwind v4 is configured in CSS, not `tailwind.config.js`
- Do **not** use `currentColor` inside CSS gradients (Turbopack's lightningcss doesn't support it) — use concrete `oklch()` values instead

### TypeScript
- Prefer explicit types on public API boundaries
- Use Zod for runtime validation of external/AI inputs

### File Structure
```
app/(app)/          # Authenticated app routes
app/api/            # API routes (AI streaming)
actions/            # Server actions (auth-gated CRUD)
components/editor/  # Canvas editor UI
components/ui/      # shadcn components
hooks/              # Client-side React hooks
lib/ai/             # AI tool definitions
lib/canvas/         # Canvas types and defaults
lib/db/             # Drizzle schema, relations, client
lib/settings.ts     # Device presets
public/             # Static assets
drizzle/            # SQL migration files
```

## Database Commands

```bash
bun db:generate   # generate Drizzle migrations from schema changes
bun db:push       # push schema directly to Turso (no migration file)
bun db:studio     # open Drizzle Studio UI
```
