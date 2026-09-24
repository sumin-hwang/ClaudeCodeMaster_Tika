# Change Log

`/changelog` 스킬로 기록되는 변경 이력. 최신 항목이 위에 온다.

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
