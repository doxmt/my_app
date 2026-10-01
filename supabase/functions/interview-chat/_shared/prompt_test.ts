import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@1';
import { buildSystemPrompt, truncateJobPosting } from './prompt.ts';

Deno.test('분야 없이 직무와 이력서만으로 프롬프트를 만든다', () => {
  const prompt = buildSystemPrompt({ jobTitle: '백엔드 개발자', resumeText: '5년차' });

  assertStringIncludes(prompt, '지원 직무: 백엔드 개발자');
  assertStringIncludes(prompt, '이력서:\n5년차');
  assertEquals(prompt.includes('지원 분야'), false);
  assertEquals(prompt.includes('채용공고'), false);
});

Deno.test('예전 앱이 보낸 분야는 있으면 그대로 넣는다', () => {
  const prompt = buildSystemPrompt({ categoryName: '백엔드', jobTitle: '개발자', resumeText: 'r' });

  assertStringIncludes(prompt, '지원 분야: 백엔드');
});

Deno.test('채용공고가 있으면 프롬프트에 넣고 질문 지침을 더한다', () => {
  const prompt = buildSystemPrompt({
    jobTitle: '개발자',
    jobPosting: 'Kotlin, Spring 경험자 우대',
    resumeText: 'r',
  });

  assertStringIncludes(prompt, '채용공고:\nKotlin, Spring 경험자 우대');
  assertStringIncludes(prompt, '채용공고의 요구 역량과 우대사항에 맞춰 질문하고');
});

Deno.test('공백뿐인 채용공고는 없는 것으로 본다', () => {
  const prompt = buildSystemPrompt({ jobTitle: '개발자', jobPosting: '  \n ', resumeText: 'r' });

  assertEquals(prompt.includes('채용공고'), false);
});

Deno.test('채용공고는 기본 3000자로 자른다', () => {
  assertEquals(truncateJobPosting('가'.repeat(3500)).length, 3000);
  assertEquals(truncateJobPosting('가'.repeat(100)).length, 100);
});
