"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { EmptyState, ErrorState, LoadingState, PageTitle } from "@/components/page-state";
import { Button } from "@/components/ui/button";
import { useUserId } from "@/components/user-id-provider";
import { getWrongNoteRepository } from "@/lib/data/repositories";
import { getBrowserClient } from "@/lib/supabase/client";
import { useAsync } from "@/lib/use-async";

/** 오답노트. 목록, 해결 처리 토글, 삭제, 문제 상세로 이동. */
export function WrongNotesView() {
  const { userId, ready } = useUserId();
  const { data, error, loading, reload } = useAsync(ready ? `wrong-notes:${userId ?? "guest"}` : null, () =>
    getWrongNoteRepository(userId, getBrowserClient()).fetchAll(),
  );

  async function mutate(action: () => Promise<void>) {
    try {
      await action();
    } finally {
      reload();
    }
  }

  return (
    <>
      <PageTitle>오답노트</PageTitle>
      {loading ? (
        <LoadingState />
      ) : error || !data ? (
        <ErrorState message="오답노트를 불러오지 못했습니다." onRetry={reload} />
      ) : data.length === 0 ? (
        <EmptyState message="아직 저장된 오답노트가 없습니다." />
      ) : (
        <ul className="divide-y rounded-lg border">
          {data.map((note) => (
            <li key={note.questionId} className="flex items-center gap-3 px-4 py-3">
              <Link href={`/me/wrong-notes/${note.questionId}`} className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm">{note.questionPrompt}</p>
                <p className="text-xs text-muted-foreground">{note.isResolved ? "해결됨" : "미해결"}</p>
              </Link>
              <input
                type="checkbox"
                aria-label="해결 처리"
                className="size-5"
                checked={note.isResolved}
                onChange={(event) =>
                  mutate(() =>
                    getWrongNoteRepository(userId, getBrowserClient()).setResolved(
                      note.questionId,
                      event.target.checked,
                    ),
                  )
                }
              />
              <Button
                variant="ghost"
                size="icon"
                aria-label="삭제"
                onClick={() =>
                  mutate(() => getWrongNoteRepository(userId, getBrowserClient()).delete(note.questionId))
                }
              >
                <Trash2 aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
