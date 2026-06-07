# Dashboard Template — Developer Guide

> **Next.js 15 · TypeScript · Prisma · Supabase · React Query · TailwindCSS**

Dokumen ini adalah **aturan wajib** yang harus diikuti oleh semua developer yang berkontribusi pada project ini. Tujuannya adalah konsistensi arsitektur, keterbacaan kode, dan kemudahan maintenance jangka panjang.

---

## Daftar Isi

1. [Project Structure](#1-project-structure)
2. [TypeScript Rules](#2-typescript-rules)
3. [API Routes — Aturan & Standar Response](#3-api-routes)
4. [Database & Prisma](#4-database--prisma)
5. [Auth & RBAC](#5-auth--rbac)
6. [React Query — Data Fetching](#6-react-query)
7. [Komponen & UI](#7-komponen--ui)
8. [Naming Conventions](#8-naming-conventions)
9. [Setup & Running Locally](#9-setup--running-locally)
10. [Checklist Sebelum PR](#10-checklist-sebelum-pr)

---

## 1. Project Structure

```
src/
├── app/                        # Next.js App Router pages & API
│   ├── api/                    # API Route Handlers
│   │   ├── auth/               #   Auth endpoints (login, register, dll)
│   │   ├── users/              #   User CRUD
│   │   └── roles/              #   Role & Permission management
│   ├── auth/                   # Auth pages (login, register, dll)
│   ├── dashboard/              # Protected dashboard pages
│   │   ├── users/
│   │   │   └── _components/    #   Page-scoped components (prefix _)
│   │   └── roles/
│   │       └── _components/
│   ├── layout.tsx              # Root layout + Providers
│   ├── providers.tsx           # React Query + global providers
│   └── globals.css
│
├── components/
│   ├── ui/                     # Reusable atomic UI (Button, Input, Badge…)
│   ├── layout/                 # Sidebar, Navbar
│   ├── auth/                   # Auth-specific forms
│   └── shared/                 # Cross-cutting (PermissionGuard, dll)
│
├── hooks/                      # React Query hooks + custom hooks
│   ├── use-auth.ts
│   ├── use-users.ts
│   ├── use-roles.ts
│   └── use-permission.ts
│
├── lib/
│   ├── api-client.ts           # Base fetch wrapper
│   ├── api-response.ts         # Response builder untuk API routes
│   ├── auth/
│   │   ├── helpers.ts          # Session, cookie, password utils
│   │   ├── jwt.ts              # JWT sign/verify
│   │   └── rbac.ts             # Permission checking functions
│   ├── db/
│   │   └── prisma.ts           # Prisma singleton
│   └── validations/
│       └── auth.ts             # Zod schemas (auth)
│
├── store/
│   └── auth.store.ts           # Zustand auth state (client-side)
│
├── types/
│   ├── index.ts                # Re-exports semua types
│   ├── api.ts                  # ApiResponse, ErrorCode, Pagination
│   ├── auth.ts                 # AuthUser, JwtPayload, Credentials
│   └── rbac.ts                 # Role, Permission, PermissionString
│
├── utils/
│   └── cn.ts                   # Tailwind class merger
│
└── middleware.ts               # Route protection middleware
```

### Aturan Peletakan File

| Jenis File | Lokasi |
|---|---|
| API endpoint | `src/app/api/[resource]/route.ts` |
| Page | `src/app/[segment]/page.tsx` |
| Layout | `src/app/[segment]/layout.tsx` |
| Komponen scoped ke 1 page | `src/app/[segment]/_components/` |
| Komponen reusable | `src/components/[category]/` |
| React Query hooks | `src/hooks/use-[resource].ts` |
| Zod schemas | `src/lib/validations/[domain].ts` |
| Type definitions | `src/types/[domain].ts` |

---

## 2. TypeScript Rules

### Dilarang Keras

```typescript
// ❌ DILARANG: penggunaan `any`
const data: any = await fetch(...)
function handler(req: any) {}

// ❌ DILARANG: type assertion tanpa alasan
const user = data as User

// ❌ DILARANG: non-null assertion tanpa guard
const name = user!.name
```

### Wajib Dilakukan

```typescript
// ✅ Selalu define return type pada functions
async function getUser(id: string): Promise<User | null> { ... }

// ✅ Gunakan unknown untuk external data, lalu validate
const body: unknown = await request.json()
const result = schema.safeParse(body)

// ✅ Gunakan type guard sebelum akses property
if (error instanceof ApiError) {
  toast.error(error.message)
}

// ✅ Optional chaining untuk nested access
const name = user?.profile?.name ?? "Unknown"
```

### Import Order

```typescript
// 1. Node builtins
import { randomBytes } from "crypto"

// 2. Framework/library
import { NextRequest } from "next/server"
import { z } from "zod"

// 3. Internal — lib/utils
import { prisma } from "@/lib/db/prisma"
import { ApiResponseBuilder } from "@/lib/api-response"

// 4. Internal — types
import type { AuthUser } from "@/types/auth"

// 5. Internal — components
import { Button } from "@/components/ui/button"
```

---

## 3. API Routes

### Standar Response

**WAJIB** menggunakan `ApiResponseBuilder` dari `@/lib/api-response`. Jangan membuat `NextResponse.json()` secara manual.

```typescript
// ✅ BENAR
return ApiResponseBuilder.success(data, "User fetched successfully.")
return ApiResponseBuilder.error("NOT_FOUND", "User not found.", 404)
return ApiResponseBuilder.validationError(formatZodErrors(result.error))

// ❌ SALAH — jangan buat response manual
return NextResponse.json({ data, status: "ok" }, { status: 200 })
```

### Struktur Response

Semua response mengikuti shape berikut:

```json
// Success
{
  "success": true,
  "message": "User fetched successfully.",
  "data": { ... }
}

// Error
{
  "success": false,
  "message": "Validation failed. Please check your input.",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      { "field": "email", "message": "Invalid email address" }
    ]
  }
}
```

### Template API Route

```typescript
// src/app/api/[resource]/route.ts

import { NextRequest } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { requireAuthUser } from "@/lib/auth/helpers"
import { hasPermission } from "@/lib/auth/rbac"
import { ApiResponseBuilder, formatZodErrors } from "@/lib/api-response"
import { z } from "zod"

const createSchema = z.object({
  name: z.string().min(2),
})

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const authUser = await requireAuthUser()

    // 2. Permission check
    if (!hasPermission(authUser, "create:resource")) {
      return ApiResponseBuilder.forbidden()
    }

    // 3. Validate input
    const body: unknown = await request.json()
    const result = createSchema.safeParse(body)
    if (!result.success) {
      return ApiResponseBuilder.validationError(formatZodErrors(result.error))
    }

    // 4. Business logic
    const item = await prisma.resource.create({ data: result.data })

    // 5. Return response
    return ApiResponseBuilder.success(item, "Resource created.", 201)
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return ApiResponseBuilder.unauthorized()
    }
    console.error("[POST /api/resource]", error)
    return ApiResponseBuilder.internalError()
  }
}
```

### Error Codes

| Code | HTTP | Kapan Digunakan |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Input tidak valid (Zod errors) |
| `UNAUTHORIZED` | 401 | Tidak terautentikasi |
| `FORBIDDEN` | 403 | Tidak punya permission |
| `NOT_FOUND` | 404 | Resource tidak ditemukan |
| `CONFLICT` | 409 | Duplicate data |
| `TOKEN_EXPIRED` | 401 | Token kadaluarsa |
| `TOKEN_INVALID` | 400/401 | Token tidak valid |
| `ACCOUNT_INACTIVE` | 403 | Akun dinonaktifkan |
| `INTERNAL_SERVER_ERROR` | 500 | Error tidak terduga |

---

## 4. Database & Prisma

### Prisma Client

```typescript
// ✅ BENAR — import dari singleton
import { prisma } from "@/lib/db/prisma"

// ❌ SALAH — jangan instantiate baru
import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()
```

### Konvensi Schema

- **Model**: `PascalCase` → `User`, `UserRole`
- **Field**: `camelCase` → `createdAt`, `userId`
- **Enum value**: `SCREAMING_SNAKE_CASE` → `SUPER_ADMIN`, `ACTIVE`
- Selalu tambahkan `@@map("snake_case")` agar nama tabel di DB konsisten
- Selalu tambahkan `@@index` pada field yang sering di-query
- Field `createdAt` dan `updatedAt` wajib ada di setiap model

### Transactions

Gunakan `prisma.$transaction` untuk operasi yang harus atomic:

```typescript
// ✅ Atomic: update + delete dalam satu transaction
await prisma.$transaction([
  prisma.user.update({ where: { id }, data: { password: newHash } }),
  prisma.token.deleteMany({ where: { userId: id, type: "REFRESH_TOKEN" } }),
])
```

### Commands

```bash
npm run db:migrate    # Buat & jalankan migration baru (development)
npm run db:push       # Push schema changes tanpa migration (prototyping)
npm run db:generate   # Regenerate Prisma Client setelah schema change
npm run db:studio     # Buka Prisma Studio
npm run db:seed       # Seed database dengan data awal
npm run db:migrate:prod  # Jalankan pending migrations di production
```

---

## 5. Auth & RBAC

### Server-Side Auth

```typescript
// Di API routes atau Server Components:

// Cek apakah user sudah login (nullable)
const user = await getAuthUser()

// Require auth — throw error jika tidak login
const user = await requireAuthUser()

// Cek permission setelah auth
if (!hasPermission(user, "read:user")) {
  return ApiResponseBuilder.forbidden()
}
```

### Client-Side Auth

```typescript
// Baca user dari store
const user = useAuthStore(s => s.user)

// Hook permission
const canCreate = useHasPermission("create:user")
const canAny = useHasAnyPermission(["create:user", "update:user"])
const { can, isSuperAdmin } = usePermissions()
```

### PermissionGuard Component

```tsx
// Conditional rendering — hanya render jika user punya permission
<PermissionGuard permission="create:user">
  <Button>Add User</Button>
</PermissionGuard>

// Dengan fallback
<PermissionGuard permission="delete:user" fallback={<span>No access</span>}>
  <DeleteButton />
</PermissionGuard>

// Role-based
<PermissionGuard role="SUPER_ADMIN">
  <DangerZone />
</PermissionGuard>
```

### Format Permission String

Permission ditulis dalam format `"action:subject"`:

```
read:user       → baca data user
create:user     → buat user baru
update:user     → ubah data user
delete:user     → hapus user
read:role       → baca data role
create:role     → buat role baru
read:dashboard  → akses dashboard
```

### Menambah Permission Baru

1. Tambahkan ke seed: `prisma/seed.ts`
2. Assign ke role yang sesuai di seed
3. Jalankan `npm run db:seed`
4. Gunakan di API route: `hasPermission(user, "action:subject")`
5. Gunakan di komponen: `useHasPermission("action:subject")`

---

## 6. React Query

### Query Key Convention

Setiap resource memiliki `*Keys` object yang terpusat:

```typescript
// src/hooks/use-users.ts
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (params: ListQueryParams) => [...userKeys.lists(), params] as const,
  detail: (id: string) => [...userKeys.all, "detail", id] as const,
}

// Penggunaan — invalidate setelah mutation
void queryClient.invalidateQueries({ queryKey: userKeys.lists() })
```

### Template Hook Pattern

```typescript
// Query (GET)
export function useUsers(params: ListQueryParams = {}) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => apiClient.get<UserListItem[]>(`/api/users?${qs}`),
    placeholderData: (prev) => prev, // Keep previous data saat refetch
  })
}

// Mutation (POST/PATCH/DELETE)
export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreatePayload) =>
      apiClient.post<User>("/api/users", payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      toast.success("User created.")
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) toast.error(error.message)
      else toast.error("Something went wrong.")
    },
  })
}
```

### Aturan

- `staleTime` default: 60 detik. Override per query jika data jarang berubah (misal permissions: 5 menit)
- Selalu `void` pada `invalidateQueries` karena returnnya adalah Promise yang tidak perlu di-await
- Jangan buat fetch langsung di komponen — selalu lewat hook

---

## 7. Komponen & UI

### Atomic Components (`src/components/ui/`)

Komponen murni tanpa business logic:
- `Button` — dengan variant, size, isLoading
- `Input` — dengan error state
- `FormField` — label + input + error message wrapper
- `Badge` — status badge dengan variant
- `Card`, `CardHeader`, `CardContent`, `CardFooter`
- `Spinner`

### Server vs Client Components

```typescript
// Server Component (default) — tidak perlu "use client"
// Gunakan untuk: fetch data, SEO, layout, akses server-only utilities
export default async function UsersPage() {
  const user = await getAuthUser() // ✅ Server-only
  ...
}

// Client Component — perlu "use client"
// Gunakan untuk: useState, useEffect, event handlers, React Query hooks
"use client"
export function UsersTable() {
  const { data } = useUsers() // ✅ React Query di client
  ...
}
```

### Convention untuk `_components/`

Folder `_components/` dalam sebuah route segment berisi komponen yang **hanya digunakan oleh route tersebut**. Jika sebuah komponen dibutuhkan lebih dari 1 page, pindahkan ke `src/components/`.

---

## 8. Naming Conventions

| Jenis | Konvensi | Contoh |
|---|---|---|
| File komponen | `kebab-case.tsx` | `users-table.tsx` |
| File hook | `use-kebab-case.ts` | `use-users.ts` |
| File util/lib | `kebab-case.ts` | `api-response.ts` |
| Komponen React | `PascalCase` | `UsersTable` |
| Hooks | `useCamelCase` | `useAuthStore` |
| Functions | `camelCase` | `getAuthUser` |
| Constants | `SCREAMING_SNAKE_CASE` | `PUBLIC_ROUTES` |
| Types/Interfaces | `PascalCase` | `AuthUser`, `ApiResponse` |
| Prisma models | `PascalCase` | `User`, `UserRole` |
| Database tables | `snake_case` | `users`, `user_roles` |
| API routes | `kebab-case` | `/api/forgot-password` |
| ENV variables | `SCREAMING_SNAKE_CASE` | `JWT_ACCESS_SECRET` |

---

## 9. Setup & Running Locally

### Prerequisites

- Node.js ≥ 20
- Supabase project (free tier cukup untuk development)

### Steps

```bash
# 1. Clone & install
git clone <repo-url>
cd dashboard-template
npm install

# 2. Setup environment
cp .env.example .env.local
# Edit .env.local dengan nilai yang benar

# 3. Generate Prisma client
npm run db:generate

# 4. Jalankan migrations
npm run db:migrate

# 5. Seed database
npm run db:seed

# 6. Jalankan development server
npm run dev
```

### Akun Default (setelah seed)

| Email | Password | Role |
|---|---|---|
| admin@example.com | Admin@123456 | SUPER_ADMIN |

---

## 10. Checklist Sebelum PR

Pastikan semua checklist ini terpenuhi sebelum membuat Pull Request:

**TypeScript**
- [ ] Tidak ada penggunaan `any`
- [ ] Semua function punya return type yang eksplisit
- [ ] Tidak ada error TypeScript (`npm run type-check`)

**API Routes**
- [ ] Semua response menggunakan `ApiResponseBuilder`
- [ ] Input di-validate dengan Zod sebelum diproses
- [ ] Auth check dilakukan di awal handler
- [ ] Error ter-log dengan `console.error("[ROUTE_NAME]", error)`

**Database**
- [ ] Tidak ada `PrismaClient` baru yang di-instantiate
- [ ] Operasi yang harus atomic menggunakan `$transaction`
- [ ] Schema baru sudah punya `@@map`, `@@index`, `createdAt`, `updatedAt`

**Components**
- [ ] "use client" hanya ditambahkan jika benar-benar butuh interaktivitas
- [ ] Tidak ada business logic di komponen UI (`src/components/ui/`)
- [ ] Permission check menggunakan `PermissionGuard` atau hooks

**React Query**
- [ ] Fetch data menggunakan hooks, bukan fetch langsung di komponen
- [ ] Query keys menggunakan `*Keys` object yang terpusat
- [ ] Cache di-invalidate setelah mutation yang relevan

**General**
- [ ] Tidak ada `console.log` yang tertinggal
- [ ] Tidak ada hardcoded credentials/secrets
- [ ] File ditempatkan di folder yang sesuai dengan aturan struktur
