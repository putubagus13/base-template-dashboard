// src/types/dues.ts
// ============================================================
// DUES (IURAN ANGGOTA) TYPES
// ============================================================

import { DuesAgendaType, DuesPaymentStatus } from "@prisma/client";
import { ListQueryParams } from ".";

export type ListDuesAgendaQueryParam = {
  type?: DuesAgendaType;
  isActive?: boolean;
  periodMonth?: number;
  periodYear?: number;
} & ListQueryParams;

export type DuesAgendaRateProfile = {
  id: string;
  duesAgendaId: string;
  memberStatusTypeId: string;
  amount: number;
  effectiveDate: Date;
  createdAt: Date;
  updatedAt: Date;
  memberStatusType: {
    id: string;
    name: string;
    color: string | null;
  };
};

export type DuesAgendaProfile = {
  id: string;
  organizationId: string;
  title: string;
  description: string | null;
  type: DuesAgendaType;
  amount: number | null;
  periodMonth: number | null;
  periodYear: number | null;
  dueDate: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  rates?: DuesAgendaRateProfile[];
  _count?: {
    payments: number;
    rates: number;
  };
  _summary?: DuesPaymentSummary;
};

export type DuesPaymentSummary = {
  totalMembers: number;
  paid: number;
  unpaid: number;
  totalCollected: number;
};

export type MemberDuesPaymentProfile = {
  id: string;
  duesAgendaId: string;
  memberId: string;
  amount: number;
  paidAmount: number;
  status: DuesPaymentStatus;
  paidAt: Date | null;
  notes: string | null;
  cashTransactionId: string | null;
  createdAt: Date;
  updatedAt: Date;
  member: {
    id: string;
    fullName: string;
    memberNumber: string;
    status?: {
      id: string;
      name: string;
      color: string | null;
    } | null;
  };
};

export type CreateDuesAgendaPayload = {
  title: string;
  description?: string | null;
  type: DuesAgendaType;
  amount?: number | null;
  periodMonth?: number | null;
  periodYear?: number | null;
  dueDate?: string | null;
  rates?: Array<{
    memberStatusTypeId: string;
    amount: number;
    effectiveDate: string;
  }>;
};

export type UpdateDuesAgendaPayload = {
  title?: string;
  description?: string | null;
  type?: DuesAgendaType;
  amount?: number | null;
  periodMonth?: number | null;
  periodYear?: number | null;
  dueDate?: string | null;
  isActive?: boolean;
  rates?: Array<{
    memberStatusTypeId: string;
    amount: number;
    effectiveDate: string;
  }>;
};

export type PayDuesPaymentPayload = {
  accountId: string;
  transactionDate: string;
  categoryId?: string | null;
  notes?: string | null;
};
