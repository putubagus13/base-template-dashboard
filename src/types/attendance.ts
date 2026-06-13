// src/types/attendance.ts
// ============================================================
// ATTENDANCE & MEETING TYPES
// ============================================================

import { AttendanceStatus, MeetingStatus } from "@prisma/client";
import { ListQueryParams } from ".";

export type ListMeetingQueryParam = {
  status?: MeetingStatus;
  meetingTypeId?: string;
  dateFrom?: string;
  dateTo?: string;
} & ListQueryParams;

export type ListMeetingTypeQueryParam = ListQueryParams;

export type ListAttendanceLeaderboardParam = {
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
};

export type MeetingTypeProfile = {
  id: string;
  organizationId: string;
  name: string;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: { meetings: number };
};

export type MeetingProfile = {
  id: string;
  organizationId: string;
  meetingTypeId: string;
  title: string;
  description: string | null;
  scheduledAt: Date;
  status: MeetingStatus;
  discussionNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  meetingType: { id: string; name: string; color: string | null };
  _count?: { attendances: number };
};

export type MeetingSummary = {
  total: number;
  incomingTotal: number;
  liveTotal: number;
  doneTotal: number;
};

export type AttendanceProfile = {
  id: string;
  meetingId: string;
  memberId: string;
  status: AttendanceStatus;
  points: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  member: {
    id: string;
    fullName: string;
    memberNumber: string;
  };
};

export type AttendancePointConfigProfile = {
  id: string;
  organizationId: string;
  status: AttendanceStatus;
  points: number;
  createdAt: Date;
  updatedAt: Date;
};

export type BulkAttendanceInput = {
  memberId: string;
  status: AttendanceStatus;
  notes?: string | null;
};

export type AttendanceLeaderboardEntry = {
  memberId: string;
  fullName: string;
  memberNumber: string;
  totalHadir: number;
  totalPoints: number;
};
