"use client";

import { ChevronLeft, ChevronRight, Shuffle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { MicButton } from "@/components/mic-button";
import { ErrorState, LoadingState, Page, PageHeader } from "@/components/page-state";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUserId } from "@/components/user-id-provider";
import { cn } from "@/lib/utils";
import { getWrongNoteRepository } from "@/lib/data/repositories";
import { fetchCategoryBySlug, fetchChildCategories, fetchQuestionsByCategory } from "@/lib/data/supabase-data";
import type { PracticeMode, Question } from "@/lib/models";
import { type RandomScope, pickRandomEntry, randomEntriesOfTopic } from "@/lib/random-pick";
import { getBrowserClient } from "@/lib/supabase/client";
import { useAsync } from "@/lib/use-async";

/**
 * 문제 상세. 학습하기는 모범답안을 바로 보여주고,
 * 문제풀기는 답변 입력 → 모범답안 보기 → 자가 채점 → 오답노트 저장 순서로 진행한다.
 */
export function QuestionDetailView({
  fieldSlug,
  mode,
  topicSlug,
  questionId,
  randomScope = null,
}: {
  fieldSlug: string;
  mode: PracticeMode;
  topicSlug: string;
  questionId: string;
  /** 랜덤으로 진입했을 때의 범위(`?random=field|topic`). 학습하기에서만 "다음 랜덤 문제"에 쓴다. */
  randomScope?: RandomScope | null;
}) {
  const router = useRouter();
  const [pickingRandom, setPickingRandom] = useState(false);
  const [randomNotice, setRandomNotice] = useState<string | null>(null);
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

  const index = data.questions.findIndex((question) => question.id === questionId);
  if (index === -1)
    return (
      <Page>
        <p className="py-16 text-center text-sm">문제를 찾을 수 없습니다.</p>
      </Page>
    );

  const question = data.questions[index];
  const previousId = index > 0 ? data.questions[index - 1].id : null;
  const nextId = index < data.questions.length - 1 ? data.questions[index + 1].id : null;
  const goTo = (id: string) => router.replace(`/categories/${fieldSlug}/${mode}/${topicSlug}/${id}`);

  const modeLabel = mode === "study" ? "학습하기" : "문제풀기";
  // 주제 범위는 이 주제에 다른 문제가 있을 때만, 분야 범위는 누를 때 풀을 불러와 확인한다.
  const showNextRandom =
    mode === "study" && randomScope !== null && (randomScope === "field" || data.questions.length > 1);

  // 현재 문제를 뺀 범위 안에서 무작위로 골라 replace로 이동한다(뒤로 가기 기록이 쌓이지 않는다). 범위 쿼리는 유지한다.
  async function goToNextRandom() {
    if (pickingRandom || !randomScope || !data) return;
    setPickingRandom(true);
    setRandomNotice(null);
    try {
      let pool = randomEntriesOfTopic(topicSlug, data.questions);
      if (randomScope === "field") {
        const client = getBrowserClient();
        const fieldCategory = await fetchCategoryBySlug(client, fieldSlug);
        const topics = await fetchChildCategories(client, fieldCategory.id);
        const results = await Promise.all(topics.map((topic) => fetchQuestionsByCategory(client, topic.id)));
        pool = topics.flatMap((topic, i) => randomEntriesOfTopic(topic.slug, results[i]));
      }
      const pick = pickRandomEntry(pool, Math.random, questionId);
      if (!pick) {
        setRandomNotice("다른 문제가 없습니다.");
        return;
      }
      router.replace(`/categories/${fieldSlug}/${mode}/${pick.topicSlug}/${pick.questionId}?random=${randomScope}`);
    } catch {
      setRandomNotice("문제를 불러오지 못했습니다.");
    } finally {
      setPickingRandom(false);
    }
  }

  return (
    <Page>
      <PageHeader
        breadcrumb={[
          { href: "/", label: "홈" },
          { href: `/categories/${fieldSlug}`, label: field?.name ?? "분야" },
          { href: `/categories/${fieldSlug}/${mode}`, label: modeLabel },
          // 문제풀기의 문제 목록은 무작위 문제로 바로 이동하므로 학습하기에서만 링크한다.
          mode === "study"
            ? {
                href: `/categories/${fieldSlug}/${mode}/${topicSlug}`,
                label: data.topic.name,
              }
            : { label: data.topic.name },
          { label: `문제 ${index + 1}` },
        ]}
        title={`${data.topic.name} · 문제 ${index + 1}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
              {modeLabel}
            </span>
            <DifficultyBadge difficulty={question.difficulty} />
            {question.tags.map((tag) => (
              <span key={tag} className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                {tag}
              </span>
            ))}
          </span>
        }
        actions={
          <span className="font-mono text-sm text-muted-foreground">
            {index + 1} / {data.questions.length}
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start">
        <section aria-labelledby="question-heading" className="rounded-xl border bg-card p-6 lg:sticky lg:top-24">
          <h2 id="question-heading" className="mb-3 font-mono text-xs tracking-wider text-primary uppercase">
            Question
          </h2>
          <p className="text-lg leading-relaxed font-medium whitespace-pre-wrap">{question.prompt}</p>
        </section>

        <div>
          {mode === "study" ? (
            <ModelAnswer question={question} />
          ) : (
            // 문제가 바뀌면 입력·채점 상태를 초기화한다.
            <PracticeBody key={question.id} question={question} categoryId={data.topic.id} />
          )}
        </div>
      </div>

      <nav aria-label="문제 이동" className="mt-8 flex items-center justify-between border-t pt-6">
        <Button
          variant="outline"
          size="lg"
          disabled={previousId === null}
          onClick={() => previousId && goTo(previousId)}
        >
          <ChevronLeft aria-hidden />
          이전
        </Button>
        <span className="font-mono text-xs text-muted-foreground">
          {index + 1} / {data.questions.length}
        </span>
        <Button variant="outline" size="lg" disabled={nextId === null} onClick={() => nextId && goTo(nextId)}>
          다음
          <ChevronRight aria-hidden />
        </Button>
      </nav>
      {showNextRandom && (
        <div className="mt-4 flex flex-col items-center gap-2">
          <Button size="lg" className="w-full sm:w-auto" disabled={pickingRandom} onClick={goToNextRandom}>
            <Shuffle aria-hidden />
            다음 랜덤 문제
          </Button>
          {randomNotice && (
            <p role="status" className="text-sm text-muted-foreground">
              {randomNotice}
            </p>
          )}
        </div>
      )}
    </Page>
  );
}

function ModelAnswer({ question }: { question: Question }) {
  return (
    <section aria-labelledby="answer-heading" className="rounded-xl border border-l-4 border-l-primary bg-card p-6">
      <h2 id="answer-heading" className="mb-3 font-mono text-xs text-primary">
        모범답안
      </h2>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">
        {question.modelAnswer ?? "모범답안이 아직 없습니다."}
      </p>
    </section>
  );
}

function PracticeBody({ question, categoryId }: { question: Question; categoryId: string }) {
  const { userId } = useUserId();
  const [answer, setAnswer] = useState("");
  const [listening, setListening] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);

  async function saveToWrongNotes() {
    setSaveError(false);
    try {
      await getWrongNoteRepository(userId, getBrowserClient()).save({
        questionId: question.id,
        categoryId,
        questionPrompt: question.prompt,
        savedAt: new Date().toISOString(),
        isResolved: false,
        resolvedAt: null,
      });
      setSaved(true);
    } catch {
      setSaveError(true);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section aria-labelledby="my-answer-heading" className="rounded-xl border bg-card p-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="my-answer-heading" className="font-mono text-xs text-muted-foreground">
            내 답변
          </h2>
          <MicButton value={answer} onChange={setAnswer} disabled={revealed} onListeningChange={setListening} />
        </div>
        <Textarea
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          disabled={revealed}
          rows={10}
          aria-labelledby="my-answer-heading"
          className={cn("min-h-52 leading-relaxed", listening && "border-destructive ring-2 ring-destructive/30")}
          placeholder={listening ? "듣고 있어요. 말씀하세요…" : "답변을 입력하세요"}
        />
        {!revealed && (
          <div className="mt-4 flex justify-end">
            <Button size="lg" onClick={() => setRevealed(true)}>
              모범답안 보기
            </Button>
          </div>
        )}
      </section>
      {revealed && (
        <>
          <ModelAnswer question={question} />
          <section aria-labelledby="grade-heading" className="rounded-xl border bg-card p-6">
            <h2 id="grade-heading" className="mb-3 font-mono text-xs text-muted-foreground">
              자가 채점
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="lg"
                variant={isCorrect === true ? "default" : "secondary"}
                aria-pressed={isCorrect === true}
                onClick={() => setIsCorrect(true)}
              >
                정답
              </Button>
              <Button
                size="lg"
                variant={isCorrect === false ? "default" : "secondary"}
                aria-pressed={isCorrect === false}
                onClick={() => setIsCorrect(false)}
              >
                오답
              </Button>
              {isCorrect !== null && (
                <Button size="lg" className="ml-auto" onClick={saveToWrongNotes} disabled={saved}>
                  {saved ? "오답노트에 저장됨" : "오답노트에 저장"}
                </Button>
              )}
            </div>
            {saveError && (
              <p role="alert" className="mt-3 text-sm text-destructive">
                저장하지 못했습니다. 다시 시도해주세요.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
