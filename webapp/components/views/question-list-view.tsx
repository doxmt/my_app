"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { EmptyState, ErrorState, LoadingState, PageTitle } from "@/components/page-state";
import { fetchCategoryBySlug, fetchQuestionsByCategory } from "@/lib/data/supabase-data";
import type { PracticeMode } from "@/lib/models";
import { getBrowserClient } from "@/lib/supabase/client";
import { useAsync } from "@/lib/use-async";

/**
 * 문제 목록. 학습하기는 주제의 문제를 전부 나열하고,
 * 문제풀기는 목록 없이 문제 하나를 무작위로 골라 상세 화면으로 바로 이동한다(뒤로 가면 주제 목록).
 */
export function QuestionListView({
  fieldSlug,
  mode,
  topicSlug,
}: {
  fieldSlug: string;
  mode: PracticeMode;
  topicSlug: string;
}) {
  const router = useRouter();
  const { data, error, loading, reload } = useAsync(`questions:${topicSlug}`, async () => {
    const client = getBrowserClient();
    const topic = await fetchCategoryBySlug(client, topicSlug);
    const questions = await fetchQuestionsByCategory(client, topic.id);
    return { topic, questions };
  });

  useEffect(() => {
    if (mode !== "practice" || !data || data.questions.length === 0) return;
    const pick = data.questions[Math.floor(Math.random() * data.questions.length)];
    router.replace(`/categories/${fieldSlug}/${mode}/${topicSlug}/${pick.id}`);
  }, [data, mode, fieldSlug, topicSlug, router]);

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message="문제 목록을 불러오지 못했습니다." onRetry={reload} />;

  return (
    <>
      <PageTitle>{data.topic.name}</PageTitle>
      {data.questions.length === 0 ? (
        <EmptyState message="이 주제에는 아직 문제가 없습니다." />
      ) : mode === "practice" ? (
        <LoadingState />
      ) : (
        <ul className="divide-y rounded-lg border">
          {data.questions.map((question) => (
            <li key={question.id}>
              <Link
                href={`/categories/${fieldSlug}/${mode}/${topicSlug}/${question.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50"
              >
                <span className="line-clamp-2 text-sm">{question.prompt}</span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
