# Phase 1 Data Model: 티켓 생성 (POST /api/tickets)

> 전체 `tickets` 테이블 정의는 `docs/DATA_MODEL.md`가 정본(source of truth)이다. 이 문서는 "티켓 생성" 기능에서 실제로 관여하는 필드와 검증 규칙만 정리한다.

## Entity: Ticket

| 필드 | 타입 | 생성 시 동작 | 검증 규칙 |
|---|---|---|---|
| `id` | number | 시스템 자동 생성(auto-increment) | - |
| `title` | string | 사용자 입력(필수) | 1~200자, trim 후 공백만은 불가 |
| `description` | string \| null | 사용자 입력(선택) | 최대 1000자, 미입력 시 `null` |
| `status` | `'BACKLOG'` | 항상 고정값 | 사용자 입력 불가 (요청에 포함돼도 무시) |
| `priority` | `'LOW' \| 'MEDIUM' \| 'HIGH'` | 사용자 입력(선택), 기본값 `'MEDIUM'` | 정의된 3개 값만 허용 |
| `position` | number | 시스템 계산 | Backlog가 비어있으면 `0`, 아니면 `min(position) - 1024` |
| `plannedStartDate` | string(`YYYY-MM-DD`) \| null | 사용자 입력(선택) | 날짜 형식(`YYYY-MM-DD`) |
| `dueDate` | string(`YYYY-MM-DD`) \| null | 사용자 입력(선택) | 날짜 형식 + 오늘 이후만 허용(당일 미포함) |
| `startedAt` | timestamp \| null | 항상 `null` | 이 기능의 범위 밖 (TODO 이동 시에만 설정) |
| `completedAt` | timestamp \| null | 항상 `null` | 이 기능의 범위 밖 (Done 이동 시에만 설정) |
| `createdAt` | timestamp | 시스템 자동(`now()`) | - |
| `updatedAt` | timestamp | 시스템 자동(`now()`) | - |

## State

생성 시점에는 상태 전이가 없다 — 모든 신규 티켓은 항상 단일 상태(`BACKLOG`)로 시작한다. 다른 상태로의 전이(드래그앤드롭, 완료 처리)는 이 기능(001-ticket-creation)의 범위 밖이며 별도 기능(FR-005, FR-007)에서 다룬다.

## Validation Rules 출처

`src/shared/validations/ticket.ts`의 `createTicketSchema` (Zod) 가 아래 규칙을 그대로 구현한다:

- `title`: `required_error` + `min(1)` + `max(200)` + `refine(trim 비어있지 않음)`
- `description`: `max(1000)`, optional
- `priority`: `enum(['LOW','MEDIUM','HIGH'])`, optional
- `plannedStartDate`: `regex(/^\d{4}-\d{2}-\d{2}$/)`, optional
- `dueDate`: 위 정규식 + `refine(val >= 오늘 날짜 문자열)`, optional
