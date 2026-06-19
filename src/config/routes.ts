// src/config/routes.ts
// ============================================================
// ROUTE CONFIGURATION
// Single source of truth untuk semua route aplikasi.
// ============================================================

export const ROUTES = {
  // Auth
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    forgotPassword: "/auth/forgot-password",
    resetPassword: "/auth/reset-password",
    verifyEmail: "/auth/verify-email",
  },

  // Dashboard
  dashboard: {
    home: "/dashboard",
    users: "/dashboard/users",
    roles: "/dashboard/roles",
    auditLogs: "/dashboard/audit-logs",
    profile: "/dashboard/profile",
    settings: "/dashboard/settings",
    cashAccounts: "/dashboard/finance/cash-accounts",
    transactionCategories: "/dashboard/finance/categories",
    transactions: "/dashboard/finance/transactions",
    donors: "/dashboard/finance/donors",
    donations: "/dashboard/finance/donations",
    financeSummary: "/dashboard/finance/summary",
    // Dues (Iuran Anggota)
    duesAgendas: "/dashboard/finance/dues",
    duesAgendaDetail: (id: string) => `/dashboard/finance/dues/${id}`,
    // Attendance
    meetings: "/dashboard/attendance/meetings",
    meetingDetail: (id: string) => `/dashboard/attendance/meetings/${id}`,
    meetingTypes: "/dashboard/attendance/meeting-types",
    attendancePointConfig: "/dashboard/attendance/point-config",
    attendanceLeaderboard: "/dashboard/attendance/leaderboard",
  },

  // API
  api: {
    auth: {
      login: "/api/auth/login",
      register: "/api/auth/register",
      logout: "/api/auth/logout",
      refresh: "/api/auth/refresh",
      forgotPassword: "/api/auth/forgot-password",
      resetPassword: "/api/auth/reset-password",
      verifyEmail: "/api/auth/verify-email",
      validateInvitation: "/api/auth/validate-invitation",
    },
    users: "/api/users",
    user: (id: string) => `/api/users/${id}`,
    roles: "/api/roles",
    role: (id: string) => `/api/roles/${id}`,
    permissions: "/api/roles/permissions",
    profile: "/api/profile",
    changePassword: "/api/profile/change-password",
    auditLogs: "/api/audit-logs",
    member: "/api/members",
    memberStatusType: "/api/member-status-type",
    cashAccounts: "/api/cash-accounts",
    cashAccount: (id: string) => `/api/cash-accounts/${id}`,
    transactionCategories: "/api/transaction-categories",
    transactionCategory: (id: string) => `/api/transaction-categories/${id}`,
    cashTransactions: "/api/cash-transactions",
    cashTransaction: (id: string) => `/api/cash-transactions/${id}`,
    cashTransactionVerify: (id: string) =>
      `/api/cash-transactions/${id}/verify`,
    donors: "/api/donors",
    donor: (id: string) => `/api/donors/${id}`,
    donorLeaderboard: "/api/donors/leaderboard",
    financeSummary: "/api/finance/summary",
    financeExport: "/api/finance/export",
    memberSearch: "/api/members/search",
    memberExport: "/api/members/export",
    // Meeting
    meetingTypes: "/api/meeting-types",
    meetingType: (id: string) => `/api/meeting-types/${id}`,
    meetings: "/api/meetings",
    meeting: (id: string) => `/api/meetings/${id}`,
    meetingAttendance: (meetingId: string) =>
      `/api/meetings/${meetingId}/attendance`,
    // Attendance
    attendancePointConfig: "/api/attendance-point-config",
    attendanceLeaderboard: "/api/attendance/leaderboard",
    // Dues (Iuran Anggota)
    duesAgendas: "/api/dues-agendas",
    duesAgenda: (id: string) => `/api/dues-agendas/${id}`,
    duesAgendaGeneratePayments: (id: string) =>
      `/api/dues-agendas/${id}/generate-payments`,
    memberDuesPayments: (agendaId: string) =>
      `/api/dues-agendas/${agendaId}/payments`,
    memberDuesPayment: (id: string) => `/api/member-dues-payments/${id}`,
    memberDuesPaymentPay: (id: string) => `/api/member-dues-payments/${id}/pay`,
  },
} as const;

// Public routes (no auth required)
export const PUBLIC_ROUTES = Object.values(ROUTES.auth);

// Public API routes
export const PUBLIC_API_ROUTES = Object.values(ROUTES.api.auth);
