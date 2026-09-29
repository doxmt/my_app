"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { migrateIfNeeded } from "@/lib/auth/migration";
import { createMigrationGateway } from "@/lib/data/supabase-data";
import {
  getBrowserStorage,
  readResume,
  readWrongNotes,
  writeResume,
  writeWrongNotes,
} from "@/lib/storage/local-store";
import { createClient } from "@/lib/supabase/client";

type UserIdState = {
  /** 로그인한 회원의 id. 비회원이거나, 로그인 직후 로컬→DB 이전이 끝나기 전에는 null. */
  userId: string | null;
  /** 첫 인증 상태 확인이 끝났는가. false인 동안에는 데이터를 읽지 않는다(비회원→회원 깜빡임 방지). */
  ready: boolean;
};

const UserIdContext = createContext<UserIdState>({ userId: null, ready: false });

export function useUserId(): UserIdState {
  return useContext(UserIdContext);
}

const migratedFlagKey = (userId: string) => `local_data_migrated_${userId}`;

const flags = {
  isMigrated(userId: string) {
    try {
      return getBrowserStorage()?.getItem(migratedFlagKey(userId)) === "true";
    } catch {
      return false;
    }
  },
  markMigrated(userId: string) {
    try {
      getBrowserStorage()?.setItem(migratedFlagKey(userId), "true");
    } catch {
      // 다음 로그인 때 다시 확인한다.
    }
  },
};

const local = {
  readWrongNotes: () => readWrongNotes(),
  deleteWrongNote: (questionId: string) =>
    writeWrongNotes(readWrongNotes().filter((note) => note.questionId !== questionId)),
  readResume: () => readResume(),
  clearResume: () => writeResume(null),
};

/**
 * `userId` 하나만 노출한다(Session 객체를 구독하지 않는다 - 토큰 갱신마다 화면이 다시 그려지는 것을 막는다).
 * 로그인 직후에는 로컬→DB 이전이 끝날 때까지 null을 유지해, 이전 도중 회원 데이터로 전환되지 않게 한다.
 */
export function UserIdProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UserIdState>({ userId: null, ready: false });
  const currentUserId = useRef<string | null>(null);
  const migratingUserId = useRef<string | null>(null);
  const latestAuthUserId = useRef<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const publish = (userId: string | null) => {
      currentUserId.current = userId;
      setState((prev) => (prev.ready && prev.userId === userId ? prev : { userId, ready: true }));
    };

    const handle = async (event: string, userId: string | null) => {
      if (userId === null) {
        publish(null);
        return;
      }

      if (migratingUserId.current === userId) return; // 이전이 진행 중이면 끝날 때까지 null 유지
      const needsMigrationCheck = event === "SIGNED_IN" || event === "INITIAL_SESSION";
      if (!needsMigrationCheck || flags.isMigrated(userId) || currentUserId.current === userId) {
        publish(userId);
        return;
      }

      migratingUserId.current = userId;
      publish(null);
      await migrateIfNeeded(userId, {
        gateway: createMigrationGateway(supabase),
        local,
        flags,
      });
      migratingUserId.current = null;
      // 이전 도중 로그아웃·계정 전환이 있었다면 그 결과를 따른다.
      if (latestAuthUserId.current === userId) publish(userId);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUserId = session?.user.id ?? null;
      latestAuthUserId.current = nextUserId;
      // 콜백 안에서 Supabase 호출을 기다리면 교착될 수 있어 다음 틱으로 미룬다.
      setTimeout(() => void handle(event, nextUserId), 0);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo(() => state, [state]);
  return <UserIdContext.Provider value={value}>{children}</UserIdContext.Provider>;
}
