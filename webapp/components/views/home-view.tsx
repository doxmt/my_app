"use client";

import { ArrowRight, MessagesSquare, PencilLine } from "lucide-react";
import Link from "next/link";
import { CategoryIcon } from "@/components/category-icon";
import { EmptyState, ErrorState, LoadingState, Page } from "@/components/page-state";
import { PracticeDemo } from "@/components/practice-demo";
import { buttonVariants } from "@/components/ui/button";
import { fetchTopLevelCategories } from "@/lib/data/supabase-data";
import { getBrowserClient } from "@/lib/supabase/client";
import { useAsync } from "@/lib/use-async";

const FEATURES = ["서술형 문제풀이", "자가 채점 · 오답노트", "이력서 기반 AI 모의면접"];

function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden border-b bg-card">
      <div aria-hidden className="bg-grid absolute inset-0" />
      <Page className="relative grid gap-10 py-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center lg:py-20">
        <div>
          <p className="mb-4 font-mono text-sm text-primary">{"// 개발자 기술면접 준비"}</p>
          <h1 id="hero-title" className="text-4xl leading-tight font-bold tracking-tight lg:text-5xl">
            답변을 직접 써보고,
            <br />
            면접처럼 점검하세요.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
            분야별 서술형 문제로 개념을 정리하고, 내 이력서를 바탕으로 한 AI 모의면접으로 실전 감각을 익힙니다.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/#fields"
              className={buttonVariants({
                size: "lg",
                className: "h-11 px-5 text-[15px]",
              })}
            >
              <PencilLine aria-hidden />
              문제풀이 시작
            </Link>
            <Link
              href="/interview"
              className={buttonVariants({
                variant: "outline",
                size: "lg",
                className: "h-11 px-5 text-[15px]",
              })}
            >
              <MessagesSquare aria-hidden />
              모의면접 시작
            </Link>
          </div>
          <ul className="mt-8 flex flex-wrap gap-2" aria-label="서비스 특징">
            {FEATURES.map((feature) => (
              <li
                key={feature}
                className="rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground"
              >
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="overflow-hidden rounded-xl border bg-background shadow-sm" aria-label="문제풀이 진행 방식">
          <div className="flex items-center gap-1.5 border-b bg-muted/60 px-4 py-2.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-border" />
            <span className="size-2.5 rounded-full bg-border" />
            <span className="size-2.5 rounded-full bg-border" />
            <span className="ml-3 font-mono text-xs text-muted-foreground">practice.md</span>
          </div>
          <PracticeDemo />
        </div>
      </Page>
    </section>
  );
}

/** 홈: 짧은 소개 히어로 + 분야 카드 그리드. */
export function HomeView() {
  const { data, error, loading, reload } = useAsync("categories", () => fetchTopLevelCategories(getBrowserClient()));

  return (
    <>
      <Hero />
      <section id="fields" aria-labelledby="fields-title" className="scroll-mt-16">
        <Page>
          <div className="mb-6 flex items-end justify-between gap-3">
            <div>
              <h2 id="fields-title" className="text-2xl font-semibold tracking-tight">
                분야 선택
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">준비할 기술 분야를 고르세요.</p>
            </div>
            {data && data.length > 0 && <p className="font-mono text-sm text-muted-foreground">{data.length} fields</p>}
          </div>
          {loading ? (
            <LoadingState rows={6} />
          ) : error || !data ? (
            <ErrorState message="분야 목록을 불러오지 못했습니다." onRetry={reload} />
          ) : data.length === 0 ? (
            <EmptyState message="아직 등록된 분야가 없습니다." />
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/categories/${category.slug}`}
                    className="interactive-surface group flex h-full flex-col rounded-xl border bg-card p-6"
                  >
                    <span className="grid size-12 place-items-center rounded-lg bg-accent text-accent-foreground">
                      <CategoryIcon slug={category.slug} className="size-6" />
                    </span>
                    <h3 className="mt-5 text-lg font-semibold">{category.name}</h3>
                    <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                      {category.description ?? "분야별 서술형 문제"}
                    </p>
                    <div className="mt-5 flex items-center justify-between border-t pt-4">
                      <span className="flex gap-1.5 text-xs text-muted-foreground">
                        <span className="rounded bg-muted px-1.5 py-0.5">학습하기</span>
                        <span className="rounded bg-muted px-1.5 py-0.5">문제풀기</span>
                      </span>
                      <ArrowRight
                        className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary"
                        aria-hidden
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Page>
      </section>
    </>
  );
}
