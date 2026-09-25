# Change Log

`/changelog` 스킬로 기록되는 변경 이력. 최신 항목이 위에 온다.

---

## [main] - 2026-09-25 19:08

### Prompt
> "frontend 구현함"

### Changes
- **Added**: `/changelog` 스킬 (`.claude/skills/changelog/SKILL.md`)
- **Added**: 프론트엔드 개발 계획 문서, 컴포넌트 프리뷰 갤러리 페이지 (`docs/FRONTEND_TASKS.md`, `app/preview/page.tsx`)
- **Added**: Phase 1 말단 컴포넌트 — `Button`, `Badge.tsx`(`PriorityBadge`/`DueDateBadge` 통합, 재노출 shim 유지), `Modal`, `ConfirmDialog`
- **Added**: Phase 3 — `TicketCard` (`@dnd-kit/sortable` 연동, `data-overdue`/`data-priority` 속성 기반 스타일링)
- **Added**: Phase 4 — `ColumnHeader`, `Column`(구 BoardColumn, BACKLOG 포함 범용화), `Board`(BacklogSidebar 흡수, 사이드바+3컬럼 레이아웃)
- **Added**: Phase 2 — `ticketApi.ts`(API_SPEC.md 7개 엔드포인트 fetch 클라이언트), `useTicketForm`(Zod 검증 폼 훅)
- **Modified**: `app/globals.css`에 `.ticket-card`/`.ticket-card--done`/`data-overdue` 선택자 등 컴포넌트 스타일 추가
- **Modified**: `src/shared/types/index.ts`에 `Ticket`/`TicketStatus`/`TicketPriority`/`ReorderTicketInput` 타입 보강(기존 누락된 타입 에러 수정)

### Files Modified
- `CLAUDE.md` (+6, -0)
- `app/globals.css` (+85, -0 누적)
- `app/preview/page.tsx` (+281, -0 누적, 신규)
- `docs/FRONTEND_TASKS.md` (+245, -0 누적, 신규)
- `src/client/api/ticketApi.ts` (+54, -0)
- `src/client/components/Badge.tsx` (+41, -0)
- `src/client/components/Board.tsx` (+34, -0)
- `src/client/components/Button.tsx` (+39, -0)
- `src/client/components/Column.tsx` (+36, -0)
- `src/client/components/ColumnHeader.tsx` (+13, -0)
- `src/client/components/ConfirmDialog.tsx` (+27, -0)
- `src/client/components/DueDateBadge.tsx` (+1, -0, shim으로 축소)
- `src/client/components/Modal.tsx` (+39, -0)
- `src/client/components/PriorityBadge.tsx` (+1, -0, shim으로 축소)
- `src/client/components/TicketCard.tsx` (+55, -0)
- `src/client/hooks/useTicketForm.ts` (+48, -0)
- `src/shared/types/index.ts` (+43, -0 누적)
- `__tests__/client/api/ticketApi.test.ts` (+126, -0)
- `__tests__/client/hooks/useTicketForm.test.ts` (+101, -0)
- `__tests__/components/Board.test.tsx` (+100, -0)
- `__tests__/components/Button.test.tsx` (+94, -0)
- `__tests__/components/Column.test.tsx` (+121, -0)
- `__tests__/components/ColumnHeader.test.tsx` (+28, -0)
- `__tests__/components/ConfirmDialog.test.tsx` (+92, -0)
- `__tests__/components/DueDateBadge.test.tsx` (+24, -0)
- `__tests__/components/Modal.test.tsx` (+74, -0)
- `__tests__/components/PriorityBadge.test.tsx` (+25, -0)
- `__tests__/components/TicketCard.test.tsx` (+110, -0)

### Tests
- `npm test`: 111 passed, 111 total (15 suites)

---

## [main] - 2026-09-24 18:36

### Prompt
> "백엔드완료, seed.ts 완료, 테스트 데이터 추가"

### Changes
- **Added**: PATCH `/api/tickets/:id`, GET `/api/tickets/:id`, DELETE `/api/tickets/:id` 라우트 핸들러 (`app/api/tickets/[id]/route.ts`)
- **Added**: PATCH `/api/tickets/:id/complete` 완료 처리 핸들러 (`app/api/tickets/[id]/complete/route.ts`)
- **Added**: PATCH `/api/tickets/reorder` 드래그앤드롭 재정렬 핸들러 (`app/api/tickets/reorder/route.ts`)
- **Added**: DB 시드 스크립트, `.env.local` 절대경로 로딩으로 cwd 무관하게 동작하도록 구현 (`src/server/db/seed.ts`)
- **Added**: TC-API-003~007 통합 테스트 3개 파일 (`__tests__/api/tickets-complete.test.ts`, `tickets-id.test.ts`, `tickets-reorder.test.ts`)
- **Added**: `updateTicketSchema`, `reorderTicketSchema` Zod 검증 스키마 (`src/shared/validations/ticket.ts`)
- **Added**: Spec Kit `001-ticket-creation` 기능 명세 산출물 (`specs/001-ticket-creation/`)
- **Modified**: `getBoard`, `getTicketById`, `updateTicket`, `completeTicket`, `deleteTicket`, `reorderTicket` 서비스 로직 구현, 빈 PATCH body 시 크래시하던 버그 수정 (`src/server/services/ticketService.ts`)
- **Modified**: `GET /api/tickets` 보드 조회 라우트 추가 (`app/api/tickets/route.ts`)
- **Modified**: `createdAt`/`updatedAt`/`startedAt`/`completedAt` 컬럼에 `withTimezone: true` 적용 — 세션 타임존(Asia/Seoul) 때문에 9시간 밀려 저장되던 버그 수정 (`src/server/db/schema.ts`)
- **Modified**: TC-API-002, TC-API-008 보드 조회/오버듀 테스트 추가 (`__tests__/api/tickets.test.ts`)
- **Modified**: timezone 수정 사항 반영 (`docs/DATA_MODEL.md`)
- **Modified**: `allowImportingTsExtensions` 활성화로 `.ts` 확장자 상대경로 import 허용 (`tsconfig.json`)
- **Deleted**: 빈 플레이스홀더 파일 정리 (`app/api/tickets/[id]/.gitkeep`)

### Files Modified
- `__tests__/api/tickets-complete.test.ts` (+51, -0)
- `__tests__/api/tickets-id.test.ts` (+168, -0)
- `__tests__/api/tickets-reorder.test.ts` (+138, -0)
- `__tests__/api/tickets.test.ts` (+144, -7)
- `app/api/tickets/[id]/.gitkeep` (+0, -0)
- `app/api/tickets/[id]/complete/route.ts` (+18, -0)
- `app/api/tickets/[id]/route.ts` (+53, -0)
- `app/api/tickets/reorder/route.ts` (+31, -0)
- `app/api/tickets/route.ts` (+6, -1)
- `docs/DATA_MODEL.md` (+6, -4)
- `specs/001-ticket-creation/contracts/post-tickets.md` (+62, -0)
- `specs/001-ticket-creation/data-model.md` (+34, -0)
- `specs/001-ticket-creation/plan.md` (+85, -0)
- `specs/001-ticket-creation/quickstart.md` (+38, -0)
- `specs/001-ticket-creation/research.md` (+33, -0)
- `specs/001-ticket-creation/tasks.md` (+175, -0)
- `src/server/db/index.ts` (+2, -2)
- `src/server/db/schema.ts` (+4, -4)
- `src/server/db/seed.ts` (+26, -0)
- `src/server/services/ticketService.ts` (+169, -2)
- `src/shared/validations/ticket.ts` (+41, -0)
- `tsconfig.json` (+1, -0)

### Tests
- `npm test`: 45 passed, 45 total (4 suites)

---
