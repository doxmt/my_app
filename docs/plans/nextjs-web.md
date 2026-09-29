# M6. Next.js 웹 전환 (웹 클라이언트를 Flutter에서 Next.js로)

작성: 2026-09-29
관련: ADR-010(모바일 화면 우선), 이슈 #23(Flutter 반응형 레이아웃, 폐기), 로드맵 M6(신설) / M7(기존 M6 폴리시)

## 컨텍스트

지금 웹은 Flutter 웹 빌드(`scripts/vercel-build.sh` → `build/web`)를 루트 Vercel 프로젝트가 배포한다. 이슈 #23에서 Flutter 안에서 반응형 레이아웃을 만들었으나, 사용자는 **웹을 React/Next 생태계로 따로 만들기로** 결정했다. Android/iOS는 계속 Flutter다.

이번 작업은 **웹 클라이언트만** Next.js로 다시 만든다. Supabase 스키마, Edge Function(`interview-chat`), RLS, 사용량 RPC, 어드민(`admin/`)은 그대로 두고 호출만 한다.

### 인터뷰 확정 사항 (2026-09-29)

| 항목 | 결정 |
|---|---|
| Next를 택한 이유 | React/Next 생태계 선호. **SEO는 목표가 아니다** → 공개 페이지 SSG/ISR은 범위 밖(추후 옵션) |
| 범위 | **전 기능 동등**: 문제풀이(학습하기/문제풀기) · 오답노트 · 이력서(텍스트/PDF) · 모의면접(SSE) · OAuth 4종(Google/GitHub/Apple/Kakao) · 로컬→DB 이전 |
| 전환 방식 | 동등 기능 완성 후 **한 번에 전환(컷오버)**. 그때까지 Production은 Flutter 웹 유지 |
| 로드맵 | **새 M6 "Next.js 웹 전환"** 신설, 기존 M6 폴리시/QA는 **M7로 밀림**. M5-b(임베딩 키 대기)는 독립 트랙 |
| #23 | **전부 폐기**. 되돌리고 이슈 닫음 (0단계) |

### 권장 기본값 (이 계획의 전제)

| 항목 | 값 | 근거 |
|---|---|---|
| 위치 | 같은 레포 **`webapp/`** | 루트의 `web/`은 Flutter 웹 폴더라 이름이 겹친다. 어드민(`admin/`)과 같은 "별도 폴더" 패턴. Vercel은 새 프로젝트를 만들지 않고 **기존 루트 프로젝트의 Root Directory를 `webapp/`으로 바꾼다**(A안 확정) |
| 프레임워크 | Next.js 16.x (App Router, 조사 시점 16.3.6), TypeScript | |
| UI | Tailwind v4 + shadcn/ui | 어드민과 동일 스택 |
| Supabase | `@supabase/ssr` — 브라우저 `createBrowserClient()`, 서버 `createServerClient()`(cookies `getAll`/`setAll`) | 공식 Next 가이드 |
| env | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 공식 가이드 이름 |
| 렌더링 | **클라이언트 컴포넌트 중심.** 공개 데이터(카테고리/문제) 조회만 서버 컴포넌트를 선택적으로 쓸 수 있음 | SEO 목표 없음. 비회원 데이터가 전부 localStorage라 어차피 클라이언트에서 읽는다 |
| 비회원 저장 | `localStorage`, Flutter와 같은 키·형식 | 아래 표 |
| 테스트 | Vitest (순수 로직: SSE 파서, 로컬 저장소, 이전 정책) | |
| 어드민 | `admin/` 별도 유지, 합치지 않음 | |

### 조사로 확정된 사실 (다시 조사하지 말 것)

| 항목 | 내용 |
|---|---|
| 현재 Vercel 빌드 | 루트 `vercel.json`: installCommand `npm install`, buildCommand `bash scripts/vercel-build.sh`, outputDirectory `build/web`, SPA rewrite. 빌드 스크립트가 Flutter stable을 clone해 `flutter build web --release` + `--dart-define`(SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY / `PDF_PARSE_BASE_URL="https://$VERCEL_URL"`). 루트 `package.json`은 `unpdf` 1.8.1 + `@types/node`뿐. `admin/vercel.json`은 rewrite만, 별도 프로젝트 |
| PDF 함수 | `api/parse-pdf.ts` — Node 기본 런타임(`export const config` 없음), 본문 4MB 상한(`MAX_BODY_BYTES`), 최대 20페이지, CORS는 env `ALLOWED_ORIGINS`와 origin **정확 일치**, 허용 헤더 `Content-Type`만. 모바일 앱은 `env/dev.json`의 `PDF_PARSE_BASE_URL`(현재 `https://myapp-teal-mu.vercel.app`) + `/api/parse-pdf`를 호출 |
| `interview-chat` | CORS `*`, 허용 헤더 `authorization, apikey, content-type, x-device-id`. 본문 `{categoryName?, jobTitle?, resumeText?(비회원 필수), history?, message(필수)}`. SSE 이벤트 `usage`(비회원 `{deviceRemaining, ipRemaining}` / 회원 `{tier:'free', remaining}`), `delta`(`{text}`), `done`(`{}`), `error`(`{code, message}`), 형식 `event: <이름>\ndata: <JSON>\n\n` |
| IP 한도 | `_shared/rate_limit.ts`의 `extractClientIp`가 요청 IP를 뽑는다. **브라우저가 Edge Function을 직접 호출하면 그대로 유효. Next 서버를 경유하면 모든 요청이 Vercel IP로 잡혀 IP 한도가 무너진다** |
| 비회원 로컬 형식 | 키 `wrong_notes` / `resume` / `interview_session`, 각 값 `{ version: 1, items: [...] }`. 기기 ID 키 `device_id`(UUID v4) |
| 로컬→DB 이전 | `lib/features/auth/data/local_data_migration_service.dart`(`migrateIfNeeded(userId)`), `auth_providers.dart`의 `currentUserIdProvider`가 이전 중 null 유지 → 완료 후 userId. 정책: 오답노트 `unique(user_id, question_id)` 중복 무시 병합, 이력서 서버 우선(있으면 업로드 안 함), 성공 항목만 로컬 삭제 |
| 라우트 (Flutter) | `/` · `/categories/:field` · `/categories/:field/:mode` · `…/:topic` · `…/:topic/:questionId` · `/interview` · `/me` · `/me/login` · `/me/resume` · `/me/wrong-notes` · `/me/wrong-notes/:questionId` |
| 홈 아이콘 | slug → 아이콘: `cs`, `frontend`, `backend`, `ai`, `mobile`, `devops`, 그 외 기본 아이콘 |
| CI | `ci.yml`: `test`(Flutter analyze/test) 잡 + `admin`(working-directory `./admin`, npm ci/lint/build) 잡. `pr-summary.js`는 Vercel `deployment_status`의 환경명(Production 여부)으로만 구분하고 웹/어드민 구분 없음 |
| 웹 SSE 실측 | **Flutter 웹에서도 한 번도 실측되지 않았다.** Next에서 처음 확인하게 된다 |

### 외부 문서 확인 사항 (2026-09-29)

- Next 16에서 `middleware.ts`는 deprecated → **`proxy.ts`**(Node 런타임 기본, `runtime` 옵션을 넣으면 에러). 세션 갱신은 `proxy.ts`에서 `supabase.auth.getClaims()`. matcher에서 `_next/static`, `_next/image`, 정적 파일 제외. 인증 검사를 proxy에만 의존하지 않는다. 세션 토큰이 담긴 응답은 캐시하지 않는다.
- 인가 판단은 `getClaims()`/`getUser()`. `getSession().user`는 인가에 쓰지 않는다.
- `/auth/callback` Route Handler에서 `exchangeCodeForSession(code)`. `next` 파라미터는 `/`로 시작할 때만 허용(open redirect 방지). 프로덕션은 `x-forwarded-host` 우선.
- Vercel Function 요청 본문 한도 4.5MB(초과 시 413) → 현재 4MB 상한 유지. `request.formData()`로 File 수신 가능, Route Handler에 `export const runtime = 'nodejs'` 명시. unpdf는 페이지/시간 제한을 자동으로 걸지 않으므로 20페이지 상한 + 타임아웃을 직접 유지. `maxDuration` 설정 문법은 구현 시 vercel.com/docs/functions/configuring-functions/duration 재확인.
- Root Directory 밖 파일은 빌드에서 접근 불가. Root Directory를 바꿀 때 도메인·env·Production Branch가 유지되는지는 **공식 문서 미확인**.
- 이 레포는 JS workspaces가 아니므로 모노레포 자동 스킵 대신 **Ignored Build Step**(exit 0 = 빌드 취소)을 쓴다. 취소된 빌드도 쿼터를 쓴다.
- Supabase Redirect URL 와일드카드: `*`는 구분자(`.` `/`) 아닌 문자, `**`는 임의 문자열. Preview 예: `https://*-<team-slug>.vercel.app/**`. Site URL = 프로덕션 도메인. `http://localhost:3000/**`도 추가. Apple/Kakao는 Supabase 콜백(`https://<project-ref>.supabase.co/auth/v1/callback`)만 등록하면 되고 웹 도메인을 따로 등록하라는 문서 근거는 없다 → 실로그인으로 검증.
- Safari 스트리밍: 청크 버퍼링에 대한 공식 문서 없음. iOS Safari에서 fetch `ReadableStream` SSE가 pending으로 멈춘다는 서드파티 보고 1건(신뢰도 중간 이하). Safari 26.4부터 `ReadableStream` async iteration 지원 → **`getReader()` 루프**로 구현.

### Vercel 구조 — A안 확정 (2026-09-29, 사용자 결정)

**기존 루트 Vercel 프로젝트의 Root Directory를 `webapp/`으로 바꾼다.** 새 Vercel 프로젝트는 만들지 않는다. 구버전 모바일 앱은 존재하지 않는다(스토어 출시 전).

| 항목 | 내용 |
|---|---|
| 프로젝트 | 루트 프로젝트 하나 + `admin/` 프로젝트 하나. 웹 주소(`*.vercel.app`)는 유지된다고 가정하되, Root Directory 변경 시 도메인·env·Production Branch 유지 여부는 **공식 문서 미확인** → 변경 전에 Settings(Domains / Environment Variables / Git > Production Branch / Ignored Build Step) 화면을 캡처해 둔다 |
| 변경 직후 | Root Directory는 프로젝트 전체 설정이라 **바꾸는 순간부터 develop push의 Preview는 Next(`webapp/`)만 빌드**한다. Flutter 웹 Preview는 사라진다. 이미 배포된 Production(기존 Flutter 웹 빌드)은 다음 Production 배포가 있기 전까지 그대로 서비스된다 |
| 컷오버 | develop → main 릴리즈 push. **그 전까지 `main`에 푸시하면 안 된다**(푸시하는 순간 Next가 Production이 된다) |
| PDF 함수 | 루트 `api/parse-pdf.ts`는 Root Directory 밖이 되어 새 빌드에서 사라진다. 대신 같은 도메인의 `webapp/app/api/parse-pdf/route.ts`(Route Handler)가 같은 경로 `/api/parse-pdf`로 응답한다. 모바일 앱은 컷오버 후 이 엔드포인트를 쓴다. 도메인이 유지되면 `PDF_PARSE_BASE_URL` 값 변경은 필요 없다(도메인이 바뀌면 그때 바꾼다). Route Handler는 raw 바이트 본문(`application/octet-stream`)을 받아 모바일 클라이언트 요청 형식과 응답 형식이 동일하다 |
| 루트 파일 | 루트 `vercel.json`(installCommand/buildCommand/outputDirectory/SPA rewrite)은 Root Directory가 `webapp/`이 되면 **무시된다**. 루트 `scripts/vercel-build.sh`, 루트 `api/parse-pdf.ts`, 루트 `vercel.json`은 이번 작업에서 수정·삭제하지 않는다(정리는 후속). `webapp/`은 Next 기본 설정으로 충분하므로 자체 `vercel.json`을 만들지 않는다 |
| Ignored Build Step | 프로젝트가 하나(루트 프로젝트 = `webapp/`)이므로 이 작업을 위한 새 설정은 없다. 기존 값이 있으면 Root Directory 변경 후에도 의도대로 동작하는지 확인하고, `admin/` 프로젝트 쪽 Ignored Build Step(`webapp/` 변경은 스킵)은 필요 시 조정 |
| 되돌리기 | Root Directory를 비우고(루트로 복귀) 재배포하면 Flutter 웹 빌드로 돌아간다 |

## 작업 목표

`webapp/`의 Next.js 앱이 Flutter 웹과 **같은 기능·같은 URL 경로·같은 비회원 저장 형식**으로 동작하고, 기존 Vercel 프로젝트(Root Directory=`webapp/`)의 Preview에서 검증된 뒤 develop → main 릴리즈 push로 웹 Production을 Next로 넘긴다. 모바일 앱의 PDF 업로드는 컷오버 전후로 끊기지 않는다(같은 도메인·같은 경로의 Route Handler가 이어받는다).

## 가드레일

**반드시**
- LLM 호출은 기존처럼 **브라우저 → `interview-chat` Edge Function 직접 호출**(publishable key + `X-Device-Id`, 회원은 `Authorization: Bearer <access_token>`). Next Route Handler/Server Function으로 프록시하지 않는다(IP 한도 보존, API 키는 Supabase secrets에만).
- 비회원은 로그인(익명 로그인 포함) 없이 쓴다. 비회원 데이터는 localStorage에만 두고 서버에 보내지 않는다. `device_id`는 한도 계산용 헤더로만 쓴다.
- localStorage 키와 `{ version: 1, items: [...] }` 형식은 Flutter와 동일하게 맞춘다.
- 로컬→DB 이전 정책(오답노트 병합 / 이력서 서버 우선 / 성공 항목만 로컬 삭제)과 "이전이 끝날 때까지 회원 userId를 노출하지 않는" 동작을 그대로 옮긴다. 로그인 여부 분기는 `userId` 하나로 한다(세션 객체 전체를 구독하지 않음).
- 인가 판단은 `getClaims()`/`getUser()`. `proxy.ts`는 세션 갱신만 하고, 보호가 필요한 곳은 각 서버 코드 안에서도 검사한다.
- URL 경로는 Flutter 라우트 표와 동일하게 유지한다(`/`, `/categories/...`, `/interview`, `/me`, `/me/login`, `/me/resume`, `/me/wrong-notes/...`).
- 로그인 화면은 기존과 같은 위치(`/me/login`)에만 둔다.
- 새 테이블·스키마 변경이 필요해지면 멈추고 보고한다(이번 작업은 스키마 변경 없음이 전제). 필요하면 마이그레이션에 `GRANT` + RLS 정책을 함께 쓴다.

**절대 금지**
- `categories`/`questions`에 앱에서 쓰기, 콘텐츠를 SQL 마이그레이션으로 추가.
- 컷오버(develop → main 릴리즈 push) 전에 `main`에 푸시하는 것 — Root Directory가 `webapp/`인 상태에서 main push는 곧 Next 배포다.
- 루트 `api/parse-pdf.ts`, `scripts/vercel-build.sh`, 루트 `vercel.json` 삭제·수정 — 이번 작업 범위 밖(정리는 후속). Root Directory 변경 후에는 빌드에서 쓰이지 않는다.
- Flutter 코드(`lib/`) 변경 — 0단계 되돌리기와 6단계의 `PDF_PARSE_BASE_URL` 값 변경 외에는 없음.
- PDF 텍스트 추출을 브라우저나 Edge Function에서 하기.
- 공개 페이지 SSG/ISR, SEO 메타 작업(범위 밖, 추후 옵션).
- 어드민(`admin/`) 수정, 어드민과 코드 공유 패키지 만들기.
- 새 기능 추가(Flutter에 없는 기능). 화면 디자인 개편은 넓은 화면 레이아웃(본문 폭 제한 + 넓은 화면 내비) 수준까지만.
- `docs/current_state.md`·`docs/work_log.md` 수정 (`/wrap` 전용).

## 작업 흐름

```
0. #23 폐기 (되돌리기 + 이슈 닫기)
1. webapp/ 골격 + CI 잡 (+ Vercel Root Directory 변경)  [사용자 콘솔 작업 포함]
2. 공통 기반: Supabase 클라이언트/proxy, 기기 ID, 로컬 저장소, 셸 레이아웃
3. 문제풀이 · 오답노트 (비회원)
4. 이력서(텍스트/PDF Route Handler) · 모의면접(SSE)
5. OAuth 4종 + 로컬→DB 이전 + 회원 경로               [사용자 콘솔 작업 포함]
6. 동등성 점검 → 컷오버 → 문서 갱신                   [사용자 콘솔 작업 포함]
```

각 단계는 develop 대상 PR로 끊어도 되고 한 기능 브랜치에 쌓아도 된다(Open Questions 6번). Root Directory 변경 후 develop 머지는 Next Preview만 만들고, Production은 6단계 컷오버(main push) 전까지 기존 Flutter 배포 그대로다.

## 상세 TODO

### 0. #23 폐기

#23의 미커밋 변경을 되돌린다. **파일 하나씩 `git diff <파일>`로 내용을 확인한 뒤** 되돌린다.

| 파일 | 처리 |
|---|---|
| `lib/app/widgets/app_shell.dart` | `git checkout -- <파일>` |
| `lib/features/interview/presentation/interview_page.dart` | `git checkout -- <파일>` |
| `docs/adr.md` (ADR-019 반응형 추가분) | `git checkout -- <파일>` |
| `docs/architecture.md` | `git checkout -- <파일>` |
| `docs/overview.md` | `git checkout -- <파일>` |
| `docs/roadmap.md` (M6 웹 레이아웃 `[x]`) | `git checkout -- <파일>` |
| `lib/app/breakpoints.dart` | 삭제(미추적) |
| `test/app/widgets/app_shell_test.dart` (`test/app/` 전체가 #23 산물) | 삭제(미추적) |
| `docs/plans/web-responsive-layout.md` | **되돌리지 않음.** 상단에 "Next 웹 전환으로 대체됨" 표기 (계획 수립 시 처리 완료) |
| `docs/plans/open-questions.md` | **되돌리지 않음**(#23 이전 변경 포함). #23 절에 "대체됨" 표기 (계획 수립 시 처리 완료) |
| `ios/**/xcshareddata/swiftpm/` | **건드리지 않음** (무관) |

이후:
- 이슈 #23에 "Next.js 웹 전환(M6)으로 대체" 코멘트를 남기고 닫는다.
- 브랜치 `feat/23-web-responsive-layout`: 되돌린 뒤 남는 변경이 `docs/plans/*` 두 파일뿐이면, 이 계획 파일과 함께 새 작업 브랜치로 옮기고 원격에 푸시된 적이 있으면 원격 브랜치도 삭제한다(로컬 삭제는 새 브랜치로 옮긴 뒤).

**인수 기준**
- `git status`에 `lib/`, `test/app/`, `docs/adr.md`, `docs/architecture.md`, `docs/overview.md`, `docs/roadmap.md` 변경이 없다. 남는 것은 `docs/plans/*`와 무관한 `ios/**/swiftpm/`뿐이다.
- `grep -rn "breakpoints.dart\|kWideLayoutBreakpoint" lib test` 결과 없음.
- `flutter analyze` / `flutter test` 통과.
- `gh issue view 23` 상태가 CLOSED.

### 1. `webapp/` 골격 + CI + Vercel Root Directory

- `webapp/`에 Next 16 App Router + TypeScript + Tailwind v4 + shadcn/ui + ESLint + Vitest 초기화. 패키지 매니저는 npm(어드민과 동일), `package-lock.json` 커밋.
- 첫 화면은 "Hello" 수준 placeholder 한 장(이후 단계에서 실제 화면으로 대체).
- `.github/workflows/ci.yml`에 `webapp` 잡 추가(`working-directory: ./webapp`, `npm ci` → `npm run lint` → `npx tsc --noEmit` → `npm test` → `npm run build`). 기존 `test`/`admin` 잡은 그대로.
- `webapp/.env.local.example`에 env 이름만 기록(값 없음). `.env.local`은 gitignore.

**[사용자 콘솔 작업]** (새 프로젝트를 만들지 않는다)
1. 변경 전에 기존 프로젝트의 Settings 화면을 캡처한다: Domains, Environment Variables(이름 목록), Git > Production Branch, Build & Deployment(Root Directory / Build·Output·Install Command override / Ignored Build Step).
2. Settings > Build & Deployment > **Root Directory를 `webapp/`으로 변경**, Framework Preset은 Next.js, Build/Output/Install Command override는 모두 해제(기본값).
3. env 추가: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`(Preview + Production), 기존 `ALLOWED_ORIGINS`는 그대로 유지(PDF Route Handler가 같은 이름으로 읽는다).
4. 변경 후 도메인·env·Production Branch(`main`)가 그대로인지 캡처와 비교한다. 달라졌으면 원래대로 복구한다.
5. 변경 이후 **`main`에 푸시하지 않는다**(6단계 컷오버 전까지).

**인수 기준**
- 로컬 `cd webapp && npm run dev` → `http://localhost:3000` 표시. `npm run lint && npx tsc --noEmit && npm test && npm run build` 통과.
- PR에서 CI `webapp` 잡 통과, 기존 `test`/`admin` 잡 영향 없음.
- Root Directory 변경 후 develop/PR Preview URL에서 Next 앱이 보인다(Flutter 웹 Preview는 더 이상 없음).
- 변경 후에도 기존 Production 도메인이 이전 Flutter 웹 배포를 그대로 서비스한다.
- PR 요약 댓글(`pr-summary.js`)이 깨지거나 덮어써지지 않는지 눈으로 확인(프로젝트 수가 그대로라 문제 없을 것으로 예상).

### 2. 공통 기반

- `lib/supabase/client.ts`(`createBrowserClient`), `lib/supabase/server.ts`(`createServerClient`, cookies `getAll`/`setAll`), 루트 `proxy.ts`(세션 갱신 `getClaims()`, matcher에서 `_next/static`·`_next/image`·정적 파일 제외).
- 기기 ID: localStorage `device_id`, 없으면 `crypto.randomUUID()`로 생성·저장.
- 로컬 저장소 모듈: `wrong_notes` / `resume` / `interview_session`의 `{ version: 1, items }` 읽기·쓰기. 파싱 실패·버전 불일치 시 빈 값으로 처리. SSR 중에는 접근하지 않는다(클라이언트 전용).
- 사용자 상태: `userId`(string | null) 하나만 노출하는 클라이언트 컨텍스트. 5단계 이전 로직이 끼어들 자리를 만들어 둔다(지금은 세션의 userId를 그대로 노출).
- 앱 셸: 하단 탭 3개(홈 `/` · 모의면접 `/interview` · 내 정보 `/me`), 좁은 화면은 하단 탭, 넓은 화면은 좌측 내비 + 본문 최대 폭 제한. 탭 전환 시 각 탭 상태 보존은 요구하지 않는다(Open Questions 5번).

**인수 기준**
- Vitest: 로컬 저장소 모듈이 Flutter 형식 JSON 예시(각 키별 1건)를 읽고, 쓴 결과가 같은 형식이다. 손상된 JSON에서 예외 없이 빈 값.
- 브라우저 DevTools → Application → Local Storage에서 첫 방문 후 `device_id`가 UUID v4 형식으로 한 번 생기고 새로고침해도 바뀌지 않는다.
- Chrome 창 폭을 줄였다 늘리면 하단 탭 ↔ 넓은 화면 내비가 전환되고 URL은 그대로다.
- `/interview`, `/me` 직접 입력 + 새로고침 시 404 없음.

### 3. 문제풀이 · 오답노트 (비회원)

- 홈: 분야 카드(slug → 아이콘 매핑, 6개 + 기본) → `/categories/:field` 학습하기/문제풀기 선택 → 주제 목록 → 문제 목록 → 문제 상세(답변 작성 → 모범답안 → 자가 채점) / 학습하기 모드(문제·모범답안 바로 보기).
- 공개 조회는 `categories`, `questions`(`is_published=true`만 RLS로 보임) select만.
- 오답노트: 자가 채점 후 저장 버튼 → localStorage `wrong_notes`. `/me/wrong-notes` 목록, `/me/wrong-notes/:questionId` 복습, 해결 처리.
- 로딩·에러·빈 상태는 Flutter와 같은 수준으로만(개선은 M7).

**인수 기준**
- Flutter 앱(iOS 시뮬레이터)과 나란히 놓고 같은 분야/주제/문제가 같은 순서로 보인다.
- 문제 상세 URL을 새 탭에 직접 붙여넣어도 같은 문제가 열린다.
- 오답노트 저장 → 새로고침 후에도 목록에 남는다. localStorage `wrong_notes` 값이 `{ "version": 1, "items": [...] }` 형식이다.
- Network 탭에 `categories`/`questions` 외 테이블 요청과 쓰기 요청(POST/PATCH)이 없다.

### 4. 이력서 · PDF Route Handler · 모의면접

**PDF**
- `webapp/app/api/parse-pdf/route.ts`: 루트 `api/parse-pdf.ts` 로직을 옮긴 사본. `export const runtime = 'nodejs'`, `export const maxDuration = 30`, 4MB 상한·20페이지 상한 유지, 응답 형식 동일. **요청 본문은 `formData()`가 아니라 raw 바이트(`request.arrayBuffer()`)** — 모바일 클라이언트가 `application/octet-stream` 본문을 보내므로 컷오버 후에도 모바일이 그대로 동작해야 한다. 브라우저는 같은 오리진 `/api/parse-pdf`를 호출하고, `ALLOWED_ORIGINS` 기반 CORS 처리 코드는 기존 그대로 옮긴다.
- 루트 `api/parse-pdf.ts`는 **수정하지 않는다.** Root Directory가 `webapp/`이 되면 새 빌드에서는 쓰이지 않는다.
- `unpdf`는 `webapp/package.json` 의존성. env `ALLOWED_ORIGINS`는 기존 프로젝트 값을 유지(**[사용자 콘솔 작업]** 확인).

**이력서**
- `/me/resume`: 텍스트 붙여넣기 / PDF 업로드 → 추출 텍스트 확인 → 비회원 localStorage `resume`(1개 덮어쓰기). 회원 저장은 5단계.

**모의면접**
- `/interview`: `fetch`로 `interview-chat` Function URL에 직접 POST(헤더 `apikey`/`Authorization`(비회원은 publishable key), `Content-Type`, `X-Device-Id`). 본문은 조사 표의 형식.
- SSE 파서: `response.body.getReader()` 루프 + `TextDecoder(stream: true)`, `\n\n` 경계, `event:`/`data:` 줄 처리. async iteration은 쓰지 않는다.
- 이벤트 처리: `usage` → 남은 사용량 배너, `delta` → 말풍선에 이어 붙임, `done` → 대화를 localStorage `interview_session`에 저장, `error`/HTTP 429 → 안내 문구.
- **비스트리밍 폴백은 만들지 않는다.** Safari 실측에서 막히면 멈추고 보고(Open Questions 4번).

**인수 기준**
- Vitest: SSE 파서가 (a) 이벤트가 두 청크에 걸쳐 잘린 입력, (b) 한 청크에 이벤트 여러 개, (c) 멀티바이트 한글이 청크 경계에서 잘린 입력을 올바르게 파싱한다.
- Preview에서 PDF(20페이지 이하, 4MB 이하) 업로드 → 텍스트 추출 성공. 4MB 초과 파일은 오류 안내(413/자체 오류)가 뜨고 화면이 멈추지 않는다.
- **Chrome, macOS Safari, iOS Safari(실기기 또는 시뮬레이터) 각각에서** 면접 응답이 한 번에 뭉치지 않고 **점진적으로** 표시된다. 세 브라우저 결과를 PR 본문에 기록.
- DevTools Network에서 면접 요청이 `*.supabase.co/functions/v1/interview-chat`로 직접 나가고, Next 서버(`/api/...`) 경유 요청이 없다.
- 비회원 한도 초과 시(한도를 임시로 낮추지 않고, 남은 사용량 배너 값 변화로) `usage` 이벤트가 반영된다.
- Production은 컷오버 전까지 기존 Flutter 배포 그대로이므로 모바일 앱의 PDF 업로드가 이 단계 전후로 여전히 동작한다(Root Directory 변경 후에도 이미 배포된 Production 함수는 유지되는지 확인).

### 5. OAuth 4종 + 로컬→DB 이전 + 회원 경로

- `/me/login`: Google / GitHub / Apple / Kakao 버튼 → `signInWithOAuth({ provider, options: { redirectTo: <origin>/auth/callback?next=<경로> } })`.
- `app/auth/callback/route.ts`: `exchangeCodeForSession(code)`, `next`는 `/`로 시작할 때만 허용(아니면 `/`), 프로덕션은 `x-forwarded-host` 우선. 실패 시 `/me/login?error=...`.
- 로컬→DB 이전(클라이언트): 로그인 직후 `userId` 컨텍스트는 null 유지 → `local_data_migration_service.dart`와 같은 정책으로 `wrong_notes` 병합 upsert(`unique(user_id, question_id)` 충돌 무시), `resumes`는 서버에 없을 때만 insert → 성공 항목만 localStorage에서 제거 → userId 노출.
- 회원 경로: 오답노트·이력서는 Supabase 테이블(RLS 본인만), 면접은 `Authorization: Bearer <access_token>`으로 호출하고 `usage`의 `{tier, remaining}` 표시. 저장은 Edge Function이 하므로 클라이언트는 조회만(Flutter 회원 경로와 동일하게 맞춘다).
- 로그아웃: Flutter와 같은 동작(로컬 데이터 처리 방식 포함)으로 맞춘다.

**[사용자 콘솔 작업]** (변경 전 현재 값 캡처)
- Supabase → Auth → URL Configuration → Redirect URLs에 추가: `http://localhost:3000/**`, 기존 프로젝트의 Preview 패턴 `https://<프로젝트명>-*-<team-slug>.vercel.app/**`(실제 Preview 호스트 형태를 보고 확정), Production 도메인 `/**`(이미 있으면 유지). **Site URL은 6단계까지 그대로.**
- Apple(Services ID)·Kakao·Google·GitHub 콘솔: 새로 등록할 값이 없을 것으로 예상(모두 Supabase 콜백만 사용). 실로그인에서 실패할 때만 확인한다.

**인수 기준**
- localhost와 Preview 양쪽에서 4개 제공자 모두 로그인 → 원래 보던 화면으로 복귀.
- `/auth/callback?code=...&next=https://evil.example` → `/`로 이동(외부로 나가지 않음).
- 비회원으로 오답노트 2건 + 이력서 저장 → 로그인 → Supabase 테이블에 반영, localStorage에서 해당 항목 제거. 서버에 이미 이력서가 있는 계정으로 다시 해보면 서버 이력서가 유지된다.
- 이전 도중 화면이 회원 데이터로 깜빡 전환되지 않는다(눈으로 확인).
- 회원 면접: `usage`가 `{tier:'free', remaining}`로 표시되고, 새로고침 후 대화가 서버에서 다시 보인다.
- Flutter 모바일 앱의 로그인이 이 단계 전후로 여전히 동작한다(Redirect URL 추가만 했으므로 영향 없어야 함).

### 6. 동등성 점검 → 컷오버 → 문서

**동등성 점검**: 기존 Flutter 웹 Production(컷오버 전까지 서비스 중)과 Preview의 Next 앱에서 같은 체크리스트를 밟는다 — 라우트 표의 모든 경로 직접 진입, 문제풀이/학습하기, 오답노트, 이력서 텍스트/PDF, 면접(비회원/회원), 로그인 4종, 로컬→DB 이전, 로그아웃. Chrome · macOS Safari · iOS Safari · Android Chrome에서 확인. (Root Directory 변경 후에는 Flutter 웹 Preview가 없으므로 Flutter 쪽 비교는 Production 또는 iOS 시뮬레이터 앱으로 한다.)

**컷오버 [사용자 콘솔 작업 + 코드]** — 아래 순서를 지킨다.
1. 컷오버 직전에 Production 도메인·env·Production Branch를 다시 확인한다(Root Directory 변경 시 캡처와 비교).
2. develop → main 릴리즈 push → Production 배포가 Next로 바뀐다. 같은 도메인이므로 웹 주소와 모바일 `PDF_PARSE_BASE_URL`은 그대로다(도메인이 바뀌었다면 `env/dev.json`과 모바일 빌드용 `PDF_PARSE_BASE_URL`을 새 도메인으로 바꾸고 iOS/Android에서 PDF 업로드 확인).
3. 컷오버 직후 iOS/Android 앱에서 PDF 업로드가 새 Route Handler로 성공하는지 확인.
4. Supabase Site URL이 Production 도메인과 다르면 변경. 기존 Redirect URLs는 바로 지우지 않는다.
5. Flutter 웹 빌드 경로(루트 `vercel.json`, `scripts/vercel-build.sh`, 루트 `api/parse-pdf.ts`, Flutter `web/` 폴더) 정리는 별도 후속 작업(Open Questions 3번). 되돌리기가 필요하면 Root Directory를 비우고 재배포한다.

**문서 (writer에게 맡겨도 됨, 단 current_state/work_log 제외)**
- `docs/adr.md`: ADR-019 "웹 클라이언트를 Next.js로 분리" (이유: React 생태계 선호, 대안: Flutter 반응형(#23), 트레이드오프: 화면·로직 이중 구현, 새 기능마다 두 번 작업). ADR-010의 "웹 전용 레이아웃은 M6" 후속 표기.
- `docs/roadmap.md`: 새 **M6. Next.js 웹 전환** 절 추가, 기존 M6 폴리시/QA → **M7**(내용 그대로, "웹 전용 레이아웃" 항목은 M6로 흡수되었다고 표기).
- `docs/architecture.md`: 기술 스택에 웹(Next.js, `webapp/`, 기존 Vercel 프로젝트의 Root Directory), 디렉토리 구조에 `webapp/`, 배포·설정 항목(웹 env 이름), 데이터 흐름의 PDF 경로.
- `docs/overview.md`: 스택 표와 마일스톤 목록.
- `CLAUDE.md`: Non-Obvious Rules에 "웹은 Flutter가 아닌 `webapp/`의 Next.js 앱이다", "웹 클라이언트는 Edge Function을 브라우저에서 직접 호출한다(Next 서버 경유 금지)", Commands에 `webapp` 명령, Definition of Done에 `webapp` lint/test/build. 실측에서 나온 브라우저별 특이사항(Safari 등) 한 줄씩.

**인수 기준**
- 동등성 체크리스트 전 항목이 네 브라우저에서 OK(또는 사유가 PR에 기록).
- Production(컷오버 후)에서 로그인 4종 성공, 면접 스트리밍 확인.
- 모바일 앱(iOS/Android)이 컷오버 직후에도 PDF 업로드 성공. 전환 직전까지 기존 함수로도 성공(끊긴 구간 없음).
- 문서 5종이 A안 구조와 일치하고, `docs/current_state.md`·`docs/work_log.md`는 변경되지 않았다.

## 성공 기준

- 웹 Production이 `webapp/`의 Next.js 앱이고, Flutter 웹과 기능·URL 경로·비회원 저장 형식이 같다.
- 모의면접 스트리밍이 Chrome · macOS Safari · iOS Safari에서 점진 표시된다(또는 불가 사유와 대안이 문서화됨).
- LLM·Edge Function 호출은 브라우저 직접 호출이고, Next 서버에 API 키나 LLM 호출이 없다.
- 모바일 PDF 업로드가 전 과정에서 끊기지 않았다(컷오버로 같은 경로가 Route Handler로 이어진다).
- CI(`test`/`admin`/`webapp`) 통과, `flutter analyze`/`flutter test` 통과.

## 범위 밖 (별도 후속)

- 공개 페이지 SSG/ISR, SEO 메타·사이트맵
- 기존 Flutter 웹 빌드 경로 정리(루트 `vercel.json`, `scripts/vercel-build.sh`, 루트 `api/parse-pdf.ts`, Flutter `web/` 폴더) — 컷오버 안정화 후
- M7(기존 M6) 폴리시: 로딩·에러·빈 상태, 오프라인, 접근성
- 커스텀 도메인 연결
- M5-b 콘텐츠 파이프라인

### Open Questions

1. ~~Vercel 구조 A/B~~ — **A안 확정**(기존 프로젝트 Root Directory → `webapp/`). 상단 "Vercel 구조" 절 참조. 남은 미확인: Root Directory 변경 시 도메인·env·Production Branch 유지 여부(변경 전 캡처로 대응).
2. ~~스토어 출시 전이라 구버전 모바일 앱이 없는지~~ — **없음으로 확정.** 구 도메인 함수를 유지할 필요가 없다.
3. **Flutter 웹 빌드 경로 정리 시점과 방식** — 추천: 컷오버 후 1~2주 안정화 뒤 별도 PR로 루트 `vercel.json`/`scripts/vercel-build.sh`/루트 `api/`/Flutter `web/` 폴더 제거(Vercel 프로젝트는 그대로 유지). `CLAUDE.md`의 "대상 플랫폼 Android/iOS/Web" 문구도 그때 "Web은 Next"로 정리.
4. **iOS Safari에서 SSE가 pending으로 멈출 경우** — 선택지: (a) 비스트리밍 폴백(응답 완성 후 한 번에 표시, Edge Function에 비스트리밍 모드 추가 필요 → 범위 확대), (b) Safari만 알려진 제약으로 문서화하고 진행. 실측 전에는 결정하지 않는다.
5. **탭 전환 시 탭별 화면 상태 보존** — Flutter는 `indexedStack`으로 각 탭 스택을 유지한다. Next 기본 라우팅은 유지하지 않는다. 추천: 동등성 범위에서 제외(URL 기반 이동으로 충분), 필요해지면 M7.
6. **PR 단위** — 단계별 PR(0+1, 2+3, 4, 5, 6) vs 기능 브랜치 하나. 이번 실행은 한 기능 브랜치(`feat/24-nextjs-web`)에 쌓았다. develop 머지는 Preview만 바꾸고 Production은 main push 전까지 그대로다.
7. **PR 요약 댓글에 웹/어드민 구분** — 프로젝트 수는 그대로(루트 + admin)라 기존과 같다. 실제로 헷갈릴 때만 프로젝트명 표시를 추가.
8. **기존 Flutter 웹 비회원 데이터 이어받기** — 도메인이 유지되면 같은 오리진이라 기존 localStorage를 읽을 수는 있지만, Flutter 웹의 `shared_preferences`는 키에 `flutter.` 접두사를 붙이는 것으로 알려져 있다(미확인)이라 키가 맞지 않는다. 추천: 출시 전이므로 이어받지 않는다.
9. **Supabase Redirect URL Preview 패턴** — 기존 프로젝트 Preview 호스트 형태(`<프로젝트>-<hash>-<team>.vercel.app`, 브랜치 별칭 `<프로젝트>-git-<branch>-<team>.vercel.app`)에 `*` 한 개 패턴이 맞는지 5단계에서 실측으로 확정.
10. **`maxDuration` 설정 문법** — Next 공식 문서(route segment config)대로 Route Handler에 `export const maxDuration = 30`을 썼다. Vercel 쪽에서 실제 적용되는지는 Preview 배포 후 확인.
