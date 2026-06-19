// src/types/loan.ts
// ============================================================
// LOAN (PINJAMAN) TYPES
// ============================================================

import { LoanStatus } from "@prisma/client";
import { ListQueryParams } from ".";

export type ListLoanQueryParam = {
  status?: LoanStatus;
  borrowerId?: string;
  accountId?: string;
  dateFrom?: string;
  dateTo?: string;
} & ListQueryParams;

export type ListLoanPaymentQueryParam = {
  status?: LoanStatus;
  page?: number;
  limit?: number;
};

export type ListBorrowerQueryParam = {
  isMember?: boolean;
} & ListQueryParams;

export type BorrowerProfile = {
  id: string;
  organizationId: string;
  memberId: string | null;
  name: string;
  phone: string | null;
  address: string | null;
  isMember: boolean;
  totalBorrowed: string;
  totalPaid: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  member: {
    id: string;
    fullName: string;
    memberNumber: string;
  } | null;
  _count?: {
    loans: number;
  };
};

export type LoanProfile = {
  id: string;
  organizationId: string;
  borrowerId: string;
  accountId: string;
  loanNumber: string;
  principal: string;
  interestRate: string;
  durationMonths: number;
  totalInterest: string;
  totalOwed: string;
  paidAmount: string;
  remainingAmount: string;
  loanDate: string;
  dueDate: string;
  status: LoanStatus;
  purpose: string | null;
  notes: string | null;
  cashTransactionId: string | null;
  recordedBy: string;
  verifiedBy: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  borrower: {
    id: string;
    name: string;
    phone: string | null;
    isMember: boolean;
    memberId: string | null;
  };
  account: {
    id: string;
    name: string;
  };
  recorder: {
    id: string;
    name: string;
  };
  verifier: {
    id: string;
    name: string;
  } | null;
  _count?: {
    payments: number;
  };
};

export type LoanDetailProfile = LoanProfile & {
  payments: LoanPaymentProfile[];
};

export type LoanPaymentProfile = {
  id: string;
  organizationId: string;
  loanId: string;
  amount: string;
  paymentDate: string;
  notes: string | null;
  status: LoanStatus;
  cashTransactionId: string | null;
  recordedBy: string;
  verifiedBy: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  recorder: {
    id: string;
    name: string;
  };
  verifier: {
    id: string;
    name: string;
  } | null;
};

export type LoanSummary = {
  totalActive: number;
  totalOutstanding: number;
  totalDisbursedThisMonth: number;
  pendingCount: number;
};

export type CreateLoanPayload = {
  borrowerId: string;
  accountId: string;
  principal: number;
  interestRate: number;
  durationMonths: number;
  loanDate: string;
  purpose?: string | null;
  notes?: string | null;
};

export type UpdateLoanPayload = Partial<CreateLoanPayload>;

export type VerifyLoanPayload = {
  action: "approve" | "reject";
  notes?: string | null;
};

export type CreateLoanPaymentPayload = {
  amount: number;
  paymentDate: string;
  notes?: string | null;
};

export type UpdateLoanPaymentPayload = Partial<CreateLoanPaymentPayload>;

export type CreateBorrowerPayload = {
  name: string;
  phone?: string | null;
  address?: string | null;
  memberId?: string | null;
  notes?: string | null;
};

export type BorrowerSearchResult = {
  id: string;
  name: string;
  phone: string | null;
  isMember: boolean;
  memberId: string | null;
};
