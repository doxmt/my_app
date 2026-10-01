"use client";

import { Check } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

const QUESTION = "배열과 연결 리스트의 차이를 설명하고 각각 어떤 상황에 적합한지 말해보세요.";

const STEPS = [
  {
    no: "01",
    title: "답변 작성",
    body: "문제를 읽고 내 말로 먼저 답변을 씁니다.",
    demo: "배열은 연속된 메모리에 저장되고, 연결 리스트는 포인터로 노드를 잇습니다.",
    typeSpeed: 34,
  },
  {
    no: "02",
    title: "모범답안 비교",
    body: "공개된 모범답안과 내 답변을 비교합니다.",
    demo: "모범답안: 접근은 배열 O(1), 삽입·삭제는 연결 리스트가 유리",
    typeSpeed: 22,
  },
  {
    no: "03",
    title: "자가 채점",
    body: "정답·오답을 표시하고 오답노트에 저장합니다.",
    demo: "오답으로 표시 → 오답노트에 저장했습니다",
    typeSpeed: 30,
  },
] as const;

const QUESTION_SPEED = 28;

function subscribeReducedMotion(onChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/** 모션을 줄이는 설정이면 true. 서버 렌더에서는 false(애니메이션 시작 상태)로 둔다. */
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

/** 타이핑 중인 글 끝의 깜빡이는 커서. */
function Caret() {
  return <span aria-hidden className="ml-0.5 inline-block h-[1em] w-px translate-y-[2px] animate-pulse bg-primary" />;
}

/**
 * 히어로 카드 안의 데모. 질문이 타이핑되고, 세 단계가 차례로 켜지며 각 단계의 예시가 나타난다.
 * 켜진 단계는 마지막까지 유지되다가 질문이 다시 타이핑될 때 초기화되어 반복한다.
 * 화면 읽기 프로그램에는 움직이지 않는 전체 문구를 sr-only로 따로 제공한다.
 */
export function PracticeDemo() {
  const reduced = usePrefersReducedMotion();
  const [questionLen, setQuestionLen] = useState(0);
  const [active, setActive] = useState(-1);
  const [demoLen, setDemoLen] = useState(0);
  const [doneCount, setDoneCount] = useState(0);

  useEffect(() => {
    if (reduced) return;
    let cancelled = false;
    const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

    async function type(length: number, speed: number, set: (value: number) => void) {
      for (let i = 1; i <= length; i += 1) {
        if (cancelled) return;
        set(i);
        await sleep(speed);
      }
    }

    async function run() {
      while (!cancelled) {
        setQuestionLen(0);
        setActive(-1);
        setDemoLen(0);
        setDoneCount(0);
        await sleep(600);
        await type(QUESTION.length, QUESTION_SPEED, setQuestionLen);
        await sleep(500);
        for (let index = 0; index < STEPS.length; index += 1) {
          if (cancelled) return;
          setActive(index);
          setDemoLen(0);
          await type(STEPS[index].demo.length, STEPS[index].typeSpeed, setDemoLen);
          await sleep(900);
          setDoneCount(index + 1);
        }
        setActive(-1);
        await sleep(2600);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [reduced]);

  // 모션 감소: 움직임 없이 완성된 화면
  const shownQuestion = reduced ? QUESTION : QUESTION.slice(0, questionLen);
  const questionTyping = !reduced && questionLen < QUESTION.length;

  return (
    <div className="p-5">
      <div className="sr-only">
        <p>Q. {QUESTION}</p>
        <ol>
          {STEPS.map((step) => (
            <li key={step.no}>
              {step.title}: {step.body}
            </li>
          ))}
        </ol>
      </div>

      <div aria-hidden>
        <p className="font-mono text-xs text-primary">Q.</p>
        {/* 보이지 않는 전체 문구로 높이를 고정하고, 그 위에 타이핑되는 글을 겹친다. */}
        <div className="relative mt-1 text-[15px] leading-relaxed font-medium">
          <p className="invisible">{QUESTION}</p>
          <p className="absolute inset-0">
            {shownQuestion}
            {questionTyping && <Caret />}
          </p>
        </div>

        <ol className="mt-5 space-y-1 border-t pt-4">
          {STEPS.map((step, index) => {
            const isActive = !reduced && active === index;
            const isDone = reduced ? false : doneCount > index;
            // 완료된 단계는 입력된 내용과 파란 배경을 그대로 유지하고, 다음 반복에서 질문이 다시 타이핑될 때 함께 초기화된다.
            const highlighted = isActive || isDone;
            const demoText = isActive ? step.demo.slice(0, demoLen) : isDone ? step.demo : null;
            return (
              <li
                key={step.no}
                className={cn(
                  "-mx-2 flex gap-3 rounded-md px-2 py-2 transition-colors duration-300",
                  highlighted && "bg-accent",
                )}
              >
                <span
                  className={cn(
                    "w-5 shrink-0 font-mono text-xs leading-6 text-primary transition-all",
                    isActive && "font-bold",
                  )}
                >
                  {isDone ? <Check className="mt-1.5 size-3.5" strokeWidth={3} /> : step.no}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-sm font-semibold transition-colors", highlighted && "text-accent-foreground")}>
                    {step.title}
                  </span>
                  <span className="block min-h-5 truncate text-sm text-muted-foreground">
                    {demoText !== null ? (
                      <span className="text-foreground">
                        {demoText}
                        {isActive && <Caret />}
                      </span>
                    ) : (
                      step.body
                    )}
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
