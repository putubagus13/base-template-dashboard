import { ListQueryParams } from ".";
import { TransactionStatus, TransactionType } from "@prisma/client";

export type ListCashTransactionQueryParam = {
  type?: TransactionType;
  accountId?: string;
  categoryId?: string;
  verificationStatus?: TransactionStatus;
  dateFrom?: string;
  dateTo?: string;
} & ListQueryParams;
