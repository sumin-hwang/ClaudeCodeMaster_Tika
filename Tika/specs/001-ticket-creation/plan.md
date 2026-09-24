# Implementation Plan: 티켓 생성 (POST /api/tickets)

**Branch**: `001-ticket-creation` | **Date**: 2026-09-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-ticket-creation/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

사용자가 제목(필수)과 선택적으로 설명/우선순위/시작예정일/종료예정일을 입력해 새 티켓을 Backlog에 등록한다. Next.js App Router의 얇은 Route Handler가 Zod로 요청을 검증한 뒤 Service 레이어에 위임하고, Service가 Drizzle ORM으로 position을 계산해 DB에 저장한다. 이 기능은 이미 구현·테스트되어 있으며, 이 계획은 그 구조를 SDD 형식으로 문서화한다.

## Technical Context

**Language/Version**: TypeScript 5.x (strict)

**Primary Dependencies**: Next.js 15 (App Router), Zod, Drizzle ORM, `postgres`(postgres-js 드라이버)

**Storage**: PostgreSQL — 로컬 개발/테스트는 `postgres` 드라이버 + `DATABASE_URL`(`.env.local`/`.env.test`), 배포 시 Vercel Postgres/Neon 전환 예정(docs/TRD.md 참고)

**Testing**: Jest — `__tests__/api/tickets.test.ts`(TC-API-001-01~09). `@jest-environment node` pragma로 Route Handler를 직접 import해 호출하는 통합 테스트 방식

**Target Platform**: Vercel Serverless Functions (Node.js 런타임)

**Project Type**: Web service — 단일 Next.js 프로젝트 안에서 `app/api`(백엔드 진입점) / `src/server`(백엔드 로직) / `src/client`(프론트엔드) / `src/shared`(공유)로 디렉터리 분리

**Performance Goals**: docs/REQUIREMENTS.md NFR-001 기준 API 응답 300ms 이내(p95) — 단일 select+insert 쿼리이므로 별도 최적화 없이 충족 범위

**Constraints**: 요청/응답 형식과 에러 코드는 docs/API_SPEC.md를 그대로 따름, 에러 응답은 `{ error: { code, message } }` 고정 형식

**Scale/Scope**: MVP 단일 사용자(docs/PRD.md 2장) — 이 계획은 티켓 생성 엔드포인트 1개만 다룸

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 상태 | 근거 |
|---|---|---|
| I. TypeScript Strict Mode | PASS | `tsconfig.json`의 `strict: true`, `any` 미사용. `CreateTicketInput`은 `z.infer<typeof createTicketSchema>`로 도출 |
| II. API 계약 준수 | PASS | `route.ts` 응답이 `docs/API_SPEC.md` "POST /api/tickets" 예시와 동일 (TC-API-001-01/02로 검증) |
| III. 통일된 에러 응답 형식 | PASS | 실패 시 항상 `{ error: { code: 'VALIDATION_ERROR', message } }` 반환 (TC-API-001-03~08) |
| IV. Zod 기반 요청 검증 | PASS | `src/shared/validations/ticket.ts`의 `createTicketSchema`로 전 필드 검증, `route.ts`가 서비스 호출 전 `safeParse` 수행 |
| V. 서비스 계층 분리 | PASS | `route.ts`는 파싱 → 검증 → `createTicket()` 호출 → 응답만 수행. position 계산·DB insert는 전부 `ticketService.ts`에 위치 |

위반 없음. Complexity Tracking 불필요.

## Project Structure

### Documentation (this feature)

```text
specs/001-ticket-creation/
├── spec.md               # 기능 명세 (완료)
├── plan.md               # 이 파일
├── research.md           # Phase 0 산출물
├── data-model.md         # Phase 1 산출물
├── quickstart.md         # Phase 1 산출물
├── contracts/
│   └── post-tickets.md   # Phase 1 산출물
└── tasks.md               # /speckit-tasks에서 생성 (아직 없음)
```

### Source Code (repository root)

```text
app/api/tickets/route.ts               # Route Handler(POST): 파싱 → 검증 → 서비스 호출 → 응답
src/server/services/ticketService.ts   # createTicket(): position 계산 + Drizzle insert
src/server/db/schema.ts                # tickets 테이블 정의 (Drizzle pg-core)
src/server/db/client.ts                # DB 커넥션 (postgres 드라이버)
src/server/db/index.ts                 # db/tickets 재노출 + resetTickets() 테스트 유틸
src/shared/validations/ticket.ts       # createTicketSchema (Zod) — 프론트/백 공유
__tests__/api/tickets.test.ts          # TC-API-001-01~09
```

**Structure Decision**: Single project(Option 1)의 변형 — 프론트/백엔드를 하나의 Next.js 프로젝트 안에서 디렉터리 수준으로 분리(`app/api` vs `src/client`)하고, `src/shared`로 타입·검증 스키마를 공유한다. `docs/TRD.md` 1.3절 디렉터리 구조와 동일.

## Complexity Tracking

해당 없음 — Constitution Check 위반 없음.

---

## Post-Design Constitution Re-Check

Phase 1 설계(data-model.md, contracts/, quickstart.md)에서 기존 구조 외에 새로 추가된 컴포넌트가 없으므로, 위 Constitution Check 결과가 그대로 유지된다. 재위반 없음.
