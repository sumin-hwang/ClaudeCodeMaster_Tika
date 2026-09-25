# CLAUDE.md - Tika Project (Ticket + Kanban Board)

## 프로젝트 개요

Tika는 티켓 기반 칸반 보드 TODO 앱이다.
Next.js App Router 기반으로, 프론트엔드와 백엔드를 디렉터리 수준에서 분리한다.
`src/shared/`에서 타입과 검증 스키마를 공유한다.

개발 방법론은 **SDD(Spec-Driven Development) + TDD**를 함께 사용한다: 무엇을 만들지는 명세(Spec)로 먼저 확정하고, 어떻게 만들지는 테스트(Test)로 먼저 검증한다. 자세한 규칙은 아래 [SDD 워크플로 규칙](#sdd-워크플로-규칙) 참고.

## 프로젝트 구조

- `app/api/` : 백엔드 진입점 (Route Handlers, 요청 파싱 + 응답만)
- `src/server/` : 백엔드 로직 (services, db, middleware)
- `src/client/` : 프론트엔드 로직 (components, hooks, api 호출)
- `src/shared/` : 공유 타입, Zod 스키마, 상수
- `docs/` : 프로젝트 전체(MVP) 명세 문서 — 이미 확정된 FR-001~008 범위의 근거
- `specs/<NNN-feature-name>/` : SDD(Spec Kit) 기능별 명세 산출물 (spec.md/plan.md/tasks.md 등) — 신규 기능 작업 시 생성
- `.specify/memory/constitution.md` : 프로젝트 원칙/거버넌스 문서

## 기술스택

- Framework : Next.js 15 (App Router)
- Language : TypeScript (strict 모드)
- Frontend : React 19
- Styling : Tailwind CSS 4
- Drag & Drop : @dnd-kit/core + @dnd-kit/sortable
- ORM : Drizzle ORM
- DB : PostgreSQL (로컬 개발/테스트는 `postgres` 드라이버 + `DATABASE_URL`, 배포 시 Vercel Postgres/Neon 전환 예정 — TRD.md 참고)
- Validation : Zod
- Testing : Jest + React Testing Library
- Deployment : Vercel

## 명세 문서 경로

### 프로젝트 전체 명세 (docs/) — MVP 범위 확정 근거, 반드시 참조

- 제품 요구사항 : `/docs/PRD.md`
- 기술 요구사항 : `/docs/TRD.md`
- 상세 요구사항(FR/NFR/US) : `/docs/REQUIREMENTS.md`
- 데이터 모델 : `/docs/DATA_MODEL.md`
- API 명세 : `/docs/API_SPEC.md`
- 컴포넌트 명세 : `/docs/COMPONENT_SPEC.md`
- 테스트 케이스 : `/docs/TEST_CASES.md`

### 기능별 SDD 명세 (specs/) — 신규 기능·변경 작업 시

- `/specs/<NNN-feature-name>/spec.md` : 기능 명세 (`/speckit-specify`로 생성)
- `/specs/<NNN-feature-name>/plan.md` : 구현 계획 (`/speckit-plan`)
- `/specs/<NNN-feature-name>/tasks.md` : 작업 목록 (`/speckit-tasks`)
- `/specs/<NNN-feature-name>/research.md`, `data-model.md`, `quickstart.md`, `contracts/` : plan 단계 부속 산출물

### 거버넌스

- `/.specify/memory/constitution.md` : 프로젝트 원칙/거버넌스 (`/speckit-constitution`으로 관리, 아직 템플릿 상태 — 채워지기 전까지는 이 CLAUDE.md와 docs/의 규칙이 우선)

## 코딩 컨벤션

### TypeScript (공통)

- strict 모드 사용
- `any` 사용 금지, `unknown` 사용 후 타입 가드
- 인터페이스/타입은 접두사 없이 명사로 (예: `Ticket`, `BoardData`)
- enum 대신 const 객체 + `typeof` 패턴 사용
- 공유 타입은 반드시 `@/shared/types`에서 import

### 백엔드 (app/api/ + src/server/)

- Route Handler는 얇게 : 요청 파싱 → 서비스 호출 → 응답 반환
- 비즈니스 로직은 `src/server/services/`에 작성
- Zod로 요청 검증 (`src/shared/validations`에서 import)
- 에러 응답 형식 통일 : `{ error: { code, message } }`
- HTTP 상태 코드 : 200, 201, 204, 400, 404, 500
- DB 쿼리는 Drizzle ORM으로만 작성 (raw SQL 금지)

### 프론트엔드 (src/client/)

- 함수 컴포넌트 + 화살표 함수
- Props 타입은 컴포넌트 파일 내 정의
- API 호출은 `src/client/api/ticketApi.ts`를 통해서만
- 파일명 : PascalCase (예 : `TicketCard.tsx`)

## 개발 규칙

### 반드시 지켜야 할 것

- 새 기능 구현 전 TEST_CASES.md(또는 해당 feature의 `tasks.md`)의 테스트부터 작성
- API 구현 시 API_SPEC.md의 명세를 정확히 따르기
- 컴포넌트 구현 시 COMPONENT_SPEC.md의 Props와 동작 준수
- 타입 변경 시 `src/shared/types` 먼저 수정

### 하지 말아야 할 것

- 명세에 없는 기능 임의 추가 금지
- 테스트 코드 삭제 또는 skip 금지
- `any` 타입 사용 금지
- `console.log` 커밋 금지 (디버깅 후 제거)
- `src/client/`에서 직접 DB 접근 금지
- `src/server/`에서 React 관련 코드 작성 금지

### 경계 규칙

- 백엔드 작업 시 (`app/api/`, `src/server/`) 프론트엔드(`src/client/`) 코드 수정 금지
- 프론트엔드 작업 시 (`src/client/`) 백엔드(`app/api/`, `src/server/`) 코드 수정 금지
- 양쪽에 영향을 주는 변경은 `src/shared/` 먼저 수정 후 각각 반영

### TDD 사이클 규칙

- **Red 단계** : 테스트 코드만 작성, 구현 코드 생성 금지
- **Green 단계** : 테스트를 통과하는 최소한의 코드만 작성, 테스트 코드 수정 금지
- **Refactor 단계** : 코드 개선만, 새 기능 추가 금지, 테스트는 반드시 통과 유지
- 테스트와 구현을 한 번에 작성하지 말 것 — 반드시 단계별로 진행
- 테스트 실패 시 구현을 수정할 것, 테스트를 수정하지 말 것 (명세 오류인 경우 명세 먼저 수정)

## SDD 워크플로 규칙

Tika는 **두 계층의 명세**를 함께 쓴다.

1. **프로젝트 전체 명세 (`docs/`)** — 이미 확정된 MVP(FR-001~008) 범위의 단일 진실 공급원(SoT). 지금까지 구현된 기능(예: FR-001 티켓 생성)은 이 문서들을 그대로 따른다.
2. **기능별 SDD 명세 (`specs/<NNN-feature-name>/`)** — Spec Kit(`.specify/`, `.claude/skills/speckit-*`)로 관리하는, 신규 기능이나 `docs/`의 범위를 벗어나는 변경 작업에 사용하는 산출물.

두 계층이 충돌하면 **더 최신이고 더 구체적인 산출물이 우선**한다 (일반적으로 `docs/`가 MVP 베이스라인, `specs/`가 그 이후의 변경/확장을 반영).

### 작업 순서 (신규 기능/변경)

1. **명세(Spec)** : `/speckit-specify`로 `specs/<NNN-feature-name>/spec.md` 작성 — 무엇을, 왜 만드는지
2. **명확화(선택)** : 모호한 부분이 있으면 `/speckit-clarify`로 spec.md에 답변 반영
3. **계획(Plan)** : `/speckit-plan`으로 `plan.md`(+ research.md/data-model.md/contracts/) 생성 — 기술 스택·아키텍처는 이 CLAUDE.md/TRD.md와 일치해야 함
4. **작업 분해(Tasks)** : `/speckit-tasks`로 `tasks.md` 생성 — 사용자 스토리 단위로 분해
5. **검증 게이트(선택)** : `/speckit-analyze`(spec/plan/tasks 정합성 점검), `/speckit-checklist`(커스텀 체크리스트)
6. **구현(Implement)** : `/speckit-implement`로 `tasks.md`를 순서대로 실행 — 각 작업 내부에서는 위 **TDD 사이클 규칙**(Red → Green → Refactor)을 그대로 따름
7. **잔여 작업 정리** : 구현 중 범위가 늘어나면 `/speckit-converge`로 `tasks.md`에 남은 작업을 추가 (임의로 명세 밖 기능을 구현하지 않음)
8. **이슈 전환(선택)** : 필요 시 `/speckit-taskstoissues`로 GitHub 이슈 생성

### 필수 규칙

- 명세(`docs/` 또는 `specs/.../spec.md`) 없이 구현 시작 금지
- 테스트 없이 구현 완료 선언 금지
- 명세와 불일치하는 구현 금지 — 불일치 발견 시 코드가 아니라 명세를 먼저 논의/수정
- `.specify/memory/constitution.md`는 아직 템플릿 상태 — 프로젝트 원칙을 정식으로 정하기 전까지는 이 CLAUDE.md의 "개발 규칙"이 그 역할을 대신함

## 최근 변경사항

`/changelog` 스킬로 기록됨. 자세한 내용은 `CHANGE_LOG.md` 참고. 14일 지난 항목은 자동 제거됨.

- 2026-09-25 [main] 프론트엔드 Phase 1~4 구현 완료(Button/Badge/Modal/ConfirmDialog/TicketCard/ColumnHeader/Column/Board), ticketApi.ts·useTicketForm 구현, 컴포넌트 프리뷰 페이지(`/preview`) 구축, 111개 테스트 전부 통과 (자세히: CHANGE_LOG.md)
- 2026-09-24 [main] 나머지 6개 API 엔드포인트(GET 보드/상세, PATCH 수정/완료/재정렬, DELETE) 구현 완료, seed.ts cwd 버그 및 timestamp 타임존 버그 수정, TC-API-002~008 통합 테스트 45개 전부 통과 (자세히: CHANGE_LOG.md)
