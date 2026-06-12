import { ListQueryParams } from ".";

export type ListDonorQueryParam = {
  isMember?: boolean;
  dateFrom?: string;
  dateTo?: string;
} & ListQueryParams;
