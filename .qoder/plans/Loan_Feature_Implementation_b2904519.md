# Loan Feature (Catatan Pinjaman)

## Key Design Decisions

- **Borrower model**: Separate `Borrower` table. Internal borrowers link to `Member`, external borrowers store name/phone/address manually. Auto-suggest from existing external borrowers to prevent duplicates.
- **Interest model**: Declining balance (per bulan dari sisa pokok). Monthly interest = remaining principal x monthly rate. Fixed total interest calculated at loan creation = principal x rate x durationMonths.
- **Verification**: Follows existing pattern -- PENDING -> APPROVED/REJECTED. Only users with `verify:loan` can approve/reject.
- **Transaction sync**: On loan approval -> create EXPENSE CashTransaction (auto-APPROVED). On payment approval -> create INCOME CashTransaction (auto-APPROVED). Loan/payment edits sync to linked CashTransaction. Rejection soft-deletes the linked transaction.
- **Confirmation alerts**: Both loan creation and payment submission show a summary dialog before final submission.

---

## Task 1: Prisma Schema -- New Models and Enums

File: `prisma/schema.prisma`

Add enum and models:

```prisma
enum LoanStatus {
  PENDING
  APPROVED
  REJECTED
  PAID_OFF
}

model Borrower {
  id              String   @id @default(uuid())
  organizationId  String
  memberId        String?          // null for external
  name            String
  phone           String?
  address         String?
  isMember        Boolean  @default(false)
  totalBorrowed   Decimal  @default(0) @db.Decimal(15,2)
  totalPaid       Decimal  @default(0) @db.Decimal(15,2)
  notes           String?
  createdAt       DateTime @default(now())
  createdBy       String?
  updatedAt       DateTime @updatedAt
  updatedBy       String?
  deletedAt       DateTime?

  organization    Organization @relation(...)
  member          Member?      @relation(...)
  loans           Loan[]

  @@index([organizationId])
  @@index([name])
  @@index([memberId])
  @@map("borrowers")
}

model Loan {
  id              String      @id @default(uuid())
  organizationId  String
  borrowerId      String
  accountId       String           // source cash account
  loanNumber      String           @unique
  principal       Decimal          @db.Decimal(15,2)
  interestRate    Decimal          @db.Decimal(5,4) // monthly rate e.g. 0.02 = 2%
  durationMonths  Int
  totalInterest   Decimal          @db.Decimal(15,2) // computed at creation
  totalOwed       Decimal          @db.Decimal(15,2) // principal + totalInterest
  paidAmount      Decimal          @default(0) @db.Decimal(15,2)
  remainingAmount Decimal          @db.Decimal(15,2) // totalOwed - paidAmount
  loanDate        DateTime         @db.Date
  dueDate         DateTime         @db.Date
  status          LoanStatus       @default(PENDING)
  purpose         String?
  notes           String?
  cashTransactionId String?        @unique  // disbursement transaction
  recordedBy      String
  verifiedBy      String?
  verifiedAt      DateTime?
  createdAt       DateTime         @default(now())
  ...audit fields...

  // Relations
  borrower        Borrower @relation(...)
  account         CashAccount @relation(...)
  organization    Organization @relation(...)
  recorder        User @relation(...)
  verifier        User? @relation(...)
  cashTransaction CashTransaction? @relation(...)
  payments        LoanPayment[]

  @@index([organizationId])
  @@index([borrowerId])
  @@index([status])
  @@map("loans")
}

model LoanPayment {
  id                String      @id @default(uuid())
  organizationId    String
  loanId            String
  amount            Decimal     @db.Decimal(15,2)
  paymentDate       DateTime    @db.Date
  notes             String?
  status            LoanStatus  @default(PENDING)
  cashTransactionId String?     @unique  // repayment transaction
  recordedBy        String
  verifiedBy        String?
  verifiedAt        DateTime?
  createdAt         DateTime    @default(now())
  ...audit fields...

  // Relations
  loan              Loan @relation(...)
  organization      Organization @relation(...)
  cashTransaction   CashTransaction? @relation(...)
  recorder          User @relation(...)
  verifier          User? @relation(...)

  @@index([loanId])
  @@index([status])
  @@map("loan_payments")
}
```

Also add reverse relations to existing models: `Organization`, `CashAccount`, `User`, `CashTransaction`, `Member`.

---

## Task 2: Permissions and Seed

File: `prisma/seed.ts`

Add new permissions:
```
create:loan, read:loan, update:loan, delete:loan, verify:loan
create:loanPayment, read:loanPayment, update:loanPayment, delete:loanPayment, verify:loanPayment
```

---

## Task 3: Database Migration

Run `npx prisma migrate dev --name add_loan_feature`.

---

## Task 4: Routes Configuration

File: `src/config/routes.ts`

Add dashboard routes:
```
loans: "/dashboard/finance/loans"
loanDetail: (id) => /dashboard/finance/loans/${id}
```

Add API routes:
```
loans: "/api/loans"
loan: (id) => /api/loans/${id}
loanVerify: (id) => /api/loans/${id}/verify
loanPayments: (loanId) => /api/loans/${loanId}/payments
loanPayment: (id) => /api/loan-payments/${id}
loanPaymentVerify: (id) => /api/loan-payments/${id}/verify
borrowers: "/api/borrowers"
borrowerSearch: "/api/borrowers/search"
```

---

## Task 5: Types

File: `src/types/loan.ts`

Define `ListLoanQueryParam`, `ListLoanPaymentQueryParam`, `ListBorrowerQueryParam`.

---

## Task 6: API Routes

### 6a. Borrowers API

- `GET /api/borrowers` -- list borrowers with search/filter, pagination, summary stats (totalBorrowed, totalPaid per borrower)
- `GET /api/borrowers/search?q=...` -- lightweight search for autocomplete (returns id, name, phone, isMember)
- `POST /api/borrowers` -- create external borrower (validate no duplicate by name+org)

### 6b. Loans API

- `GET /api/loans` -- list loans with filters (status, borrowerId, accountId, dateFrom/To), pagination, summary (totalActive, totalOutstanding, totalDisbursed)
- `GET /api/loans/[id]` -- single loan with payments list
- `POST /api/loans` -- create loan (PENDING). Compute totalInterest = principal x rate x durationMonths, totalOwed = principal + totalInterest, remainingAmount = totalOwed, dueDate = loanDate + durationMonths. Validate account balance sufficiency warning. Requires `create:loan`.
- `PATCH /api/loans/[id]` -- update PENDING loan only (recalculate totals, sync CashTransaction description if approved)
- `DELETE /api/loans/[id]` -- soft-delete PENDING loan only

### 6c. Loan Verification API

- `POST /api/loans/[id]/verify` -- approve or reject. Requires `verify:loan`.
  - **Approve**: Set status APPROVED. Create EXPENSE CashTransaction (auto-APPROVED, linked via cashTransactionId). Decrement CashAccount balance. Increment Borrower.totalBorrowed.
  - **Reject**: Set status REJECTED. No transaction created.

### 6d. Loan Payments API

- `GET /api/loans/[loanId]/payments` -- list payments for a specific loan
- `POST /api/loans/[loanId]/payments` -- create payment (PENDING). Validate amount <= loan.remainingAmount. Requires `create:loanPayment`.
- `PATCH /api/loan-payments/[id]` -- update PENDING payment only
- `DELETE /api/loan-payments/[id]` -- soft-delete PENDING payment only

### 6e. Loan Payment Verification API

- `POST /api/loan-payments/[id]/verify` -- approve or reject. Requires `verify:loanPayment`.
  - **Approve**: Set status APPROVED. Create INCOME CashTransaction (auto-APPROVED, linked). Increment CashAccount balance. Update Loan.paidAmount, remainingAmount. If remainingAmount == 0, set loan status PAID_OFF. Increment Borrower.totalPaid.
  - **Reject**: Set status REJECTED.

---

## Task 7: Zod Validation Schemas

File: `src/lib/validations/loan.ts`

Schemas for: `createLoanSchema`, `updateLoanSchema`, `verifyLoanSchema`, `createLoanPaymentSchema`, `updateLoanPaymentSchema`, `createBorrowerSchema`.

---

## Task 8: React Query Hooks

File: `src/hooks/use-loans.ts`

Hooks: `useLoans`, `useLoan`, `useCreateLoan`, `useUpdateLoan`, `useDeleteLoan`, `useVerifyLoan`, `useLoanPayments`, `useCreateLoanPayment`, `useUpdateLoanPayment`, `useDeleteLoanPayment`, `useVerifyLoanPayment`.

File: `src/hooks/use-borrowers.ts`

Hooks: `useBorrowers`, `useBorrowerSearch`, `useCreateBorrower`.

Export from `src/hooks/index.ts`.

---

## Task 9: Dashboard Pages

### 9a. Loans List Page

Files:
- `src/app/dashboard/finance/loans/page.tsx` (server component with permission check `read:loan`)
- `src/app/dashboard/finance/loans/_components/loans-table.tsx` (client component)

Features:
- StatCards: Total Pinjaman Aktif, Total Outstanding, Total Disetujui Bulan Ini
- Filter bar: search, status filter, date range
- Table columns: No. Pinjaman, Peminjam, Nominal, Bunga, Total Bayar, Sisa, Jatuh Tempo, Status, Actions
- Create button (permission-gated)

### 9b. Loan Detail Page

Files:
- `src/app/dashboard/finance/loans/[id]/page.tsx` (server component)
- `src/app/dashboard/finance/loans/[id]/_components/loan-detail-client.tsx`

Features:
- Loan info card (borrower, amounts, dates, interest breakdown, status badge)
- Payment schedule/history table
- Add payment button (if status APPROVED and not PAID_OFF)
- Verify buttons (for verify permission holders)

### 9c. Loan Form Dialog

File: `src/app/dashboard/finance/loans/_components/loan-form-dialog.tsx`

Features:
- Borrower selection: radio toggle between "Anggota" (search/select member) and "Eksternal" (search existing or input new)
- Select cash account (dropdown)
- Input: principal, interest rate (%), duration (months), loan date, purpose
- **Live calculation display**: total bunga, total bayar, estimasi cicilan/bulan
- **Confirmation alert**: Before submit, show a summary dialog (AlertDialog) with all values for user to confirm

### 9d. Payment Form Dialog

File: `src/app/dashboard/finance/loans/[id]/_components/payment-form-dialog.tsx`

Features:
- Display: remaining amount, loan info
- Input: payment amount, payment date, notes
- Max amount validation (cannot exceed remainingAmount)
- **Confirmation alert**: Before submit, show summary dialog

---

## Task 10: Sidebar Navigation

File: `src/components/layout/sidebar.tsx`

Add "Pinjaman" item under "Keuangan" submenu:
```
{ label: "Pinjaman", href: "/dashboard/finance/loans", icon: HandCoins, permission: "read:loan" }
```

---

## Task 11: Transaction Sync Logic

Within the verify API routes (Tasks 6c and 6e), implement atomic `$transaction` operations that:
1. Update loan/payment status
2. Create/update CashTransaction
3. Update CashAccount balance
4. Update Borrower totals

When a loan is edited after approval, update the linked CashTransaction description/amount if applicable. When rejected, handle cleanup properly.

---

## Task 12: Verify and Test

- Run `npx tsc --noEmit` for type-check
- Run `npx prisma migrate dev` to apply migration
- Verify the build compiles with `npm run build`
