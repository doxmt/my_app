"use client";

import { BookOpen, PencilLine } from "lucide-react";
import Link from "next/link";
import { ErrorState, LoadingState, PageTitle } from "@/components/page-state";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchCategoryBySlug } from "@/lib/data/supabase-data";
import { getBrowserClient } from "@/lib/supabase/client";
import { useAsync } from "@/lib/use-async";

/** 분야 화면. 학습하기 / 문제풀기 중 하나를 고른다. */
export function FieldView({ fieldSlug }: { fieldSlug: string }) {
  const { data, error, loading, reload } = useAsync(`category:${fieldSlug}`, () =>
    fetchCategoryBySlug(getBrowserClient(), fieldSlug),
  );

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message="분야를 불러오지 못했습니다." onRetry={reload} />;

  const modes = [
    { mode: "study", label: "학습하기", icon: BookOpen },
    { mode: "practice", label: "문제풀기", icon: PencilLine },
  ];

  return (
    <>
      <PageTitle>{data.name}</PageTitle>
      <div className="grid grid-cols-2 gap-3">
        {modes.map(({ mode, label, icon: Icon }) => (
          <Link key={mode} href={`/categories/${fieldSlug}/${mode}`}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader className="items-center py-6 text-center">
                <Icon className="mb-2 size-8 text-primary" aria-hidden />
                <CardTitle>{label}</CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
