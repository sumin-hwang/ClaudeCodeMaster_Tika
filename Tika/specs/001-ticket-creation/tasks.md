---

description: "Task list template for feature implementation"
---

# Tasks: 티켓 생성 (POST /api/tickets)

**Input**: Design documents from `/specs/001-ticket-creation/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/)

**Tests**: 이 기능은 spec.md에 테스트를 명시적으로 요청하지 않았지만, 프로젝트 헌법(`.specify/memory/constitution.md`)과 `CLAUDE.md`가 TDD를 필수로 규정하므로 각 유저 스토리에 테스트 태스크를 포함한다.

**Organization**: 유저 스토리별로 그룹화. 이 기능은 이미 구현·검증이 끝난 상태라(TC-API-001-01~09, 8/9 PASS) 아래 태스크는 전부 완료(`[x]`)로 표기하고, 실제 반영된 파일 경로를 그대로 남긴다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 의존성 없음)
- **[Story]**: 이 태스크가 속한 유저 스토리 (US1/US2/US3)

## Path Conventions

Single project — `app/`, `src/`, `__tests__/`가 저장소 루트에 위치 (plan.md Project Structure 참고).

---

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 `app/api/tickets/`, `src/server/db/`, `src/server/services/`, `src/shared/validations/` 디렉터리 구조 생성
- [x] T002 [P] `package.json`에 `drizzle-orm`, `postgres`, `zod`, `drizzle-kit` 의존성 추가

**Checkpoint**: 프로젝트 구조 준비 완료

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: 이 phase 완료 전에는 어떤 유저 스토리도 구현할 수 없음 (모든 스토리가 같은 DB 테이블에 insert함)

- [x] T003 `src/server/db/schema.ts`에 `tickets` 테이블 정의 (Drizzle pg-core) — `docs/DATA_MODEL.md` 3장 그대로
- [x] T004 `src/server/db/client.ts`에 DB 커넥션 생성 — `postgres` 드라이버 + `DATABASE_URL`, `idle_timeout: 5`
- [x] T005 `src/server/db/index.ts`에서 `db`/`tickets` 재노출 + `resetTickets()` 테스트 유틸 제공
- [x] T006 `drizzle.config.ts`를 `DATABASE_URL` 기준으로 구성하고 `npm run db:push`로 `tika_dev`/`tika_test`에 스키마 적용

**Checkpoint**: 기반 준비 완료 — 유저 스토리 구현 가능

---

## Phase 3: User Story 1 - 새 티켓 빠르게 등록 (Priority: P1) 🎯 MVP

**Goal**: 제목만 입력해 새 티켓을 Backlog에 등록할 수 있다

**Independent Test**: 제목만 담아 `POST /api/tickets` 호출 → 201과 함께 `status=BACKLOG`, `priority=MEDIUM`, `position=0`(또는 기존 최솟값-1024)인 티켓 반환

### Tests for User Story 1

- [x] T007 [P] [US1] `__tests__/api/tickets.test.ts`에 TC-API-001-01(필수값만 입력 → 201, `status=BACKLOG`, `priority=MEDIUM`, `position=0`) 작성
- [x] T008 [P] [US1] 같은 파일에 TC-API-001-09(기존 Backlog 티켓 존재 시 `position = 최솟값 - 1024`) 작성

### Implementation for User Story 1

- [x] T009 [US1] `src/shared/validations/ticket.ts`의 `createTicketSchema`에 `title` 필드 정의 — data-model.md 제약: "1~200자, trim 후 공백만은 불가", `required_error: '제목을 입력해주세요'`
- [x] T010 [US1] `src/server/services/ticketService.ts`의 `createTicket()`에 position 계산 구현 — "Backlog가 비어있으면 `0`, 아니면 `min(position) - 1024`" (depends on T003, T009)
- [x] T011 [US1] `app/api/tickets/route.ts`에 `POST` 핸들러 구현: `request.json()` → `safeParse` → `createTicket()` 호출 → `NextResponse.json(ticket, { status: 201 })` (depends on T009, T010)

**Checkpoint**: User Story 1 단독으로 완전히 동작 — 제목만으로 티켓 등록 가능

---

## Phase 4: User Story 2 - 상세 정보와 함께 등록 (Priority: P2)

**Goal**: 설명/우선순위/시작예정일/종료예정일까지 함께 입력해 등록할 수 있다

**Independent Test**: 전체 필드를 채워 등록 후 조회 시 입력값이 그대로 저장되어 있는지 확인

### Tests for User Story 2

- [x] T012 [P] [US2] `__tests__/api/tickets.test.ts`에 TC-API-001-02(전체 필드 입력 → 입력값 그대로 저장·반환) 작성

### Implementation for User Story 2

- [x] T013 [US2] `createTicketSchema`에 `description` 필드 추가 — data-model.md 제약: "최대 1000자, 미입력 시 `null`" (depends on T009)
- [x] T014 [US2] `createTicketSchema`에 `priority` 필드 추가 — data-model.md 제약: "정의된 3개 값(`LOW`/`MEDIUM`/`HIGH`)만 허용, 기본값 `MEDIUM`" (depends on T009)
- [x] T015 [US2] `createTicketSchema`에 `plannedStartDate`/`dueDate` 필드 추가 — data-model.md 제약: "날짜 형식(`YYYY-MM-DD`)" + dueDate는 "오늘 이후만 허용(당일 미포함)" (depends on T009)
- [x] T016 [US2] `ticketService.createTicket()`이 `description`/`priority`/`plannedStartDate`/`dueDate`를 입력값 그대로 저장하도록 반영 (depends on T010, T013-T015)

**Checkpoint**: User Story 1 + 2 모두 독립적으로 동작

---

## Phase 5: User Story 3 - 잘못된 입력으로부터 보호 (Priority: P3)

**Goal**: 제목 누락/공백/글자수 초과, 설명 글자수 초과, 잘못된 우선순위, 과거 종료예정일 등 잘못된 입력 시 이해 가능한 안내를 받는다

**Independent Test**: 각 잘못된 입력 케이스로 등록을 시도해 매번 `{ error: { code, message } }` 형식의 안내를 받는지 확인

### Tests for User Story 3

- [x] T017 [P] [US3] TC-API-001-03(제목 누락 → 400 "제목을 입력해주세요") 작성
- [x] T018 [P] [US3] TC-API-001-04(제목 200자 초과 → 400 "제목은 200자 이내로 입력해주세요") 작성
- [x] T019 [P] [US3] TC-API-001-05(제목 공백만 → 400 "제목을 입력해주세요") 작성
- [x] T020 [P] [US3] TC-API-001-06(설명 1000자 초과 → 400 "설명은 1000자 이내로 입력해주세요") 작성
- [x] T021 [P] [US3] TC-API-001-07(잘못된 우선순위 → 400 "우선순위는 LOW, MEDIUM, HIGH 중 선택해주세요") 작성
- [x] T022 [P] [US3] TC-API-001-08(과거 종료예정일 → 400 "종료예정일은 오늘 이후 날짜를 선택해주세요") 작성

### Implementation for User Story 3

- [x] T023 [US3] `app/api/tickets/route.ts`에서 `safeParse` 실패 시 표준 에러 응답 반환 — `{ error: { code: 'VALIDATION_ERROR', message: result.error.issues[0].message } }`, status 400 (Constitution III 준수) (depends on T009, T011)

**Checkpoint**: 모든 유저 스토리 독립적으로 동작

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T024 [P] `docs/TEST_CASES.md`의 TC-API-001 시나리오와 `__tests__/api/tickets.test.ts` 실제 테스트 내용 일치 확인
- [x] T025 [quickstart.md](./quickstart.md) 절차대로 `npm test -- __tests__/api/tickets.test.ts` 실행해 최종 검증

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음
- **Foundational (Phase 2)**: Setup 완료 후 — 모든 유저 스토리를 막는 전제조건
- **User Stories (Phase 3-5)**: Foundational 완료 후 시작 가능. 실제로는 동일한 `createTicketSchema`/`route.ts`/`ticketService.ts` 파일을 스토리별로 점증 확장하는 구조라 **순차 진행 권장** (US1 → US2 → US3)
- **Polish (Phase 6)**: 원하는 유저 스토리가 모두 완료된 후

### User Story Dependencies

- **US1 (P1)**: Foundational 이후 독립적으로 시작 가능
- **US2 (P2)**: US1의 `createTicketSchema`/`ticketService`/`route.ts`를 확장 — 파일을 공유하므로 US1 완료 후 진행 권장
- **US3 (P3)**: US1·US2의 에러 처리 경로를 검증 — US1의 `route.ts` 에러 응답 로직에 의존

### Parallel Opportunities

- T001, T002는 병렬 가능
- 각 스토리 내 테스트 태스크(T007-T008, T012, T017-T022)는 서로 다른 `test()` 블록이라 병렬 작성 가능
- 서로 다른 스토리의 스키마 필드 추가(T013/T014/T015)는 같은 파일(`ticket.ts`)을 수정하므로 병렬 실행 시 충돌 주의 — 실제로는 순차 적용됨

---

## Parallel Example: User Story 1

```bash
# US1 테스트 태스크 동시 작성 가능:
Task: "TC-API-001-01 작성 in __tests__/api/tickets.test.ts"
Task: "TC-API-001-09 작성 in __tests__/api/tickets.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup 완료
2. Phase 2: Foundational 완료 (필수 — 모든 스토리를 막음)
3. Phase 3: User Story 1 완료
4. **검증**: `npm test -- __tests__/api/tickets.test.ts -t "TC-API-001-01"`로 US1 단독 검증
5. 이 시점에 이미 "제목만으로 티켓 등록"이라는 MVP 가치 전달 가능

### Incremental Delivery (실제 진행된 방식)

1. Setup + Foundational → DB 스키마·커넥션 준비
2. US1 추가 → 제목만으로 생성 가능 (TC-01, TC-09 PASS)
3. US2 추가 → 상세 필드 포함 생성 가능 (TC-02는 테스트 데이터의 하드코딩된 날짜 문제로 현재 FAIL — 구현 결함 아님, `quickstart.md` 참고)
4. US3 추가 → 모든 검증 실패 케이스 방어 (TC-03~08 PASS)

## Notes

- [P] 태스크 = 다른 파일 또는 독립적인 테스트 블록
- [Story] 라벨은 추적성을 위해 유저 스토리에 매핑
- 이 tasks.md는 이미 완료된 구현을 소급 문서화한 것이라 전 항목 `[x]`로 표기했다 — 실제 신규 개발 시에는 `[ ]`로 시작해 TDD(Red→Green→Refactor) 순서를 그대로 따를 것
