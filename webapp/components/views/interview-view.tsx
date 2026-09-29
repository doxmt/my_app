"use client";

import { Send } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ErrorState, LoadingState, PageTitle } from "@/components/page-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserId } from "@/components/user-id-provider";
import { getResumeRepository } from "@/lib/data/repositories";
import { fetchTopLevelCategories } from "@/lib/data/supabase-data";
import { getDeviceId } from "@/lib/device-id";
import {
  fetchUsage,
  InterviewChatError,
  streamReply,
  type ChatAuth,
  type UsageStatus,
} from "@/lib/interview/chat-client";
import type { InterviewMessage, InterviewSession } from "@/lib/models";
import { readInterviewSession, writeInterviewSession } from "@/lib/storage/local-store";
import { getBrowserClient } from "@/lib/supabase/client";
import { useAsync } from "@/lib/use-async";

/** 모의면접 탭. 이력서가 없으면 입력을 유도하고, 있으면 분야·직무 선택 후 채팅으로 이어진다. */
export function InterviewView() {
  const { userId, ready } = useUserId();
  const { data, error, loading, reload } = useAsync(ready ? `interview-resume:${userId ?? "guest"}` : null, () =>
    getResumeRepository(userId, getBrowserClient()).fetch(),
  );

  return (
    <>
      <PageTitle>모의면접</PageTitle>
      {loading ? (
        <LoadingState />
      ) : error || data === undefined ? (
        <ErrorState message="이력서를 불러오지 못했습니다." onRetry={reload} />
      ) : data === null || data.text.trim() === "" ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-sm">모의면접을 시작하려면 이력서를 먼저 입력해주세요.</p>
          <Link href="/me/resume" className={buttonVariants()}>
            이력서 입력하기
          </Link>
        </div>
      ) : (
        <InterviewBody resumeText={data.text} />
      )}
    </>
  );
}

function InterviewBody({ resumeText }: { resumeText: string }) {
  const { userId } = useUserId();
  const { data, loading, reload } = useAsync(`interview-session:${userId ?? "guest"}`, async () => ({
    session: readInterviewSession(),
  }));

  if (loading || !data) return <LoadingState />;
  if (data.session === null) return <CategoryJobForm onStarted={reload} />;
  return (
    <ChatView
      // 새 면접을 시작하면 채팅 상태를 처음부터 다시 만든다.
      key={`${userId ?? "guest"}:${data.session.categorySlug}:${data.session.jobTitle}`}
      session={data.session}
      resumeText={resumeText}
      onNewInterview={() => {
        writeInterviewSession(null);
        reload();
      }}
    />
  );
}

function CategoryJobForm({ onStarted }: { onStarted: () => void }) {
  const [selected, setSelected] = useState<{ slug: string; name: string } | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const { data, error, loading, reload } = useAsync("interview-categories", () =>
    fetchTopLevelCategories(getBrowserClient()),
  );

  function start() {
    const title = jobTitle.trim();
    if (!selected || title === "") return;
    writeInterviewSession({ categorySlug: selected.slug, categoryName: selected.name, jobTitle: title, messages: [] });
    onStarted();
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm">지원 분야를 선택하세요</p>
        {loading ? (
          <LoadingState />
        ) : error || !data ? (
          <ErrorState message="분야 목록을 불러오지 못했습니다." onRetry={reload} />
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground">아직 등록된 분야가 없습니다.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.map((category) => (
              <Button
                key={category.id}
                variant={selected?.slug === category.slug ? "default" : "outline"}
                aria-pressed={selected?.slug === category.slug}
                onClick={() =>
                  setSelected(selected?.slug === category.slug ? null : { slug: category.slug, name: category.name })
                }
              >
                {category.name}
              </Button>
            ))}
          </div>
        )}
      </div>
      <div>
        <p className="mb-2 text-sm">지원 직무를 입력하세요</p>
        <Input value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} placeholder="예: 백엔드 개발자" />
      </div>
      <Button onClick={start}>면접 시작</Button>
    </div>
  );
}

function usageBannerText(usage: UsageStatus | null): string {
  if (usage === null) return "오늘 남은 면접 횟수를 확인하는 중입니다.";
  if (usage.kind === "guest") {
    return `오늘 남은 면접 횟수: ${usage.deviceRemaining}회 (네트워크 전체 ${usage.ipRemaining}회)`;
  }
  return `오늘 남은 면접 횟수: ${usage.remaining}회`;
}

function ChatView({
  session,
  resumeText,
  onNewInterview,
}: {
  session: InterviewSession;
  resumeText: string;
  onNewInterview: () => void;
}) {
  const { userId } = useUserId();
  const [messages, setMessages] = useState<InterviewMessage[]>(session.messages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [draftReply, setDraftReply] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingRetry, setPendingRetry] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageStatus | null>(null);
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 로그인 상태면 회원 액세스 토큰, 아니면 null. 세션을 구독하지 않고 요청 시점에 읽는다.
  async function getAuth(): Promise<ChatAuth> {
    const accessToken = userId
      ? ((await getBrowserClient().auth.getSession()).data.session?.access_token ?? null)
      : null;
    return { deviceId: getDeviceId(), accessToken };
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const initial = await fetchUsage(await getAuth());
        if (!cancelled) setUsage(initial);
      } catch {
        // 배너 초기값 조회 실패는 무시한다. 메시지 전송 시 다시 갱신된다.
      }
    })();
    return () => {
      cancelled = true;
    };
    // 마운트 시(회원/비회원별로 ChatView가 새로 만들어질 때) 한 번만 조회한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, draftReply]);

  function persist(next: InterviewMessage[]) {
    writeInterviewSession({ ...session, messages: next });
  }

  async function requestReply(userMessage: string, current: InterviewMessage[]) {
    setSending(true);
    setDraftReply("");
    setErrorMessage(null);
    setRateLimitMessage(null);
    setPendingRetry(null);

    let reply = "";
    try {
      await streamReply({
        auth: await getAuth(),
        categoryName: session.categoryName,
        jobTitle: session.jobTitle,
        resumeText,
        history: current.slice(0, -1),
        message: userMessage,
        onUsage: setUsage,
        onDelta: (text) => {
          reply += text;
          setDraftReply(reply);
        },
      });
      const next: InterviewMessage[] = [
        ...current,
        { role: "assistant", content: reply, createdAt: new Date().toISOString() },
      ];
      setMessages(next);
      persist(next);
    } catch (error) {
      if (error instanceof InterviewChatError && error.code === "rate_limited") {
        setRateLimitMessage(error.message);
        if (error.usage) setUsage(error.usage);
      } else {
        setErrorMessage(error instanceof InterviewChatError ? error.message : "면접 답변 생성에 실패했습니다.");
        setPendingRetry(userMessage);
      }
    } finally {
      setSending(false);
      setDraftReply("");
    }
  }

  async function submit() {
    const text = input.trim();
    if (text === "" || sending) return;
    const next: InterviewMessage[] = [...messages, { role: "user", content: text, createdAt: new Date().toISOString() }];
    setMessages(next);
    setInput("");
    persist(next);
    await requestReply(text, next);
  }

  const blocked = rateLimitMessage !== null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2 rounded-lg bg-muted px-3 py-2 text-sm">
        <span>{usageBannerText(usage)}</span>
        <Button variant="ghost" size="sm" onClick={onNewInterview}>
          새 면접 시작
        </Button>
      </div>
      {rateLimitMessage && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {rateLimitMessage}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {messages.length === 0 && !sending ? (
          <p className="py-12 text-center text-sm text-muted-foreground">첫 메시지를 보내 면접을 시작하세요.</p>
        ) : (
          <>
            {messages.map((message, index) => (
              <Bubble key={index} role={message.role} content={message.content} />
            ))}
            {sending && <Bubble role="assistant" content={draftReply} />}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {errorMessage && (
        <div className="flex items-center justify-between gap-2 text-sm text-destructive">
          <span>{errorMessage}</span>
          {pendingRetry && (
            <Button variant="ghost" size="sm" onClick={() => requestReply(pendingRetry, messages)}>
              다시 시도
            </Button>
          )}
        </div>
      )}

      <form
        className="sticky bottom-14 flex gap-2 bg-background py-2 md:bottom-0"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={sending || blocked}
          placeholder="메시지를 입력하세요"
        />
        <Button type="submit" size="icon" aria-label="보내기" disabled={sending || blocked}>
          <Send aria-hidden />
        </Button>
      </form>
    </div>
  );
}

function Bubble({ role, content }: { role: InterviewMessage["role"]; content: string }) {
  const isUser = role === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <p
        className={`max-w-[75%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        }`}
      >
        {content === "" ? "..." : content}
      </p>
    </div>
  );
}
