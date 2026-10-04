"use client";

import { FileText, Send } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MicButton } from "@/components/mic-button";
import { Breadcrumb, ErrorState, LoadingState, Page, PageHeader } from "@/components/page-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUserId } from "@/components/user-id-provider";
import { cn } from "@/lib/utils";
import { getResumeRepository } from "@/lib/data/repositories";
import { getDeviceId } from "@/lib/device-id";
import {
  fetchUsage,
  InterviewChatError,
  streamReply,
  type ChatAuth,
  type UsageStatus,
} from "@/lib/interview/chat-client";
import type { InterviewMessage, InterviewSession } from "@/lib/models";
import { readOpenAiConsent, writeOpenAiConsent } from "@/lib/openai-consent";
import { MAX_SELF_INTRODUCTION_CHARS } from "@/lib/resume/self-intro";
import { getBrowserStorage, readInterviewSession, writeInterviewSession } from "@/lib/storage/local-store";
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
  return <InterviewBody resumeText={data.text} selfIntroduction={data.selfIntroduction} />;
}

function InterviewBody({ resumeText, selfIntroduction }: { resumeText: string; selfIntroduction: string }) {
  const { userId } = useUserId();
  // 시작 화면에서 "자기소개로 시작하기"를 고른 직후에만 채워지는 첫 메시지. 메모리에만 두어 재진입 때는 자동 호출되지 않는다.
  const [pendingFirstMessage, setPendingFirstMessage] = useState<string | null>(null);
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
        <JobSetupForm
          selfIntroduction={selfIntroduction}
          onStarted={(firstMessage) => {
            setPendingFirstMessage(firstMessage);
            reload();
          }}
        />
      </SetupShell>
    );
  return (
    <ChatView
      // 새 면접을 시작하면 채팅 상태를 처음부터 다시 만든다.
      key={`${userId ?? "guest"}:${data.session.jobTitle}`}
      session={data.session}
      resumeText={resumeText}
      pendingFirstMessage={pendingFirstMessage}
      onFirstMessageConsumed={() => setPendingFirstMessage(null)}
      onNewInterview={() => {
        writeInterviewSession(null);
        reload();
      }}
    />
  );
}

const MAX_JOB_POSTING_CHARS = 3000;

function JobSetupForm({
  selfIntroduction,
  onStarted,
}: {
  /** 이력서에 저장된 자기소개. "자기소개로 시작하기"의 입력칸 초기값. */
  selfIntroduction: string;
  /** 자기소개로 시작했으면 그 자기소개(첫 사용자 메시지), 아니면 null. */
  onStarted: (firstMessage: string | null) => void;
}) {
  const [jobTitle, setJobTitle] = useState("");
  const [jobPosting, setJobPosting] = useState("");
  const [startWithIntro, setStartWithIntro] = useState(false);
  const [intro, setIntro] = useState(selfIntroduction);
  const [introError, setIntroError] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);

  function start() {
    const title = jobTitle.trim();
    if (title === "") return;
    const firstMessage = intro.trim();
    if (startWithIntro && firstMessage === "") {
      setIntroError(true);
      return;
    }
    // OpenAI(미국) 전송 동의 전에는 시작하지 않는다. 한 번 동의하면 다시 묻지 않는다.
    if (!readOpenAiConsent(getBrowserStorage())) {
      setConsentOpen(true);
      return;
    }
    begin();
  }

  function agreeAndStart() {
    writeOpenAiConsent(getBrowserStorage());
    setConsentOpen(false);
    begin();
  }

  function begin() {
    const title = jobTitle.trim();
    const firstMessage = intro.trim();
    // 자기소개로 시작하면 자기소개가 첫 사용자 메시지가 된다. 면접관 응답은 채팅 화면이 한 번만 요청한다.
    writeInterviewSession({
      jobTitle: title,
      jobPosting: jobPosting.trim(),
      messages: startWithIntro
        ? [{ role: "user", content: firstMessage, createdAt: new Date().toISOString() }]
        : [],
    });
    onStarted(startWithIntro ? firstMessage : null);
  }

  return (
    <div className="flex max-w-2xl flex-col gap-8 rounded-xl border bg-card p-6 lg:p-8">
      <section aria-labelledby="job-heading">
        <h2 id="job-heading" className="mb-3 text-sm font-semibold">
          <span className="mr-2 font-mono text-primary">01</span>지원 직무를 입력하세요
        </h2>
        <Input
          aria-labelledby="job-heading"
          className="h-10"
          value={jobTitle}
          onChange={(event) => setJobTitle(event.target.value)}
          placeholder="예: 백엔드 개발자"
        />
      </section>
      <section aria-labelledby="posting-heading">
        <h2 id="posting-heading" className="mb-1 text-sm font-semibold">
          <span className="mr-2 font-mono text-primary">02</span>회사 채용공고
          <span className="ml-2 text-xs font-normal text-muted-foreground">(선택)</span>
        </h2>
        <p className="mb-3 text-xs text-muted-foreground">
          채용공고를 붙여넣으면 요구 역량과 우대사항에 맞춰 질문해요.
        </p>
        <Textarea
          aria-labelledby="posting-heading"
          value={jobPosting}
          onChange={(event) => setJobPosting(event.target.value)}
          maxLength={MAX_JOB_POSTING_CHARS}
          rows={8}
          className="min-h-40 leading-relaxed"
          placeholder="채용공고 텍스트를 붙여넣으세요."
        />
        <p className="mt-1 text-right font-mono text-xs text-muted-foreground">
          {jobPosting.length} / {MAX_JOB_POSTING_CHARS}
        </p>
      </section>
      <section aria-labelledby="intro-heading">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 size-4"
            checked={startWithIntro}
            onChange={(event) => {
              setStartWithIntro(event.target.checked);
              setIntroError(false);
            }}
          />
          <span>
            <span id="intro-heading" className="block text-sm font-semibold">
              <span className="mr-2 font-mono text-primary">03</span>자기소개로 시작하기
              <span className="ml-2 text-xs font-normal text-muted-foreground">(선택)</span>
            </span>
            <span className="block text-xs text-muted-foreground">
              자기소개를 첫 답변으로 보내고, 면접관이 그 내용에서 꼬리 질문을 해요.
            </span>
          </span>
        </label>
        {startWithIntro && (
          <div className="mt-3">
            <Textarea
              aria-label="자기소개"
              value={intro}
              onChange={(event) => {
                setIntro(event.target.value);
                setIntroError(false);
              }}
              maxLength={MAX_SELF_INTRODUCTION_CHARS}
              rows={6}
              className="min-h-32 leading-relaxed"
              placeholder="자기소개를 입력하세요."
              aria-invalid={introError}
            />
            <div className="mt-1 flex justify-between gap-2">
              <p role={introError ? "alert" : undefined} className="text-xs text-destructive">
                {introError ? "자기소개를 입력해 주세요." : ""}
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                {intro.length} / {MAX_SELF_INTRODUCTION_CHARS}
              </p>
            </div>
          </div>
        )}
      </section>
      {consentOpen && (
        <section
          role="alertdialog"
          aria-labelledby="consent-heading"
          aria-describedby="consent-body"
          className="rounded-lg border border-primary/40 bg-muted/50 p-4"
        >
          <h2 id="consent-heading" className="mb-2 text-sm font-semibold">
            AI 모의면접 데이터 전송 동의
          </h2>
          <p id="consent-body" className="text-sm leading-relaxed">
            모의면접에서 입력한 이력서·채용공고·자기소개·대화가 AI 응답 생성을 위해 OpenAI(미국)로 전송됩니다.
            비회원의 이력서·대화 기록은 기기에만 저장됩니다. 동의하지 않으면 모의면접은 이용할 수 없지만 문제풀이 등
            다른 기능은 그대로 이용할 수 있습니다.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            자세한 내용은{" "}
            <Link href="/privacy" target="_blank" className="underline underline-offset-2 hover:text-foreground">
              개인정보처리방침
            </Link>
            과{" "}
            <Link href="/terms" target="_blank" className="underline underline-offset-2 hover:text-foreground">
              이용약관
            </Link>
            을 확인하세요.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConsentOpen(false)}>
              동의하지 않음
            </Button>
            <Button onClick={agreeAndStart}>동의하고 시작</Button>
          </div>
        </section>
      )}
      {!consentOpen && (
        <div className="flex justify-end">
          <Button size="lg" onClick={start}>
            면접 시작
          </Button>
        </div>
      )}
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
  pendingFirstMessage,
  onFirstMessageConsumed,
  onNewInterview,
}: {
  session: InterviewSession;
  resumeText: string;
  /** 자기소개로 시작한 직후의 첫 메시지. 있으면 마운트 시 면접관 응답을 한 번 요청한다. */
  pendingFirstMessage: string | null;
  onFirstMessageConsumed: () => void;
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

  const firstRequested = useRef(false);
  useEffect(() => {
    // 시작 화면에서 넘어온 그 한 번만 호출한다(StrictMode 이중 실행·재진입 방지).
    if (pendingFirstMessage === null || firstRequested.current) return;
    firstRequested.current = true;
    onFirstMessageConsumed();
    void requestReply(pendingFirstMessage, messages);
    // 마운트 시 한 번만 실행한다.
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
        jobTitle: session.jobTitle,
        jobPosting: session.jobPosting,
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
            {session.jobTitle}
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
              <dt className="text-muted-foreground">직무</dt>
              <dd className="min-w-0 truncate font-medium">{session.jobTitle}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">채용공고</dt>
              <dd className="font-medium">{session.jobPosting ? "반영됨" : "없음"}</dd>
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
