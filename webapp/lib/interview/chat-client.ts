import type { InterviewMessage } from "@/lib/models";
import { readSseStream } from "./sse";

/** 남은 면접 횟수. 비회원은 기기·네트워크(IP) 두 한도, 회원은 free 한도 하나. 숫자는 서버가 알려준 값만 쓴다. */
export type UsageStatus =
  | { kind: "guest"; deviceRemaining: number; ipRemaining: number }
  | { kind: "member"; remaining: number };

export class InterviewChatError extends Error {
  constructor(
    message: string,
    readonly code: "rate_limited" | "upstream" | "network",
    readonly usage?: UsageStatus,
    readonly blockedBy?: string | null,
  ) {
    super(message);
  }
}

const UPSTREAM_MESSAGE = "면접 답변 생성에 실패했습니다. 잠시 후 다시 시도해주세요.";
const NETWORK_MESSAGE = "네트워크 연결을 확인해주세요.";

function functionUrl(): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/interview-chat`;
}

function parseUsage(json: Record<string, unknown>): UsageStatus {
  if ("tier" in json) {
    return { kind: "member", remaining: Number(json.remaining ?? 0) };
  }
  return {
    kind: "guest",
    deviceRemaining: Number(json.deviceRemaining ?? 0),
    ipRemaining: Number(json.ipRemaining ?? 0),
  };
}

function rateLimitedMessage(usage: UsageStatus, blockedBy: string | null): string {
  if (usage.kind === "member") return "오늘 사용할 수 있는 면접 횟수를 모두 사용했습니다.";
  return blockedBy === "device"
    ? "오늘 이 기기에서 사용할 수 있는 면접 횟수를 모두 사용했습니다."
    : "현재 네트워크에서 사용할 수 있는 면접 횟수를 모두 사용했습니다.";
}

/**
 * 브라우저가 `interview-chat` Edge Function을 직접 호출한다(Next 서버 경유 금지 - IP 한도 보존).
 * 비회원은 publishable key + `X-Device-Id`, 회원은 `Authorization: Bearer <access_token>`.
 */
export type ChatAuth = { deviceId: string; accessToken: string | null };

function authHeaders({ deviceId, accessToken }: ChatAuth): Record<string, string> {
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  return {
    apikey: publishableKey,
    Authorization: `Bearer ${accessToken ?? publishableKey}`,
    "X-Device-Id": deviceId,
  };
}

/** 카운트를 올리지 않는 읽기 전용 사용량 조회(배너 초기값). */
export async function fetchUsage(auth: ChatAuth): Promise<UsageStatus> {
  let response: Response;
  try {
    response = await fetch(functionUrl(), { headers: authHeaders(auth) });
  } catch {
    throw new InterviewChatError(NETWORK_MESSAGE, "network");
  }
  if (!response.ok) throw new InterviewChatError(UPSTREAM_MESSAGE, "upstream");
  return parseUsage((await response.json()) as Record<string, unknown>);
}

export type StreamReplyParams = {
  auth: ChatAuth;
  jobTitle: string;
  /** 선택. 회사 채용공고 텍스트. */
  jobPosting?: string;
  resumeText: string;
  history: InterviewMessage[];
  message: string;
  onUsage: (usage: UsageStatus) => void;
  onDelta: (text: string) => void;
};

/** 응답을 SSE로 읽어 `usage`/`delta`를 콜백으로 넘긴다. `done`이면 정상 종료, 실패는 InterviewChatError. */
export async function streamReply(params: StreamReplyParams): Promise<void> {
  let response: Response;
  try {
    response = await fetch(functionUrl(), {
      method: "POST",
      headers: { ...authHeaders(params.auth), "Content-Type": "application/json" },
      body: JSON.stringify({
        jobTitle: params.jobTitle,
        ...(params.jobPosting?.trim() ? { jobPosting: params.jobPosting.trim() } : {}),
        resumeText: params.resumeText,
        history: params.history.map((item) => ({ role: item.role, content: item.content })),
        message: params.message,
      }),
    });
  } catch {
    throw new InterviewChatError(NETWORK_MESSAGE, "network");
  }

  if (response.status === 429) {
    const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    const usage = parseUsage(json);
    const blockedBy = typeof json.blockedBy === "string" ? json.blockedBy : null;
    throw new InterviewChatError(rateLimitedMessage(usage, blockedBy), "rate_limited", usage, blockedBy);
  }
  if (!response.ok || !response.body) {
    throw new InterviewChatError(UPSTREAM_MESSAGE, "upstream");
  }

  try {
    for await (const { event, data } of readSseStream(response.body)) {
      const json = JSON.parse(data) as Record<string, unknown>;
      if (event === "usage") {
        params.onUsage(parseUsage(json));
      } else if (event === "delta") {
        if (typeof json.text === "string") params.onDelta(json.text);
      } else if (event === "error") {
        throw new InterviewChatError(UPSTREAM_MESSAGE, "upstream");
      } else if (event === "done") {
        return;
      }
    }
  } catch (error) {
    if (error instanceof InterviewChatError) throw error;
    throw new InterviewChatError(NETWORK_MESSAGE, "network");
  }
}
