// src/hooks/index.ts
// ============================================================
// HOOKS EXPORTS
// ============================================================

export {
  useLogin,
  useRegister,
  useLogout,
  useForgotPassword,
  useResetPassword,
} from "./use-auth";
export {
  useUsers,
  useUser,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  userKeys,
} from "./use-users";
export {
  useRoles,
  usePermissions as usePermissionsData,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  roleKeys,
} from "./use-roles";
export {
  useProfile,
  useUpdateProfile,
  useChangePassword,
  profileKeys,
} from "./use-profile";
export {
  useHasPermission,
  useHasAnyPermission,
  useHasAllPermissions,
  useHasRole,
  useHasAnyRole,
  useIsSuperAdmin,
  usePermissions,
} from "./use-permission";
export { useDebounce } from "./use-debounce";
export { useDisclosure } from "./use-disclosure";
export { useLocalStorage } from "./use-local-storage";
export { useMembers, memberKeys, useDeleteMember } from "./use-members";
export {
  useMemberStatusType,
  memberStatusTypeKeys,
} from "./use-member-status-type";
