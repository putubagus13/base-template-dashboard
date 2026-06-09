import { ListQueryParams } from ".";

export type ListMemberQueryParam = {
  statusId?: string;
  isActive?: boolean;
} & ListQueryParams;
