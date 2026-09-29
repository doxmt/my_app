"use client";

import { ErrorState, LoadingState, PageTitle } from "@/components/page-state";
import { fetchQuestionById } from "@/lib/data/supabase-data";
import { getBrowserClient } from "@/lib/supabase/client";
import { useAsync } from "@/lib/use-async";

/** 오답노트에서 들어온 문제 리뷰. 학습하기처럼 모범답안을 바로 보여준다. */
export function QuestionReviewView({ questionId }: { questionId: string }) {
  const { data, error, loading, reload } = useAsync(`question:${questionId}`, () =>
    fetchQuestionById(getBrowserClient(), questionId),
  );

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message="문제를 불러오지 못했습니다." onRetry={reload} />;

  return (
    <>
      <PageTitle>문제</PageTitle>
      <p className="mb-6 font-medium whitespace-pre-wrap">{data.prompt}</p>
      <h2 className="mb-2 text-sm font-semibold">모범답안</h2>
      <p className="text-sm whitespace-pre-wrap">{data.modelAnswer ?? "모범답안이 아직 없습니다."}</p>
    </>
  );
}
