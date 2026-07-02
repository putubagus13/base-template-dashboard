# Loan Flexible Duration + Overdue Tracking

## Summary

The current `durationMonths` field serves as a **calculation reference** for:
- `totalInterest = principal x rate x durationMonths`
- `dueDate = loanDate + durationMonths`

This plan enhances the system to:
1. Clarify duration as "expected period" (not a hard constraint)
2. Allow payments to continue beyond the duration
3. Track payment sequence automatically
4. Show overdue status when dueDate has passed with remaining balance

---

## Task 1: Update Loan Detail UI - Add Overdue Indicator

**File:** `src/app/dashboard/finance/loans/[id]/_components/loan-detail-client.tsx`

Add visual indicator when loan is overdue:
- Check if `new Date() > dueDate && remainingAmount > 0`
- Show "TERLAMBAT" badge (red) next to status if overdue
- Show days overdue count

```tsx
const isOverdue = new Date() > new Date(loan.dueDate) 
  && parseFloat(loan.remainingAmount) > 0 
  && loan.status === "APPROVED";

const daysOverdue = isOverdue 
  ? Math.floor((new Date().getTime() - new Date(loan.dueDate).getTime()) / (1000 * 60 * 60 * 24))
  : 0;
```

---

## Task 2: Update Payment Table - Add Auto-Computed Payment Sequence

**File:** `src/app/dashboard/finance/loans/[id]/_components/loan-detail-client.tsx`

Add "Pembayaran ke-" column that auto-computes based on payment date:
- Calculate month difference between `paymentDate` and `loanDate`
- Display as "Bulan ke-X" (Month X)
- This is display-only, no schema changes

```tsx
function computePaymentMonth(paymentDate: string, loanDate: string): number {
  const pd = new Date(paymentDate);
  const ld = new Date(loanDate);
  const monthsDiff = (pd.getFullYear() - ld.getFullYear()) * 12 
    + (pd.getMonth() - ld.getMonth());
  return Math.max(1, monthsDiff + 1);
}
```

Update table to show:
- Column header: "Periode"
- Cell value: "Bulan ke-{X}"

---

## Task 3: Update Loans List - Add Overdue Filter and Badge

**File:** `src/app/dashboard/finance/loans/_components/loans-table.tsx`

1. Add "Terlambat" filter option to status dropdown
2. Show overdue badge on loan rows when applicable
3. Add summary stat for overdue loans count

---

## Task 4: Update API - Add Overdue Filter Support

**File:** `src/app/api/loans/route.ts`

Add `overdue` query parameter:
- `?overdue=true` - returns loans where `dueDate < now AND remainingAmount > 0 AND status = APPROVED`
- Add `overdueCount` to summary response

---

## Task 5: Update Types and Hooks

**Files:**
- `src/types/loan.ts` - Add `overdue?: boolean` to `ListLoanQueryParam`
- `src/hooks/use-loans.ts` - Pass overdue filter to API

---

## No Schema Changes Required

The existing structure already supports this:
- `durationMonths` stays as calculation reference
- `dueDate` already exists for overdue detection
- `remainingAmount` tracks outstanding balance
- Payment tracking is via `paymentDate` (auto-compute period)

---

## UI Labels Update (Optional)

Update form labels to clarify duration meaning:
- "Durasi (Bulan)" -> "Perkiraan Tenor (Bulan)" or "Jangka Waktu (Bulan)"
- Add helper text: "Digunakan untuk perhitungan bunga dan jatuh tempo. Pembayaran bisa dilakukan melebihi jangka waktu ini."
