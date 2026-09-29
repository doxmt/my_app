"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErrorState, LoadingState, PageTitle } from "@/components/page-state";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUserId } from "@/components/user-id-provider";
import { getWrongNoteRepository } from "@/lib/data/repositories";
import { fetchCategoryBySlug, fetchQuestionsByCategory } from "@/lib/data/supabase-data";
import type { PracticeMode, Question } from "@/lib/models";
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
}: {
  fieldSlug: string;
  mode: PracticeMode;
  topicSlug: string;
  questionId: string;
}) {
  const router = useRouter();
  const { data, error, loading, reload } = useAsync(`questions:${topicSlug}`, async () => {
    const client = getBrowserClient();
    const topic = await fetchCategoryBySlug(client, topicSlug);
    const questions = await fetchQuestionsByCategory(client, topic.id);
    return { topic, questions };
  });

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message="문제를 불러오지 못했습니다." onRetry={reload} />;

  const index = data.questions.findIndex((question) => question.id === questionId);
  if (index === -1) return <p className="py-16 text-center text-sm">문제를 찾을 수 없습니다.</p>;

  const question = data.questions[index];
  const previousId = index > 0 ? data.questions[index - 1].id : null;
  const nextId = index < data.questions.length - 1 ? data.questions[index + 1].id : null;
  const goTo = (id: string) => router.replace(`/categories/${fieldSlug}/${mode}/${topicSlug}/${id}`);

  return (
    <>
      <PageTitle>{mode === "study" ? "학습하기" : "문제풀기"}</PageTitle>
      <p className="mb-6 font-medium whitespace-pre-wrap">{question.prompt}</p>
      {mode === "study" ? (
        <ModelAnswer question={question} />
      ) : (
        // 문제가 바뀌면 입력·채점 상태를 초기화한다.
        <PracticeBody key={question.id} question={question} categoryId={data.topic.id} />
      )}
      <div className="mt-8 flex justify-between">
        <Button variant="outline" disabled={previousId === null} onClick={() => previousId && goTo(previousId)}>
          이전
        </Button>
        <Button variant="outline" disabled={nextId === null} onClick={() => nextId && goTo(nextId)}>
          다음
        </Button>
      </div>
    </>
  );
}

function ModelAnswer({ question }: { question: Question }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold">모범답안</h2>
      <p className="text-sm whitespace-pre-wrap">{question.modelAnswer ?? "모범답안이 아직 없습니다."}</p>
    </section>
  );
}

function PracticeBody({ question, categoryId }: { question: Question; categoryId: string }) {
  const { userId } = useUserId();
  const [answer, setAnswer] = useState("");
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
      <Textarea
        value={answer}
        onChange={(event) => setAnswer(event.target.value)}
        disabled={revealed}
        rows={6}
        placeholder="답변을 입력하세요"
      />
      {!revealed ? (
        <Button onClick={() => setRevealed(true)}>모범답안 보기</Button>
      ) : (
        <>
          <ModelAnswer question={question} />
          <section>
            <h2 className="mb-2 text-sm font-semibold">자가 채점</h2>
            <div className="flex gap-2">
              <Button variant={isCorrect === true ? "default" : "secondary"} onClick={() => setIsCorrect(true)}>
                정답
              </Button>
              <Button variant={isCorrect === false ? "default" : "secondary"} onClick={() => setIsCorrect(false)}>
                오답
              </Button>
            </div>
          </section>
          {isCorrect !== null && (
            <div>
              <Button onClick={saveToWrongNotes} disabled={saved}>
                {saved ? "오답노트에 저장됨" : "오답노트에 저장"}
              </Button>
              {saveError && <p className="mt-2 text-sm text-destructive">저장하지 못했습니다. 다시 시도해주세요.</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
