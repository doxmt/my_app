"use client";

import { Trash2 } from "lucide-react";
import Link from "next/link";
import { MeLayout } from "@/components/me-layout";
import { EmptyState, ErrorState, LoadingState, StatBar } from "@/components/page-state";
import { Button, buttonVariants } from "@/components/ui/button";
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

  const unresolved = data ? data.filter((note) => !note.isResolved).length : 0;

  return (
    <MeLayout title="오답노트" description="틀린 문제를 모아 다시 복습하세요. 해결한 문제는 체크해 두세요.">
      {loading ? (
        <LoadingState rows={2} />
      ) : error || !data ? (
        <ErrorState message="오답노트를 불러오지 못했습니다." onRetry={reload} />
      ) : data.length === 0 ? (
        <EmptyState
          message="아직 저장된 오답노트가 없습니다."
          action={
            <Link href="/" className={buttonVariants({ variant: "outline" })}>
              문제풀이 하러 가기
            </Link>
          }
        />
      ) : (
        <>
          <StatBar
            items={[
              { label: "전체", value: data.length },
              { label: "미해결", value: unresolved },
              { label: "해결됨", value: data.length - unresolved },
            ]}
          />
          <div className="overflow-hidden rounded-xl border bg-card">
            <div
              aria-hidden
              className="hidden grid-cols-[minmax(0,1fr)_88px_72px_48px] gap-4 border-b bg-muted/60 px-5 py-2.5 font-mono text-xs text-muted-foreground md:grid"
            >
              <span>문제</span>
              <span>상태</span>
              <span>해결</span>
              <span />
            </div>
            <ul className="divide-y">
              {data.map((note) => (
                <li
                  key={note.questionId}
                  className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-4 gap-y-1 px-5 py-3.5 hover:bg-accent/30 md:grid-cols-[minmax(0,1fr)_88px_72px_48px]"
                >
                  <Link
                    href={`/me/wrong-notes/${note.questionId}`}
                    className="col-span-3 min-w-0 rounded text-sm leading-relaxed hover:text-primary md:col-span-1"
                  >
                    <span className="line-clamp-2">{note.questionPrompt}</span>
                  </Link>
                  <span
                    className={`col-start-1 row-start-2 text-xs font-medium md:col-start-auto md:row-start-auto ${
                      note.isResolved ? "text-success" : "text-muted-foreground"
                    }`}
                  >
                    {note.isResolved ? "해결됨" : "미해결"}
                  </span>
                  <input
                    type="checkbox"
                    aria-label="해결 처리"
                    className="size-5 cursor-pointer accent-primary"
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
          </div>
        </>
      )}
    </MeLayout>
  );
}
