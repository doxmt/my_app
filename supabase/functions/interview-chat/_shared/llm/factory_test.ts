import { assertEquals, assertThrows } from 'jsr:@std/assert@1';
import { AnthropicProvider } from './anthropic.ts';
import { createLlmProvider } from './factory.ts';
import { OpenAiProvider } from './openai.ts';

function resetEnv() {
  for (const key of ['LLM_PROVIDER', 'LLM_MODEL', 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY']) {
    Deno.env.delete(key);
  }
}

Deno.test('LLM_PROVIDER가 비어 있으면 기본값 anthropic을 쓴다', () => {
  resetEnv();
  Deno.env.set('ANTHROPIC_API_KEY', 'test-key');

  const provider = createLlmProvider();

  assertEquals(provider instanceof AnthropicProvider, true);
});

Deno.test('LLM_PROVIDER=openai면 OpenAiProvider를 돌려준다', () => {
  resetEnv();
  Deno.env.set('LLM_PROVIDER', 'openai');
  Deno.env.set('OPENAI_API_KEY', 'test-key');

  const provider = createLlmProvider();

  assertEquals(provider instanceof OpenAiProvider, true);
});

Deno.test('anthropic인데 ANTHROPIC_API_KEY가 없으면 에러를 던진다', () => {
  resetEnv();
  Deno.env.set('LLM_PROVIDER', 'anthropic');

  assertThrows(() => createLlmProvider(), Error, 'ANTHROPIC_API_KEY');
});

Deno.test('openai인데 OPENAI_API_KEY가 없으면 에러를 던진다', () => {
  resetEnv();
  Deno.env.set('LLM_PROVIDER', 'openai');

  assertThrows(() => createLlmProvider(), Error, 'OPENAI_API_KEY');
});

Deno.test('알 수 없는 LLM_PROVIDER면 에러를 던진다', () => {
  resetEnv();
  Deno.env.set('LLM_PROVIDER', 'unknown-vendor');

  assertThrows(() => createLlmProvider(), Error, 'LLM_PROVIDER');
  resetEnv();
});
