"use client";

import { useUserId } from "@/components/user-id-provider";
import { getBrowserClient } from "@/lib/supabase/client";
import { useAsync } from "@/lib/use-async";

/** 로그인한 사용자의 표시 이름·이메일. 비회원이면 user는 null. */
export function useAccount() {
  const { userId, ready } = useUserId();
  const { data: user } = useAsync(userId ? `me:${userId}` : null, async () => {
    const { data } = await getBrowserClient().auth.getUser();
    return data.user;
  });

  const displayName = user
    ? String(
        user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          user.user_metadata?.nickname ??
          user.email ??
          "회원",
      )
    : null;

  return { userId, ready, displayName, email: user?.email ?? null };
}
