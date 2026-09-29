"use client";

import { useEffect, useRef, useState } from "react";

type Result<T> = { key: string; reload: number; data?: T; error?: unknown };

/**
 * 비동기 조회 훅. `key`가 바뀌면 다시 조회하고, `null`이면 조회하지 않는다(대기 상태).
 * 공개 데이터 조회·로컬 저장소 읽기 같은 클라이언트 전용 조회에 쓴다.
 */
export function useAsync<T>(key: string | null, load: () => Promise<T>) {
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState<Result<T> | null>(null);

  useEffect(() => {
    if (key === null) return;
    let cancelled = false;
    Promise.resolve()
      .then(() => loadRef.current())
      .then(
        (data) => {
          if (!cancelled) setResult({ key, reload: reloadCount, data });
        },
        (error) => {
          if (!cancelled) setResult({ key, reload: reloadCount, error });
        },
      );
    return () => {
      cancelled = true;
    };
  }, [key, reloadCount]);

  const current = result && result.key === key && result.reload === reloadCount ? result : null;

  return {
    data: current?.data,
    error: current?.error,
    loading: current === null,
    reload: () => setReloadCount((count) => count + 1),
  };
}
