import { AnthropicProvider } from './anthropic.ts';
import { OpenAiProvider } from './openai.ts';
import type { LlmProvider } from './types.ts';

/** `LLM_PROVIDER` env var(기본값 anthropic)로 어댑터를 고른다. */
export function createLlmProvider(): LlmProvider {
  const providerName = Deno.env.get('LLM_PROVIDER') ?? 'anthropic';
  const model = Deno.env.get('LLM_MODEL');

  if (providerName === 'openai') {
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.');
    }
    return new OpenAiProvider(apiKey, model);
  }

  if (providerName === 'anthropic') {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY가 설정되지 않았습니다.');
    }
    return new AnthropicProvider(apiKey, model);
  }

  throw new Error(`알 수 없는 LLM_PROVIDER: ${providerName}`);
}
