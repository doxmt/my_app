# webapp

사용자용 웹 클라이언트 (Next.js 16 App Router, TypeScript, Tailwind v4, shadcn/ui). Android/iOS는 Flutter, 웹은 이 앱이다 (ADR-019).

```bash
cp .env.local.example .env.local   # NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 채우기
npm install
npm run dev                        # http://localhost:3000
npm run lint && npx tsc --noEmit && npm test && npm run build
```

- 비회원 데이터는 localStorage에만 둔다(Flutter와 같은 키·`{ version: 1, items }` 형식).
- `interview-chat` Edge Function은 브라우저가 직접 호출한다. Next 서버를 경유하지 않는다.
- `app/api/parse-pdf`만 서버에서 PDF 텍스트를 추출한다.
