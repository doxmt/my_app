"use client";

import { ErrorState, LoadingState, Page, PageHeader } from "@/components/page-state";
import { fetchQuestionById } from "@/lib/data/supabase-data";
import { getBrowserClient } from "@/lib/supabase/client";
import { useAsync } from "@/lib/use-async";

/** 오답노트에서 들어온 문제 리뷰. 학습하기처럼 모범답안을 바로 보여준다. */
export function QuestionReviewView({ questionId }: { questionId: string }) {
  const { data, error, loading, reload } = useAsync(`question:${questionId}`, () =>
    fetchQuestionById(getBrowserClient(), questionId),
  );

  if (loading)
    return (
      <Page>
        <LoadingState rows={2} />
      </Page>
    );
  if (error || !data)
    return (
      <Page>
        <ErrorState message="문제를 불러오지 못했습니다." onRetry={reload} />
      </Page>
    );

  return (
    <Page>
      <PageHeader
        breadcrumb={[
          { href: "/", label: "홈" },
          { href: "/me/wrong-notes", label: "오답노트" },
          { label: "문제 복습" },
        ]}
        title="문제 복습"
        description="문제와 모범답안을 함께 보며 다시 정리하세요."
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start">
        <section aria-labelledby="question-heading" className="rounded-xl border bg-card p-6 lg:sticky lg:top-24">
          <h2 id="question-heading" className="mb-3 font-mono text-xs tracking-wider text-primary uppercase">
            Question
          </h2>
          <p className="text-lg leading-relaxed font-medium whitespace-pre-wrap">{data.prompt}</p>
        </section>
        <section aria-labelledby="answer-heading" className="rounded-xl border border-l-4 border-l-primary bg-card p-6">
          <h2 id="answer-heading" className="mb-3 font-mono text-xs text-primary">
            모범답안
          </h2>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {data.modelAnswer ?? "모범답안이 아직 없습니다."}
          </p>
        </section>
      </div>
    </Page>
  );
}
