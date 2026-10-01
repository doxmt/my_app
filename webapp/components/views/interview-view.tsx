"use client";

import { FileText, Send } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MicButton } from "@/components/mic-button";
import { Breadcrumb, ErrorState, LoadingState, Page, PageHeader } from "@/components/page-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserId } from "@/components/user-id-provider";
import { cn } from "@/lib/utils";
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

function SetupShell({ children }: { children: React.ReactNode }) {
  return (
    <Page>
      <PageHeader
        breadcrumb={[{ href: "/", label: "홈" }, { label: "모의면접" }]}
        title="모의면접"
        description="이력서를 바탕으로 AI 면접관과 대화하며 실전처럼 연습합니다."
      />
      {children}
    </Page>
  );
}

/** 모의면접. 이력서가 없으면 입력을 유도하고, 있으면 분야·직무 선택 후 채팅 워크스페이스로 이어진다. */
export function InterviewView() {
  const { userId, ready } = useUserId();
  const { data, error, loading, reload } = useAsync(ready ? `interview-resume:${userId ?? "guest"}` : null, () =>
    getResumeRepository(userId, getBrowserClient()).fetch(),
  );

  if (loading)
    return (
      <SetupShell>
        <LoadingState rows={2} />
      </SetupShell>
    );
  if (error || data === undefined)
    return (
      <SetupShell>
        <ErrorState message="이력서를 불러오지 못했습니다." onRetry={reload} />
      </SetupShell>
    );
  if (data === null || data.text.trim() === "")
    return (
      <SetupShell>
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-xl border border-dashed bg-card py-14 text-center">
          <FileText className="size-7 text-muted-foreground" aria-hidden />
          <p className="text-sm">모의면접을 시작하려면 이력서를 먼저 입력해주세요.</p>
          <Link href="/me/resume?next=/interview" className={buttonVariants()}>
            이력서 입력하기
          </Link>
        </div>
      </SetupShell>
    );
  return <InterviewBody resumeText={data.text} />;
}

function InterviewBody({ resumeText }: { resumeText: string }) {
  const { userId } = useUserId();
  const { data, loading, reload } = useAsync(`interview-session:${userId ?? "guest"}`, async () => ({
    session: readInterviewSession(),
  }));

  if (loading || !data)
    return (
      <SetupShell>
        <LoadingState rows={2} />
      </SetupShell>
    );
  if (data.session === null)
    return (
      <SetupShell>
        <CategoryJobForm onStarted={reload} />
      </SetupShell>
    );
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
  const [selected, setSelected] = useState<{
    slug: string;
    name: string;
  } | null>(null);
  const [jobTitle, setJobTitle] = useState("");
  const { data, error, loading, reload } = useAsync("interview-categories", () =>
    fetchTopLevelCategories(getBrowserClient()),
  );

  function start() {
    const title = jobTitle.trim();
    if (!selected || title === "") return;
    writeInterviewSession({
      categorySlug: selected.slug,
      categoryName: selected.name,
      jobTitle: title,
      messages: [],
    });
    onStarted();
  }

  return (
    <div className="flex max-w-2xl flex-col gap-8 rounded-xl border bg-card p-6 lg:p-8">
      <section aria-labelledby="field-heading">
        <h2 id="field-heading" className="mb-3 text-sm font-semibold">
          <span className="mr-2 font-mono text-primary">01</span>지원 분야를 선택하세요
        </h2>
        {loading ? (
          <LoadingState rows={2} />
        ) : error || !data ? (
          <ErrorState message="분야 목록을 불러오지 못했습니다." onRetry={reload} />
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground">아직 등록된 분야가 없습니다.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.map((category) => (
              <Button
                key={category.id}
                size="lg"
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
      </section>
      <section aria-labelledby="job-heading">
        <h2 id="job-heading" className="mb-3 text-sm font-semibold">
          <span className="mr-2 font-mono text-primary">02</span>지원 직무를 입력하세요
        </h2>
        <Input
          aria-labelledby="job-heading"
          className="h-10"
          value={jobTitle}
          onChange={(event) => setJobTitle(event.target.value)}
          placeholder="예: 백엔드 개발자"
        />
      </section>
      <div className="flex justify-end">
        <Button size="lg" onClick={start}>
          면접 시작
        </Button>
      </div>
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
  const [listening, setListening] = useState(false);
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
        {
          role: "assistant",
          content: reply,
          createdAt: new Date().toISOString(),
        },
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
    const next: InterviewMessage[] = [
      ...messages,
      { role: "user", content: text, createdAt: new Date().toISOString() },
    ];
    setMessages(next);
    setInput("");
    persist(next);
    await requestReply(text, next);
  }

  const blocked = rateLimitMessage !== null;

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-4 py-4 sm:px-6 lg:grid lg:h-[calc(100dvh-4rem)] lg:min-h-[520px] lg:grid-cols-[minmax(0,1fr)_300px] lg:grid-rows-[auto_minmax(0,1fr)] lg:gap-x-6 lg:px-8 lg:py-5">
      <div className="lg:col-span-2">
        <Breadcrumb items={[{ href: "/", label: "홈" }, { label: "모의면접" }]} />
        <h1 className="-mt-1 text-xl font-semibold tracking-tight">
          모의면접{" "}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {session.categoryName} · {session.jobTitle}
          </span>
        </h1>
      </div>
      <section
        aria-label="면접 대화"
        className="order-2 flex min-h-[60dvh] flex-col overflow-clip rounded-xl border bg-card lg:order-none lg:min-h-0"
      >
        <div
          role="log"
          aria-live="off"
          aria-busy={sending}
          tabIndex={0}
          className="flex flex-1 flex-col gap-5 p-5 lg:overflow-y-auto lg:p-6"
        >
          {messages.length === 0 && !sending ? (
            <p className="m-auto py-12 text-center text-sm text-muted-foreground">
              첫 메시지를 보내 면접을 시작하세요.
            </p>
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
          <div
            role="alert"
            className="flex items-center justify-between gap-2 border-t bg-destructive/10 px-5 py-2 text-sm text-destructive"
          >
            <span>{errorMessage}</span>
            {pendingRetry && (
              <Button variant="ghost" size="sm" onClick={() => requestReply(pendingRetry, messages)}>
                다시 시도
              </Button>
            )}
          </div>
        )}

        <form
          className="sticky bottom-[3.75rem] flex gap-2 border-t bg-card p-3 lg:static"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <Input
            className={cn("h-10", listening && "border-destructive ring-2 ring-destructive/30")}
            aria-label="메시지"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            disabled={sending || blocked}
            placeholder={listening ? "듣고 있어요. 말씀하세요…" : "메시지를 입력하세요"}
          />
          <MicButton
            value={input}
            onChange={setInput}
            disabled={sending || blocked}
            onListeningChange={setListening}
          />
          <Button type="submit" size="icon-lg" className="size-10" aria-label="보내기" disabled={sending || blocked}>
            <Send aria-hidden />
          </Button>
        </form>
      </section>

      <aside aria-label="면접 정보" className="order-1 flex flex-col gap-4 lg:order-none lg:overflow-y-auto">
        <div className="rounded-xl border bg-card p-5">
          <h2 className="mb-3 font-mono text-xs tracking-wider text-muted-foreground uppercase">Session</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">분야</dt>
              <dd className="min-w-0 truncate font-medium">{session.categoryName}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">직무</dt>
              <dd className="min-w-0 truncate font-medium">{session.jobTitle}</dd>
            </div>
          </dl>
          <Button variant="outline" className="mt-4 w-full" onClick={onNewInterview}>
            새 면접 시작
          </Button>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <h2 className="mb-2 font-mono text-xs tracking-wider text-muted-foreground uppercase">Usage</h2>
          <p role="status" className="text-sm">
            {usageBannerText(usage)}
          </p>
        </div>
        {rateLimitMessage && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {rateLimitMessage}
          </p>
        )}
      </aside>
    </div>
  );
}

function Bubble({ role, content }: { role: InterviewMessage["role"]; content: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
      <span className="font-mono text-[11px] text-muted-foreground">{isUser ? "나" : "면접관"}</span>
      <p
        className={`max-w-[85%] rounded-lg px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap xl:max-w-[75%] ${
          isUser ? "bg-primary text-primary-foreground" : "border bg-muted"
        }`}
      >
        {content === "" ? "..." : content}
      </p>
    </div>
  );
}
