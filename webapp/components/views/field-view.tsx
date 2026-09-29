"use client";

import { ArrowRight, BookOpen, PencilLine } from "lucide-react";
import Link from "next/link";
import { ErrorState, LoadingState, Page, PageHeader } from "@/components/page-state";
import { fetchCategoryBySlug } from "@/lib/data/supabase-data";
import { getBrowserClient } from "@/lib/supabase/client";
import { useAsync } from "@/lib/use-async";

const MODES = [
  {
    mode: "study",
    label: "학습하기",
    icon: BookOpen,
    hint: "주제별 문제와 모범답안을 바로 읽으며 개념을 정리합니다.",
    points: ["문제 목록에서 원하는 문제 선택", "모범답안을 바로 확인", "이전·다음으로 이어서 학습"],
  },
  {
    mode: "practice",
    label: "문제풀기",
    icon: PencilLine,
    hint: "직접 답변을 쓰고, 모범답안과 비교해 자가 채점합니다.",
    points: ["주제를 고르거나 전체 랜덤 선택", "답변 작성 후 모범답안 공개", "오답은 오답노트에 저장"],
  },
];

/** 분야 화면. 학습하기 / 문제풀기 중 하나를 고른다. */
export function FieldView({ fieldSlug }: { fieldSlug: string }) {
  const { data, error, loading, reload } = useAsync(`category:${fieldSlug}`, () =>
    fetchCategoryBySlug(getBrowserClient(), fieldSlug),
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
        <ErrorState message="분야를 불러오지 못했습니다." onRetry={reload} />
      </Page>
    );

  return (
    <Page>
      <PageHeader
        breadcrumb={[{ href: "/", label: "홈" }, { label: data.name }]}
        title={data.name}
        description={data.description ?? "학습 방식을 선택하세요."}
      />
      <h2 className="mb-4 text-sm font-semibold text-muted-foreground">학습 방식 선택</h2>
      <ul className="grid gap-5 md:grid-cols-2">
        {MODES.map(({ mode, label, icon: Icon, hint, points }) => (
          <li key={mode}>
            <Link
              href={`/categories/${fieldSlug}/${mode}`}
              className="interactive-surface group flex h-full flex-col rounded-xl border bg-card p-7"
            >
              <span className="grid size-12 place-items-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="size-6" aria-hidden />
              </span>
              <h3 className="mt-5 text-xl font-semibold">{label}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{hint}</p>
              <ul className="mt-5 flex-1 space-y-1.5 text-sm">
                {points.map((point) => (
                  <li key={point} className="flex gap-2">
                    <span aria-hidden className="font-mono text-primary">
                      {">"}
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
              <span className="mt-6 flex items-center gap-1 text-sm font-medium text-primary">
                시작하기
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Page>
  );
}
