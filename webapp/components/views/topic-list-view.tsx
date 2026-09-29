"use client";

import { ArrowRight, Shuffle, Tag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EmptyState, ErrorState, LoadingState, Page, PageHeader, StatBar } from "@/components/page-state";
import { fetchCategoryBySlug, fetchChildCategories, fetchQuestionsByCategory } from "@/lib/data/supabase-data";
import type { Category, PracticeMode } from "@/lib/models";
import { getBrowserClient } from "@/lib/supabase/client";
import { useAsync } from "@/lib/use-async";

/**
 * 주제 목록. 문제풀기에서는 맨 앞에 "전체 랜덤" 카드를 추가로 보여준다.
 * 이 카드를 누르면 분야의 모든 주제 문제를 합쳐 하나를 무작위로 골라 상세 화면으로 이동한다.
 */
export function TopicListView({ fieldSlug, mode }: { fieldSlug: string; mode: PracticeMode }) {
  const router = useRouter();
  const [picking, setPicking] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const { data, error, loading, reload } = useAsync(`topics:${fieldSlug}`, async () => {
    const client = getBrowserClient();
    const field = await fetchCategoryBySlug(client, fieldSlug);
    return { field, topics: await fetchChildCategories(client, field.id) };
  });

  async function pickGlobalRandom(topics: Category[]) {
    if (picking) return;
    setPicking(true);
    setNotice(null);
    try {
      const client = getBrowserClient();
      const results = await Promise.all(topics.map((topic) => fetchQuestionsByCategory(client, topic.id)));
      const pool = topics.flatMap((topic, index) =>
        results[index].map((question) => ({
          topicSlug: topic.slug,
          questionId: question.id,
        })),
      );
      if (pool.length === 0) {
        setNotice("아직 문제가 없습니다.");
        return;
      }
      const pick = pool[Math.floor(Math.random() * pool.length)];
      router.push(`/categories/${fieldSlug}/${mode}/${pick.topicSlug}/${pick.questionId}`);
    } catch {
      setNotice("문제를 불러오지 못했습니다.");
    } finally {
      setPicking(false);
    }
  }

  const modeLabel = mode === "study" ? "학습하기" : "문제풀기";

  return (
    <Page>
      <PageHeader
        breadcrumb={[
          { href: "/", label: "홈" },
          {
            href: `/categories/${fieldSlug}`,
            label: data?.field.name ?? "분야",
          },
          { label: modeLabel },
        ]}
        title={`${data?.field.name ?? ""} ${modeLabel}`.trim()}
        description={
          mode === "study"
            ? "주제를 선택해 문제와 모범답안을 읽어보세요."
            : "주제를 선택하거나 전체 랜덤으로 문제를 풀어보세요."
        }
      />
      {loading ? (
        <LoadingState rows={6} />
      ) : error || !data ? (
        <ErrorState message="주제 목록을 불러오지 못했습니다." onRetry={reload} />
      ) : data.topics.length === 0 ? (
        <EmptyState message="아직 등록된 주제가 없습니다." />
      ) : (
        <>
          <StatBar
            items={[
              { label: "주제", value: `${data.topics.length}개` },
              { label: "방식", value: modeLabel },
            ]}
          />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mode === "practice" && (
              <li>
                <button
                  type="button"
                  disabled={picking}
                  onClick={() => pickGlobalRandom(data.topics)}
                  className="interactive-surface flex h-full min-h-28 w-full flex-col items-start justify-between gap-3 rounded-xl border-2 border-dashed border-primary/50 bg-accent/40 p-5 text-left disabled:opacity-60"
                >
                  <Shuffle className="size-6 text-primary" aria-hidden />
                  <span>
                    <span className="block font-semibold">{picking ? "고르는 중..." : "전체 랜덤"}</span>
                    <span className="block text-sm text-muted-foreground">모든 주제에서 무작위 1문제</span>
                  </span>
                </button>
              </li>
            )}
            {data.topics.map((topic) => (
              <li key={topic.id}>
                <Link
                  href={`/categories/${fieldSlug}/${mode}/${topic.slug}`}
                  className="interactive-surface group flex h-full min-h-28 flex-col justify-between gap-3 rounded-xl border bg-card p-5"
                >
                  <span className="flex items-start justify-between">
                    <Tag className="size-5 text-primary" aria-hidden />
                    <ArrowRight
                      className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary"
                      aria-hidden
                    />
                  </span>
                  <span>
                    <span className="line-clamp-2 block font-semibold">{topic.name}</span>
                    {topic.description && (
                      <span className="mt-0.5 line-clamp-1 block text-sm text-muted-foreground">
                        {topic.description}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {notice && (
            <p role="status" className="mt-4 text-sm text-muted-foreground">
              {notice}
            </p>
          )}
        </>
      )}
    </Page>
  );
}
