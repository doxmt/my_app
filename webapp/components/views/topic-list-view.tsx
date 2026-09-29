"use client";

import { Shuffle, Tag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EmptyState, ErrorState, LoadingState, PageTitle } from "@/components/page-state";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
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
    return fetchChildCategories(client, field.id);
  });

  async function pickGlobalRandom(topics: Category[]) {
    if (picking) return;
    setPicking(true);
    setNotice(null);
    try {
      const client = getBrowserClient();
      const results = await Promise.all(topics.map((topic) => fetchQuestionsByCategory(client, topic.id)));
      const pool = topics.flatMap((topic, index) =>
        results[index].map((question) => ({ topicSlug: topic.slug, questionId: question.id })),
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

  return (
    <>
      <PageTitle>{mode === "study" ? "학습하기" : "문제풀기"}</PageTitle>
      {loading ? (
        <LoadingState />
      ) : error || !data ? (
        <ErrorState message="주제 목록을 불러오지 못했습니다." onRetry={reload} />
      ) : data.length === 0 ? (
        <EmptyState message="아직 등록된 주제가 없습니다." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {mode === "practice" && (
              <button type="button" disabled={picking} onClick={() => pickGlobalRandom(data)} className="text-left">
                <Card className="h-full transition-colors hover:bg-muted/50">
                  <CardHeader className="items-center py-6 text-center">
                    <Shuffle className="mb-2 size-8 text-primary" aria-hidden />
                    <CardTitle>{picking ? "고르는 중..." : "전체 랜덤"}</CardTitle>
                  </CardHeader>
                </Card>
              </button>
            )}
            {data.map((topic) => (
              <Link key={topic.id} href={`/categories/${fieldSlug}/${mode}/${topic.slug}`}>
                <Card className="h-full transition-colors hover:bg-muted/50">
                  <CardHeader className="items-center py-6 text-center">
                    <Tag className="mb-2 size-8 text-primary" aria-hidden />
                    <CardTitle className="line-clamp-2">{topic.name}</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
          {notice && <p className="mt-4 text-center text-sm text-muted-foreground">{notice}</p>}
        </>
      )}
    </>
  );
}
