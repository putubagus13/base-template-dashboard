## About

Dashboard Template is a production-ready full-stack starter for internal
tools and admin dashboards, built on the modern Next.js 15 App Router
architecture.

### What's included

- **Authentication** — Login, register, forgot password, reset password,
  silent token refresh via HTTP-only cookies
- **Dynamic RBAC** — Roles and permissions stored in the database, checked
  both server-side (middleware, API routes) and client-side (hooks,
  PermissionGuard component)
- **Data layer** — Prisma ORM with Supabase PostgreSQL, connection pooling,
  seed script, and audit logging on every mutation
- **API standards** — Centralized response builder (`ApiResponseBuilder`)
  with consistent shape, typed error codes, and Zod validation on all inputs
- **React Query** — Centralized query keys, optimistic cache invalidation,
  and typed hooks for every resource
- **UI system** — 20+ accessible components (Dialog, Table, Pagination,
  Tabs, Tooltip, StatCard, and more) built with TailwindCSS and CVA
- **Developer experience** — Strict TypeScript (no `any`), barrel exports,
  ESLint 9 flat config, and a comprehensive `DEVELOPER_GUIDE.md`
  enforcing consistent conventions across the codebase

### Tech Stack

Next.js 15 · React 19 · TypeScript 5 · Prisma 5 · Supabase ·
React Query 5 · Zustand 5 · TailwindCSS 3 · Zod · Jose (JWT)
