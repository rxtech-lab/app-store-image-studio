# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

App Store Images Generator — a Next.js web app for creating App Store screenshots with a Konva-based canvas editor, AI-powered editing (Gemini 3.1 Flash via Vercel AI SDK), and multi-device preset support.

## Commands

```bash
bun dev          # Start dev server
bun run build    # Production build
bun lint         # ESLint
bun db:generate  # Generate Drizzle migrations from schema
bun db:push      # Push schema changes to Turso database
bun db:studio    # Open Drizzle Studio (database UI)
```

No test framework is configured.

## Architecture

### Tech Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript 5
- **Styling:** TailwindCSS 4, Radix UI + shadcn components
- **Canvas:** Konva + react-konva for 2D drawing/editing
- **Database:** Turso (LibSQL/SQLite) + Drizzle ORM
- **Auth:** NextAuth v5 with RxLab OIDC provider
- **AI:** Vercel AI SDK (`ai` package) + Google Gemini 3.1 Flash via AI Gateway
- **Storage:** Vercel Blob for images
- **Animation:** Motion (framer-motion successor)

### Key Directories

- `app/(app)/` — Authenticated routes (dashboard, project/section editor)
- `app/api/ai/edit/` — Streaming AI canvas editing endpoint with tool use
- `actions/` — Server actions for all CRUD (projects, sections, templates, screenshots, AI, export)
- `components/editor/` — Canvas editor UI (toolbar, properties panel, template strip, export)
- `components/ui/` — shadcn component library
- `hooks/` — `useCanvasState` (reducer-based), `useAiEdit` (AI chat + tool dispatch), `useAutoSave`
- `lib/db/` — Drizzle schema, relations, client
- `lib/canvas/` — Canvas element types and defaults
- `lib/ai/` — AI tool definitions for canvas manipulation

### Data Model

Projects → Sections (device presets) → Templates (canvas states) + Screenshots (uploaded images). All IDs use nanoid. Cascade deletes from parent to children.

### Canvas System

Canvas state holds `{ width, height, backgroundColor, backgroundImageUrl, elements[] }`. Elements are typed as `screenshot | text | accent` (shapes). State is managed via `useCanvasState` reducer with actions like ADD_ELEMENT, UPDATE_ELEMENT, REORDER_ELEMENT, etc. Auto-saved to database via `useAutoSave`.

### AI Editing Flow

The AI edit endpoint (`app/api/ai/edit/route.ts`) uses streaming with tool calls. Tools defined in `lib/ai/tools.ts` manipulate the canvas (set background, add/update/remove elements, view screenshots). The `useAiEdit` hook processes tool results and dispatches canvas state changes. The AI is instructed to communicate only through tool calls, not plain text.

### Image Presets

Defined in `lib/settings.ts`: iPhone 5.5"/6.5"/6.7", iPad 11"/12.9", Mac — each with specific pixel dimensions.

## Conventions

- **Server actions over REST API** for all CRUD operations
- All server actions check `auth()` and use `revalidatePath()` for cache invalidation
- Path alias: `@/*` maps to project root
- IDs generated with `nanoid()`
- Images stored as public URLs via Vercel Blob
- Canvas exports use Konva `stage.toDataURL()` for base64 PNG generation
