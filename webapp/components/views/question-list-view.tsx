"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { EmptyState, ErrorState, LoadingState, Page, PageHeader, StatBar } from "@/components/page-state";
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
  // breadcrumb에 분야 이름을 쓰기 위한 조회. 실패해도 화면은 그대로 동작한다.
  const { data: field } = useAsync(`field-name:${fieldSlug}`, () =>
    fetchCategoryBySlug(getBrowserClient(), fieldSlug).catch(() => null),
  );

  useEffect(() => {
    if (mode !== "practice" || !data || data.questions.length === 0) return;
    const pick = data.questions[Math.floor(Math.random() * data.questions.length)];
    router.replace(`/categories/${fieldSlug}/${mode}/${topicSlug}/${pick.id}`);
  }, [data, mode, fieldSlug, topicSlug, router]);

  if (loading)
    return (
      <Page>
        <LoadingState />
      </Page>
    );
  if (error || !data)
    return (
      <Page>
        <ErrorState message="문제 목록을 불러오지 못했습니다." onRetry={reload} />
      </Page>
    );

  const modeLabel = mode === "study" ? "학습하기" : "문제풀기";
  const count = (difficulty: string) => data.questions.filter((q) => q.difficulty === difficulty).length;

  return (
    <Page>
      <PageHeader
        breadcrumb={[
          { href: "/", label: "홈" },
          { href: `/categories/${fieldSlug}`, label: field?.name ?? "분야" },
          { href: `/categories/${fieldSlug}/${mode}`, label: modeLabel },
          { label: data.topic.name },
        ]}
        title={data.topic.name}
        description={data.topic.description ?? undefined}
      />
      {data.questions.length === 0 ? (
        <EmptyState message="이 주제에는 아직 문제가 없습니다." />
      ) : mode === "practice" ? (
        <LoadingState rows={1} />
      ) : (
        <>
          <StatBar
            items={[
              { label: "전체 문제", value: data.questions.length },
              { label: "쉬움", value: count("easy") },
              { label: "보통", value: count("medium") },
              { label: "어려움", value: count("hard") },
            ]}
          />
          <div className="overflow-hidden rounded-xl border bg-card">
            <div
              aria-hidden
              className="hidden grid-cols-[48px_minmax(0,1fr)_72px_minmax(0,220px)_20px] gap-4 border-b bg-muted/60 px-5 py-2.5 font-mono text-xs text-muted-foreground md:grid"
            >
              <span>#</span>
              <span>문제</span>
              <span>난이도</span>
              <span>태그</span>
              <span />
            </div>
            <ol className="divide-y">
              {data.questions.map((question, index) => (
                <li key={question.id}>
                  <Link
                    href={`/categories/${fieldSlug}/${mode}/${topicSlug}/${question.id}`}
                    className="group grid grid-cols-[32px_minmax(0,1fr)_20px] items-center gap-x-4 gap-y-2 px-5 py-4 transition-colors hover:bg-accent/50 focus-visible:-outline-offset-2 md:grid-cols-[48px_minmax(0,1fr)_72px_minmax(0,220px)_20px]"
                  >
                    <span className="font-mono text-xs text-muted-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="line-clamp-2 min-w-0 text-sm leading-relaxed font-medium">{question.prompt}</span>
                    <ChevronRight
                      className="col-start-3 row-start-1 size-4 text-muted-foreground group-hover:text-primary md:col-start-5"
                      aria-hidden
                    />
                    <span className="col-start-2 row-start-2 md:col-start-3 md:row-start-1">
                      <DifficultyBadge difficulty={question.difficulty} />
                    </span>
                    <span className="col-start-2 row-start-3 flex min-w-0 flex-wrap gap-1 md:col-start-4 md:row-start-1">
                      {question.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="truncate rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </>
      )}
    </Page>
  );
}
