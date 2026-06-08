import { OrganizationStatus } from "@prisma/client";

export type Organization = {
  id: string;
  name: string;
  description: string;
  status: OrganizationStatus;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  deletedAt: Date;
};

export interface UserOrganization {
  id: string;
  userId: string;
  organizationId: string;
  status: OrganizationStatus;
  isLastActive: boolean;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  deletedAt: Date;
}
