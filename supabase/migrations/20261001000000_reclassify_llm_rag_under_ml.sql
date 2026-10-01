-- AI 엔지니어링과 ML·모델의 학습 범위를 분리한다.
-- LLM의 동작 원리와 RAG·임베딩은 ML·모델에서 다루며,
-- 프롬프트·에이전트·MCP·서비스 운영은 AI 엔지니어링에 남긴다.
-- questions.category_id는 하위 카테고리를 참조하므로, 카테고리 이동만으로
-- 해당 소주제의 모든 문제도 함께 재분류된다.

update public.categories
set
  parent_id = 'b4b59a83-1239-436b-be92-1ee14dc97d7d',
  sort_order = 1
where slug = 'ai-llm-basics';

update public.categories
set
  parent_id = 'b4b59a83-1239-436b-be92-1ee14dc97d7d',
  sort_order = 4
where slug = 'ai-rag-embedding';

update public.categories
set
  sort_order = 2
where slug = 'ml-transformer';

update public.categories
set
  sort_order = 3
where slug = 'ml-model-tuning';

update public.categories
set
  description = 'LLM·임베딩·딥러닝 모델 구조와 학습'
where slug = 'ml';

update public.categories
set
  sort_order = case slug
    when 'ai-engineering-techniques' then 1
    when 'ai-agent-harness' then 2
    when 'ai-mcp' then 3
    when 'ai-eval-safety' then 4
    when 'ai-app-ops' then 5
    else sort_order
  end,
  description = case slug
    when 'ai' then '프롬프트·에이전트·MCP·AI 서비스 운영'
    else description
  end
where slug in ('ai', 'ai-engineering-techniques', 'ai-agent-harness', 'ai-mcp', 'ai-eval-safety', 'ai-app-ops');
