# Phase 0 Research: 티켓 생성 (POST /api/tickets)

이 기능은 이미 구현·검증되어 있어 미해결 NEEDS CLARIFICATION이 없다. 아래는 구현 과정에서 실제로 내려진 핵심 기술 결정을 소급 정리한 것이다 (사용자가 계획에서 특히 강조한 Zod 검증 / Route Handler / Service 레이어 분리 3가지 포함).

## 1. Zod 요청 검증 위치

- **Decision**: 단일 공유 Zod 스키마(`src/shared/validations/ticket.ts`)를 프론트/백엔드가 함께 사용한다.
- **Rationale**: Constitution IV(Zod 기반 요청 검증)에 따라 검증되지 않은 입력이 서비스 로직에 도달해서는 안 된다. 프론트와 백엔드가 각자 다른 검증 로직을 두면 규칙이 어긋날 위험이 있다.
- **Alternatives considered**: 백엔드 전용 Zod 스키마 + 프론트엔드 별도 검증 로직 — 두 로직이 시간이 지나며 drift할 위험이 있어 기각.

## 2. Route Handler의 책임 범위

- **Decision**: `app/api/tickets/route.ts`는 `request.json()` 파싱 → `createTicketSchema.safeParse()` → 실패 시 표준 에러 응답, 성공 시 `createTicket()` 호출 → 응답 반환만 수행한다.
- **Rationale**: Constitution V(서비스 계층 분리)에 따라 비즈니스 로직은 서비스 계층에 있어야 하며, Route Handler가 두꺼워지면 API 계층만 단독으로 테스트하기 어려워진다.
- **Alternatives considered**: Route Handler 안에서 position 계산과 DB insert를 직접 수행 — 재사용성과 단위 테스트 용이성이 떨어져 기각.

## 3. Service 레이어(`ticketService.createTicket`)의 책임 범위

- **Decision**: position 계산(Backlog가 비어있으면 `0`, 아니면 `최솟값 - 1024`)과 Drizzle insert를 모두 서비스 함수 하나에 둔다.
- **Rationale**: "새 티켓이 Backlog 맨 위에 보이도록 정렬"이라는 비즈니스 규칙은 API 계약과 독립적으로 재사용될 가능성이 있다(추후 reorder/이동 기능에서도 유사한 position 계산이 필요).
- **Alternatives considered**: DB 트리거/디폴트 값으로 position을 자동 계산 — Constitution의 "Drizzle ORM만 사용, raw SQL 금지" 원칙 및 트랜잭션 가시성 저하 문제로 기각.

## 4. DB 드라이버 선택

- **Decision**: 로컬 개발/테스트는 `postgres`(postgres-js) 드라이버 + `drizzle-orm/postgres-js` + `DATABASE_URL` 환경변수를 사용한다.
- **Rationale**: 사용자가 실제 로컬 PostgreSQL(포트 5432)에 연결하기를 원했고, 이 드라이버는 표준 Postgres 와이어 프로토콜로 로컬 DB에 직접 연결 가능하다.
- **Alternatives considered**:
  - `@vercel/postgres`(TRD.md 원안): Neon/Vercel Postgres 전용 fetch 기반 드라이버라 일반 로컬 Postgres에는 연결 불가 — 로컬 개발 요구사항에 맞지 않아 기각(배포 단계에서는 재검토 대상).
  - `@electric-sql/pglite`(임시 인메모리 Postgres): 실제 영속 DB가 아니어서 로컬 개발용으로는 적합하지 않음 — 테스트를 우선 통과시키기 위한 임시 조치로만 사용 후 교체.

## Output

모든 기술 컨텍스트 항목이 확정되어 있으며 NEEDS CLARIFICATION 없음.
