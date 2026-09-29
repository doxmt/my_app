"use client";

import Link from "next/link";
import { CategoryIcon } from "@/components/category-icon";
import { EmptyState, ErrorState, LoadingState, PageTitle } from "@/components/page-state";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchTopLevelCategories } from "@/lib/data/supabase-data";
import { getBrowserClient } from "@/lib/supabase/client";
import { useAsync } from "@/lib/use-async";

/** 홈 탭 본문. 최상위 분야 목록. */
export function HomeView() {
  const { data, error, loading, reload } = useAsync("categories", () =>
    fetchTopLevelCategories(getBrowserClient()),
  );

  return (
    <>
      <PageTitle>홈</PageTitle>
      {loading ? (
        <LoadingState />
      ) : error || !data ? (
        <ErrorState message="분야 목록을 불러오지 못했습니다." onRetry={reload} />
      ) : data.length === 0 ? (
        <EmptyState message="아직 등록된 분야가 없습니다." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {data.map((category) => (
            <Link key={category.id} href={`/categories/${category.slug}`}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CategoryIcon slug={category.slug} className="mb-2 size-8 text-primary" />
                  <CardTitle className="truncate">{category.name}</CardTitle>
                  {category.description && (
                    <CardDescription className="line-clamp-2">{category.description}</CardDescription>
                  )}
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
