# TRD.md - Tika (Ticket + Kanban Board) 기술 요구사항

> [CLAUDE.md](../CLAUDE.md), [PRD.md](./PRD.md)를 기반으로 작성된 기술 설계 문서.

## 1. 시스템 아키텍처

### 1.1 전체 구조

Tika는 **Vercel 단일 배포** 구조를 사용한다. 별도의 백엔드 서버 없이 하나의 Next.js 프로젝트 안에서 프론트엔드(App Router 페이지/컴포넌트)와 백엔드(API Routes, 즉 Route Handler)를 함께 배포한다.

- 프론트엔드: Next.js App Router (React 19)
- 백엔드: Next.js API Routes (`app/api/`) → Vercel Serverless Functions로 실행
- DB: Vercel Postgres (Neon 기반)

단일 리포지토리 · 단일 배포 파이프라인으로 운영 복잡도를 최소화하고, MVP(단일 사용자) 규모에 맞는 가장 단순한 구조를 채택한다.

### 1.2 아키텍처 다이어그램

```
┌────────────────┐        fetch (JSON)        ┌─────────────────────┐
│  src/client/    │ ─────────────────────────> │  app/api/            │
│  (Components,   │                            │  (Route Handlers)    │
│   hooks, api)   │ <───────────────────────── │  요청 파싱 + 응답만    │
└────────────────┘        JSON 응답            └─────────────────────┘
                                                          │
                                                          │ 함수 호출
                                                          ▼
                                                ┌─────────────────────┐
                                                │  src/server/services/│
                                                │  (ticketService 등)   │
                                                │  비즈니스 로직         │
                                                └─────────────────────┘
                                                          │
                                                          │ Drizzle Query
                                                          ▼
                                                ┌─────────────────────┐
                                                │  Drizzle ORM         │
                                                │  (src/server/db/)    │
                                                └─────────────────────┘
                                                          │
                                                          │ SQL (커넥션 풀)
                                                          ▼
                                                ┌─────────────────────┐
                                                │  Vercel Postgres     │
                                                │  (Neon)              │
                                                └─────────────────────┘
```

흐름: **프론트엔드 → Route Handler → Service → Drizzle → DB**
Route Handler는 요청 파싱과 응답 반환만 담당하며, 실제 비즈니스 로직은 반드시 `src/server/services/`를 거친다.

### 1.3 디렉터리 구조

```
.
├── app/
│   └── api/
│       └── tickets/
│           ├── route.ts          # GET(목록 조회), POST(생성)
│           └── [id]/
│               └── route.ts      # GET/PATCH/DELETE(단건 조회/수정/삭제)
│
├── src/
│   ├── server/                   # 백엔드 로직 (진입점 X, 로직만)
│   │   ├── db/                   # Drizzle 스키마, 클라이언트 초기화
│   │   ├── services/             # ticketService.ts 등 비즈니스 로직
│   │   └── middleware/           # 에러 핸들링 등 공통 처리
│   │
│   ├── client/                   # 프론트엔드 로직
│   │   ├── components/           # TicketCard, BoardColumn 등
│   │   ├── hooks/                # useTickets, useDragAndDrop 등
│   │   └── api/
│   │       └── ticketApi.ts      # fetch 기반 API 호출 (유일한 통로)
│   │
│   └── shared/                   # 프론트/백엔드 공유
│       ├── types/                # Ticket, BoardData 등 타입
│       ├── validations/          # Zod 스키마
│       └── constants/            # 컬럼 정의 등 상수
│
└── docs/                         # 프로젝트 명세 문서
```

## 2. 기술 스택 상세

| 기술 | 버전 | 선정 이유 | 대안 비교 |
|---|---|---|---|
| **Next.js** | 15 (App Router) | 프론트엔드/백엔드를 단일 프로젝트·단일 배포로 통합 가능. Route Handler가 API 서버 역할을 겸해 별도 백엔드 인프라 불필요 | Remix(백엔드 라우팅 유사하나 Vercel 생태계 통합도 낮음), Express+CRA 분리 구조(배포/운영 복잡도 증가로 MVP에 과함) |
| **Node.js Runtime** | Vercel Serverless Functions (Node.js 런타임) | Drizzle/Postgres 드라이버가 Node.js API(TCP 소켓 등)에 의존하므로 Node 런타임 필요 | Edge Runtime(콜드스타트는 빠르지만 Node 기반 DB 드라이버 미지원으로 Postgres 직접 연결 불가) |
| **TypeScript** | 5.x (strict) | 컴파일 타임 타입 검증으로 런타임 오류 사전 방지, `any` 금지 규칙과 결합해 타입 안정성 강화 | JavaScript(런타임 검증만 가능, 리팩터링 시 회귀 위험 증가) |
| **React** | 19 | Next.js 15와 호환성 최적화, 최신 컴포넌트 모델 | React 18(구버전, 신규 기능 미지원) |
| **Tailwind CSS** | 4 | 유틸리티 클래스 기반으로 칸반 보드처럼 반복되는 카드/컬럼 UI를 빠르게 구현, 디자인 일관성 유지 | CSS Modules(속도는 유사하나 디자인 토큰 공유가 번거로움), styled-components(런타임 오버헤드 존재) |
| **@dnd-kit/core + @dnd-kit/sortable** | 최신 | 접근성(a11y) 지원, React 19와 호환, 컬럼 간 이동 + 컬럼 내 정렬을 함께 지원 | react-beautiful-dnd(유지보수 중단), HTML5 Drag and Drop API 직접 구현(접근성/모바일 지원 직접 구현 필요로 비용 큼) |
| **Drizzle ORM** | 최신 | Vercel Postgres 공식 지원(`drizzle-orm/vercel-postgres`), **코드 생성(generate) 단계 불필요**, SQL에 가까운 타입세이프 쿼리로 서버리스 콜드스타트에 유리(경량 런타임, 쿼리 엔진 바이너리 없음) | **Prisma**: DX는 우수하나 스키마 변경 시 `prisma generate` 코드 생성 단계가 필수이고, 별도의 쿼리 엔진 바이너리를 번들에 포함해 서버리스 함수 콜드스타트/번들 크기에 불리함 |
| **Vercel Postgres (Neon)** | - | Vercel 배포 환경과 네이티브 통합(환경변수 자동 주입), **서버리스 커넥션 풀 자동 관리**로 Lambda의 동시 커넥션 문제를 별도 설정 없이 해결 | Supabase(Postgres 기반이나 Auth 등 부가 기능이 MVP 범위를 초과), PlanetScale(MySQL 기반이라 외래키 제약 처리 방식이 상이), 자체 호스팅 Postgres(커넥션 풀링/운영을 직접 구성해야 함) |
| **Zod** | 최신 | 런타임 요청 검증과 TypeScript 타입 추론을 동시에 처리, `src/shared/validations`에서 프론트/백엔드가 동일 스키마 공유 | Yup(TS 타입 추론 연동이 상대적으로 약함), 수동 검증(중복 코드 및 누락 위험) |
| **Jest + React Testing Library** | 최신 | 단위/컴포넌트 테스트 작성이 쉽고, TDD 사이클(TEST_CASES.md 우선 작성) 지원 | Vitest(속도는 빠르나 Next.js 15 + RTL 조합 안정성 기준으로 Jest 채택) |
| **Vercel** | - | Next.js와 네이티브 통합된 배포 파이프라인, Vercel Postgres와 원스톱 운영 | AWS(Amplify 등)/Netlify(Next.js App Router의 서버 기능 통합도가 Vercel 대비 낮음) |

## 3. 데이터 흐름

### 3.1 읽기 흐름 (Read)

```
컴포넌트(BoardPage)
   │  useEffect / SWR 등으로 호출
   ▼
src/client/api/ticketApi.ts  (getTickets())
   │  fetch GET
   ▼
app/api/tickets/route.ts  (GET)
   │  요청 파싱 → 서비스 호출
   ▼
src/server/services/ticketService.ts  (getTickets())
   │  Drizzle select
   ▼
Vercel Postgres (DB)
   │  결과 row 반환
   ▼
ticketService → route.ts → JSON 응답 → ticketApi.ts → 컴포넌트 상태 갱신
```

### 3.2 쓰기 흐름 (Create/Update)

```
폼(TicketForm)
   │  1) 클라이언트단 Zod 검증 (src/shared/validations)
   ▼
src/client/api/ticketApi.ts  (createTicket() / updateTicket())
   │  fetch POST / PATCH
   ▼
app/api/tickets/route.ts (POST) 또는 app/api/tickets/[id]/route.ts (PATCH)
   │  2) 서버단 Zod 재검증 (동일 스키마, 방어적 이중 검증)
   ▼
src/server/services/ticketService.ts  (createTicket() / updateTicket())
   │  Drizzle insert / update
   ▼
Vercel Postgres (DB)
   │  저장된 결과 반환
   ▼
ticketService → route.ts → JSON 응답 → ticketApi.ts → 폼/보드 상태 갱신
```

클라이언트/서버 양쪽에서 동일한 Zod 스키마(`src/shared/validations`)를 사용해 이중 검증하며, 서버 검증을 신뢰 경계(trust boundary)로 삼는다.

### 3.3 드래그 앤 드롭 흐름

```
1) 사용자가 티켓 카드를 드래그하여 다른 컬럼/위치에 드롭 (@dnd-kit onDragEnd)
2) 낙관적 업데이트(Optimistic Update)
   - 서버 응답을 기다리지 않고 클라이언트 상태(status, position)를 즉시 변경
   - 사용자에게는 즉각적인 UI 반응 제공
3) PATCH /api/tickets/:id 요청 전송
   - body: { status: "in_progress", position: <재계산된 위치값> }
4) ticketService.moveTicket()
   - 대상 컬럼 내 다른 티켓들의 position을 재계산 (정렬 순서 유지)
   - Drizzle 트랜잭션으로 상태(status) + position 동시 업데이트
5) 응답 처리
   - 성공: 서버 확정 값으로 클라이언트 상태 재동기화(불일치 시 보정)
   - 실패(네트워크 오류 등): 드래그 이전 상태로 롤백하고 사용자에게 알림
```

## 4. 계층 간 경계 규칙

- **`src/server/` ↔ `src/client/` 상호 import 금지.**
  - `src/server/`는 React, 브라우저 API 등 프론트엔드 관련 코드를 포함하지 않는다.
  - `src/client/`는 Drizzle, DB 커넥션 등 백엔드 전용 모듈을 import하지 않는다.
  - 프론트엔드는 오직 `src/client/api/ticketApi.ts`(fetch 기반)를 통해서만 백엔드와 통신한다.
- **`src/shared/`만 양쪽에서 참조 가능.**
  - `src/server/`와 `src/client/`가 공통으로 필요한 타입(`src/shared/types`), 검증 스키마(`src/shared/validations`), 상수(`src/shared/constants`)는 반드시 `src/shared/`에 위치시킨다.
  - 각 계층은 서로를 직접 참조하지 않고, `src/shared/`를 통해서만 간접적으로 정의를 공유한다.
- **Route Handler는 얇게 유지: 요청 파싱 → 서비스 호출 → 응답 반환.**
  - `app/api/`의 Route Handler는 요청 파싱(및 필요 시 Zod 검증 호출) → `src/server/services/` 함수 호출 → 결과를 응답으로 반환하는 역할만 수행한다.
  - 비즈니스 로직(DB 쿼리, position 재계산 등)을 Route Handler에 직접 작성하지 않고 반드시 `src/server/services/`로 위임한다.
- 백엔드 작업 시 `src/client/` 코드를 수정하지 않고, 프론트엔드 작업 시 `app/api/`, `src/server/` 코드를 수정하지 않는다(CLAUDE.md 경계 규칙과 동일).
- 위 규칙은 ESLint의 `no-restricted-imports`(또는 `import/no-restricted-paths`) 규칙으로 강제하는 것을 권장한다.

## 5. 개발 환경 설정

| 항목 | 내용 |
|---|---|
| 로컬 DB | `vercel env pull`로 Vercel 프로젝트의 환경 변수(Postgres 연결 정보 등)를 로컬 `.env.local`로 가져와 사용. 별도의 로컬 DB 구축 없이 Vercel Postgres(Neon)에 직접 연결 |
| 테스트 | Jest + React Testing Library. TDD 사이클에 따라 TEST_CASES.md의 테스트를 기능 구현 전에 먼저 작성 |
| Lint | ESLint + Prettier. TypeScript strict 규칙, `any` 사용 금지, import 경계 규칙(`src/server/` ↔ `src/client/` 금지)을 ESLint 규칙으로 강제 |

## 6. 배포 전략

| 항목 | 내용 |
|---|---|
| 프로덕션 배포 | `main` 브랜치에 push 시 Vercel이 자동으로 프로덕션 배포 수행 |
| Preview 배포 | PR(Pull Request) 생성 시 Vercel이 해당 브랜치 기준 Preview 배포를 자동 생성, 리뷰어가 실제 배포 환경에서 변경사항 확인 가능 |
| 환경 변수 관리 | DB 연결 정보 등 환경 변수는 코드/리포지토리에 포함하지 않고 Vercel Dashboard에서 관리. 로컬 개발 시에는 `vercel env pull`로 동기화 |
