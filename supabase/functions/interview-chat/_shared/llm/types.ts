export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface StreamChatParams {
  systemPrompt: string;
  messages: ChatMessage[];
}

/** 벤더 SDK를 직접 호출하지 않고 이 인터페이스를 거쳐서만 LLM을 호출한다. */
export interface LlmProvider {
  streamChat(params: StreamChatParams): AsyncGenerator<string, void, unknown>;
}
