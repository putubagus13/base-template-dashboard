// src/provider/user-provider.tsx
"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiClient, ApiError } from "@/lib/api-client";
import { useAuthStore } from "@/store/auth.store";
import type { AuthUser } from "@/types/auth";
import { UserStatus } from "@prisma/client";
import { useGlobalShareStore } from "@/store/global-share.store";
import { useMemberStatusType } from "@/hooks";

type ProfileResponse = {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  status: UserStatus;
  roles: {
    id: string;
    name: string;
    permissions: { id: string; action: string; subject: string }[];
  }[];
  activeOrganization?: AuthUser["activeOrganization"];
};

const profileQueryKey = ["auth", "profile"] as const;

/**
 * Maps the API profile response to the AuthUser shape used in Zustand.
 */
function mapToAuthUser(data: ProfileResponse): AuthUser {
  const roles = data.roles.map((r) => r.name);
  const permissions = data.roles.flatMap((r) =>
    r.permissions.map((p) => `${p.action}:${p.subject}`)
  );
  const uniquePermissions = [...new Set(permissions)];

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    avatar: data.avatar,
    status: data.status,
    roles,
    permissions: uniquePermissions,
    activeOrganization:
      data.activeOrganization ?? ({} as AuthUser["activeOrganization"]),
  };
}

function UserProviderInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const { setMemberStatusType } = useGlobalShareStore();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: profileQueryKey,
    queryFn: () => apiClient.get<ProfileResponse>("/api/profile"),
    // Refetch on window focus to keep user data fresh
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: (failureCount, err) => {
      if (err instanceof ApiError && err.status === 401) return false;
      return failureCount < 2;
    },
  });

  const { data: memberStatusTypeData } = useMemberStatusType();

  // Redirect to login on 401
  useEffect(() => {
    if (isError && error instanceof ApiError && error.status === 401) {
      useAuthStore.getState().clearUser();
      router.replace("/auth/login");
    } else if (isError) {
      // Generic error - clear store and redirect
      useAuthStore.getState().clearUser();
      router.replace("/auth/login");
    }
  }, [isError, error, router]);

  // Sync fetched profile into Zustand store
  useEffect(() => {
    if (data?.data) {
      const authUser = mapToAuthUser(data.data);
      setUser(authUser);
    }
  }, [data, setUser]);

  // Sync fetched member status type into Zustand store
  useEffect(() => {
    if (memberStatusTypeData) {
      setMemberStatusType(memberStatusTypeData.data || []);
    }
  }, [memberStatusTypeData, setMemberStatusType]);

  if (isLoading && !user) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
      </div>
    );
  }

  if (isError) {
    return null;
  }

  return <>{children}</>;
}

export default function UserProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <UserProviderInner>{children}</UserProviderInner>;
}
