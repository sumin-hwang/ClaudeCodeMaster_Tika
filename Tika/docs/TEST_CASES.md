# Tika - 테스트 케이스 명세 (TEST_CASES.md)

> 버전: 1.0 (MVP)
> 참고 문서: [REQUIREMENTS.md](./REQUIREMENTS.md), [API_SPEC.md](./API_SPEC.md), [DATA_MODEL.md](./DATA_MODEL.md), [COMPONENT_SPEC.md](./COMPONENT_SPEC.md)
> 테스트 프레임워크: Jest + React Testing Library

---

## 1. 테스트 전략

### 1.1 TDD 사이클

CLAUDE.md 규칙에 따라 **새 기능 구현 전 아래 정의된 테스트부터 작성**한다.

```
RED: 이 문서의 테스트 케이스를 코드로 작성 (아직 구현 없어 실패)
  ↓
GREEN: 테스트를 통과시키는 최소한의 구현 작성
  ↓
REFACTOR: 테스트가 계속 통과하는 상태로 구조 개선
```

테스트 코드는 삭제하거나 skip하지 않는다 (CLAUDE.md).

### 1.2 테스트 레벨

| 레벨 | ID 접두사 | 대상 | 도구 |
|---|---|---|---|
| API/서비스 | `TC-API-` | `src/server/services/ticketService.ts`, `app/api/tickets/**` | Jest (서비스 함수 직접 호출 또는 Route Handler 호출) |
| 컴포넌트 | `TC-COMP-` | `src/client/components/**`, `src/client/hooks/**` | Jest + React Testing Library, `ticketApi.ts`는 `jest.mock`으로 대체 |
| 통합 | `TC-INT-` | `BoardPage` 전체 (여러 컴포넌트 + 훅 + API mock 조합) | Jest + React Testing Library, MSW 또는 `jest.mock('ticketApi')`로 서버 응답 시뮬레이션 |

### 1.3 공통 규칙

- 파일 위치: 테스트 대상 파일과 동일 디렉터리에 `*.test.ts` / `*.test.tsx`로 colocate
- 날짜 의존 로직(오버듀 판정, `dueDate` 검증, 24시간 필터)은 `jest.useFakeTimers().setSystemTime(...)`으로 기준 시각을 고정하고 테스트
- API 레벨 테스트는 각 테스트 실행 전/후 DB 상태를 초기화(트랜잭션 롤백 또는 테스트 전용 시퀀스 리셋)하여 테스트 간 격리를 보장
- 컴포넌트/통합 테스트는 실제 네트워크 호출을 하지 않고 `src/client/api/ticketApi.ts`를 mock 처리
- 아래 TC ID는 [REQUIREMENTS.md](./REQUIREMENTS.md) 4장 추적 매트릭스(US ↔ FR ↔ TC)의 ID와 동일하게 유지한다. 세부 시나리오는 `TC-XXX-NN` 형태의 하위 케이스로 분해한다.

---

## 2. API / 서비스 테스트 케이스

### TC-API-001: 티켓 생성 (FR-001)

| ID | 시나리오 | Given | When | Then |
|---|---|---|---|---|
| TC-API-001-01 | 필수값만 입력 | 빈 보드 | `title`만 담아 `POST /api/tickets` | 201, `status=BACKLOG`, `priority=MEDIUM`, `position=0` |
| TC-API-001-02 | 전체 필드 입력 | 빈 보드 | title/description/priority/plannedStartDate/dueDate 모두 입력 | 201, 입력한 값 그대로 저장·반환 |
| TC-API-001-03 | 제목 누락 | - | `title` 없이 요청 | 400 `VALIDATION_ERROR` "제목을 입력해주세요" |
| TC-API-001-04 | 제목 200자 초과 | - | `title` 201자 | 400 "제목은 200자 이내로 입력해주세요" |
| TC-API-001-05 | 제목 공백만 입력 | - | `title=" "` | 400 "제목을 입력해주세요" |
| TC-API-001-06 | 설명 1000자 초과 | - | `description` 1001자 | 400 "설명은 1000자 이내로 입력해주세요" |
| TC-API-001-07 | 잘못된 우선순위 | - | `priority="URGENT"` | 400 "우선순위는 LOW, MEDIUM, HIGH 중 선택해주세요" |
| TC-API-001-08 | 과거 종료예정일 | 오늘=2026-02-01(고정) | `dueDate="2026-01-31"` | 400 "종료예정일은 오늘 이후 날짜를 선택해주세요" |
| TC-API-001-09 | position 배치 | BACKLOG에 `position=0`인 티켓 존재 | 새 티켓 생성 | 신규 티켓 `position = -1024` (기존 최솟값 - 1024) |

### TC-API-002: 보드 조회 (FR-002)

| ID | 시나리오 | Given | When | Then |
|---|---|---|---|---|
| TC-API-002-01 | 빈 보드 | 티켓 0개 | `GET /api/tickets` | 200, 4개 칼럼 모두 빈 배열, `total=0` |
| TC-API-002-02 | 칼럼별 그룹화 | 4개 칼럼에 티켓 분산 존재 | `GET /api/tickets` | 각 티켓이 자신의 `status` 배열에 포함 |
| TC-API-002-03 | 칼럼 내 정렬 | 같은 칼럼에 position 3개 (예: 1024, 0, 2048) | `GET /api/tickets` | 응답 배열이 position 오름차순(0, 1024, 2048) |
| TC-API-002-04 | 파생 필드 포함 | 임의 티켓 | `GET /api/tickets` | 각 티켓 객체에 `isOverdue` 필드 포함 |
| TC-API-002-05 | Done 24시간 필터 | DONE 티켓 A(`completedAt`=23시간 전), B(`completedAt`=25시간 전) | `GET /api/tickets` | DONE 배열에 A만 포함, B는 제외 |

### TC-API-003: 티켓 상세 조회 (FR-003)

| ID | 시나리오 | Given | When | Then |
|---|---|---|---|---|
| TC-API-003-01 | 존재하는 ID | 티켓 존재 | `GET /api/tickets/:id` | 200 + 전체 필드(`isOverdue` 포함) 반환 |
| TC-API-003-02 | 존재하지 않는 ID | - | `GET /api/tickets/99999` | 404 `TICKET_NOT_FOUND` "티켓을 찾을 수 없습니다" |

### TC-API-004: 티켓 수정 (FR-004)

| ID | 시나리오 | Given | When | Then |
|---|---|---|---|---|
| TC-API-004-01 | 부분 수정 | 티켓 존재 | `title`만 담아 `PATCH /api/tickets/:id` | 200, `title`만 변경, 나머지 필드 유지 |
| TC-API-004-02 | description 삭제 | `description` 값 존재 | `description: null` 전송 | 200, `description=null`로 저장 |
| TC-API-004-03 | 일정 필드 삭제 | `plannedStartDate`/`dueDate` 존재 | 각각 `null` 전송 | 200, 해당 필드 `null`로 저장 |
| TC-API-004-04 | 제목 200자 초과 | - | `title` 201자 | 400 "제목은 200자 이내로 입력해주세요" |
| TC-API-004-05 | 잘못된 우선순위 | - | `priority="URGENT"` | 400 "우선순위는 LOW, MEDIUM, HIGH 중 선택해주세요" |
| TC-API-004-06 | 과거 종료예정일 | 오늘=2026-02-01(고정) | `dueDate="2026-01-31"` | 400 "종료예정일은 오늘 이후 날짜를 선택해주세요" |
| TC-API-004-07 | 존재하지 않는 ID | - | `PATCH /api/tickets/99999` | 404 "티켓을 찾을 수 없습니다" |
| TC-API-004-08 | 수정 불가 필드 무시 | 티켓 존재 | body에 `status`, `position` 포함해 전송 | 200, `status`/`position`은 요청 전송값과 무관하게 변경되지 않음 |
| TC-API-004-09 | updatedAt 갱신 | 티켓 존재 (`updatedAt=T0`) | 임의 필드 수정 | 응답의 `updatedAt > T0` |

### TC-API-005: 티켓 완료 (FR-005)

| ID | 시나리오 | Given | When | Then |
|---|---|---|---|---|
| TC-API-005-01 | 완료 처리 | 티켓 status=`IN_PROGRESS` | `PATCH /api/tickets/:id/complete` | 200, `status=DONE`, `completedAt`=현재 시각 |
| TC-API-005-02 | position 배치 | DONE 칼럼에 `position=0`인 티켓 존재 | 완료 처리 | 신규 완료 티켓 `position = -1024` |
| TC-API-005-03 | 존재하지 않는 ID | - | `PATCH /api/tickets/99999/complete` | 404 "티켓을 찾을 수 없습니다" |

### TC-API-006: 티켓 삭제 (FR-006)

| ID | 시나리오 | Given | When | Then |
|---|---|---|---|---|
| TC-API-006-01 | 정상 삭제 | 티켓 존재 | `DELETE /api/tickets/:id` | 204, 이후 `GET /api/tickets/:id` 시 404 |
| TC-API-006-02 | 존재하지 않는 ID | - | `DELETE /api/tickets/99999` | 404 "티켓을 찾을 수 없습니다" |

### TC-API-007: 상태/순서 변경 - 드래그앤드롭 (FR-007)

| ID | 시나리오 | Given | When | Then |
|---|---|---|---|---|
| TC-API-007-01 | 카드 사이 삽입 | 같은 칼럼에 position=0, 1024 카드 존재 | 두 카드 사이로 `reorder` 요청 | 대상 티켓 `position=512` |
| TC-API-007-02 | 맨 앞 삽입 | 칼럼 내 최소 position=0 | 맨 앞으로 `reorder` 요청 | 대상 티켓 `position=-1024` |
| TC-API-007-03 | 맨 뒤 삽입 | 칼럼 내 최대 position=1024 | 맨 뒤로 `reorder` 요청 | 대상 티켓 `position=2048` |
| TC-API-007-04 | 간격 부족 시 재정렬 | 인접 두 카드 position 차이가 1 미만 | 그 사이로 `reorder` 요청 | 해당 칼럼 전체가 1024 간격으로 재정렬되고 `affected`에 반영됨 |
| TC-API-007-05 | TODO 이동 시 시작일 기록 | 티켓 status=`BACKLOG`, `startedAt=null` | `status="TODO"`로 `reorder` | `startedAt`=현재 시각 |
| TC-API-007-06 | TODO→BACKLOG 시작일 초기화 | 티켓 status=`TODO`, `startedAt` 존재 | `status="BACKLOG"`로 `reorder` | `startedAt=null` |
| TC-API-007-07 | DONE 이탈 시 완료일 초기화 | 티켓 status=`DONE`, `completedAt` 존재 | `status="IN_PROGRESS"`로 `reorder` | `completedAt=null` |
| TC-API-007-08 | DONE 지정 거부 | - | `status="DONE"`으로 `reorder` 요청 | 400 "상태는 BACKLOG, TODO, IN_PROGRESS 중 선택해주세요" |
| TC-API-007-09 | 존재하지 않는 ticketId | - | 없는 `ticketId`로 `reorder` | 404 "티켓을 찾을 수 없습니다" |
| TC-API-007-10 | affected 응답 | 재정렬로 다른 카드 position도 변경됨 | `reorder` 요청 | 응답 `affected` 배열에 변경된 티켓들의 `id`/`position` 포함 |
| TC-API-007-11 | 트랜잭션 원자성 | 재정렬 도중 오류 발생 상황을 mock | `reorder` 요청 | 부분 업데이트 없이 전체 롤백(DB 상태 변경 없음) |

### TC-API-008: 오버듀 판정 (FR-008)

| ID | 시나리오 | Given (기준일 2026-02-10 고정) | When | Then |
|---|---|---|---|---|
| TC-API-008-01 | 기한 초과 | `dueDate="2026-02-09"`, `status≠DONE` | 조회 | `isOverdue=true` |
| TC-API-008-02 | 기한 이전 | `dueDate="2026-02-11"` | 조회 | `isOverdue=false` |
| TC-API-008-03 | dueDate 없음 | `dueDate=null` | 조회 | `isOverdue=false` |
| TC-API-008-04 | 완료된 티켓 | `dueDate="2026-02-01"`, `status=DONE` | 조회 | `isOverdue=false` |
| TC-API-008-05 | 오늘이 마감일 | `dueDate="2026-02-10"` | 조회 | `isOverdue=false` (당일은 초과 아님) |

---

## 3. 컴포넌트 테스트 케이스

### TC-COMP-001: 오버듀 표시 (`TicketCard`, `OverdueBadge`) — US-004

| ID | 시나리오 | Given | When | Then |
|---|---|---|---|---|
| TC-COMP-001-01 | 오버듀 뱃지 표시 | `ticket.isOverdue=true`로 `TicketCard` 렌더 | - | `OverdueBadge`(또는 해당 텍스트/역할)가 문서에 존재 |
| TC-COMP-001-02 | 정상 티켓 미표시 | `ticket.isOverdue=false` | - | `OverdueBadge`가 문서에 존재하지 않음 |
| TC-COMP-001-03 | 시각적 구분 | `isOverdue=true` | - | 오버듀 표시 요소가 우선순위 뱃지와 다른 식별 가능한 클래스/속성을 가짐 |

### TC-COMP-002: `BoardColumn` 렌더링 — US-003

| ID | 시나리오 | Given | When | Then |
|---|---|---|---|---|
| TC-COMP-002-01 | 헤더 표시 | `title="TODO"`, `tickets` 3건 | 렌더 | 헤더에 "TODO"와 카드 수 "3" 표시 |
| TC-COMP-002-02 | 정렬 순서 | position이 뒤섞인 `tickets` 배열 전달(예: [1024, 0, 2048]) | 렌더 | 화면상 카드 순서가 position 오름차순으로 표시 |
| TC-COMP-002-03 | 빈 컬럼 | `tickets=[]` | 렌더 | 카드 수 "0" 표시, 카드 목록 없음 |

### TC-COMP-003: `BacklogSidebar` 렌더링 — US-001, US-003

| ID | 시나리오 | Given | When | Then |
|---|---|---|---|---|
| TC-COMP-003-01 | 카드 수 표시 | `tickets` 5건 | 렌더 | "Backlog" 라벨과 카드 수 "5" 표시 |
| TC-COMP-003-02 | 추가 버튼 클릭 | - | "+ 새 티켓" 버튼 클릭 | `onAddClick` 1회 호출 |

### TC-COMP-004: 티켓 생성 폼 (`TicketModal` mode="create", `TicketForm`) — US-001, US-002

| ID | 시나리오 | Given | When | Then |
|---|---|---|---|---|
| TC-COMP-004-01 | 모달 오픈 | `isOpen=true`, `mode="create"` | 렌더 | 빈 입력 폼과 "생성" 버튼 표시 |
| TC-COMP-004-02 | 제목만 입력 후 제출 | 모달 오픈 | 제목만 입력 후 제출 | `onSubmit`이 `{ title }` (다른 필드 undefined)로 1회 호출 |
| TC-COMP-004-03 | 우선순위 기본값 | 우선순위 미선택 | 제출 | 전송 데이터에 `priority` 미포함(서버 기본값 MEDIUM에 위임) 또는 명시적으로 `MEDIUM` 포함 (구현 방식에 맞춰 하나로 고정) |
| TC-COMP-004-04 | 과거 종료예정일 | 종료예정일에 어제 날짜 입력 | 제출 시도 | `onSubmit` 호출되지 않고 "종료예정일은 오늘 이후 날짜를 선택해주세요" 표시 |
| TC-COMP-004-05 | 제출 성공 시 닫힘 | 유효한 입력, `onSubmit`이 resolve | 제출 | `onClose` 1회 호출 |
| TC-COMP-004-06 | 제목 공백만 입력 | 제목에 공백만 입력 | 제출 시도 | `onSubmit` 호출되지 않고 "제목을 입력해주세요" 표시 |

### TC-COMP-005: 티켓 수정 폼 (`TicketModal` mode="edit") — US-007

| ID | 시나리오 | Given | When | Then |
|---|---|---|---|---|
| TC-COMP-005-01 | 카드 클릭 시 모달 오픈 | `BoardPage`에 티켓 카드 존재 | 카드 클릭 | 수정 모달이 열리고 폼에 기존 값이 채워짐 |
| TC-COMP-005-02 | 필드 수정 후 제출 | 수정 모달 오픈, 기존 `title="A"` | `title`을 "B"로 변경 후 제출 | `onSubmit`이 변경된 필드(`title: "B"`)를 포함해 호출 |
| TC-COMP-005-03 | 수정 성공 후 반영 | 수정 모달, `onSubmit` resolve | 제출 | 모달이 닫히고 보드의 해당 카드 표시값이 갱신됨 |

### TC-COMP-006: 티켓 삭제 (`ConfirmDialog`) — US-008

| ID | 시나리오 | Given | When | Then |
|---|---|---|---|---|
| TC-COMP-006-01 | 삭제 버튼 → 확인 다이얼로그 | 수정 모달(`mode="edit"`) 오픈 | "삭제" 버튼 클릭 | `ConfirmDialog`가 열림 |
| TC-COMP-006-02 | 취소 | `ConfirmDialog` 오픈 | "취소" 클릭 | 다이얼로그만 닫히고 `onConfirm` 미호출, 티켓 유지 |
| TC-COMP-006-03 | 확인 | `ConfirmDialog` 오픈 | "확인" 클릭 | `onConfirm` 1회 호출, 이후 카드가 보드에서 사라짐 |

---

## 4. 통합 테스트 케이스 (`BoardPage`, API mock)

### TC-INT-001: 드래그앤드롭 → 완료 처리 — US-005, US-006

| ID | 시나리오 | Given | When | Then |
|---|---|---|---|---|
| TC-INT-001-01 | 컬럼 간 이동 | TODO 컬럼에 카드 존재, `ticketApi.reorderTicket` mock 준비 | 카드를 In Progress로 드래그 | 카드가 즉시(낙관적) In Progress에 표시되고 `reorderTicket`이 올바른 `status`/`position`으로 호출됨 |
| TC-INT-001-02 | Done으로 이동 | 임의 컬럼에 카드 존재, `ticketApi.completeTicket` mock 준비 | 카드를 Done으로 드래그 | `completeTicket` 호출, 응답 반영 후 카드가 Done 컬럼에 `completedAt` 포함 상태로 표시 |
| TC-INT-001-03 | 실패 시 롤백 | 드래그 대상 카드 존재, API mock이 reject하도록 설정 | 카드 드래그 | 낙관적으로 이동했던 카드가 원래 컬럼/위치로 되돌아옴 |
| TC-INT-001-04 | TODO 이동 시 시작일 반영 | BACKLOG 카드 존재 | TODO로 드래그 | API 호출 payload/응답에 `startedAt` 설정 반영, 이후 상세 모달에서 시작일 확인 가능 |

### TC-INT-002: 완료 처리 → 삭제 — US-006, US-008

| ID | 시나리오 | Given | When | Then |
|---|---|---|---|---|
| TC-INT-002-01 | 완료 후 삭제 | Done으로 이동 완료된 카드 존재 | 카드 클릭 → 상세 모달 → 삭제 → 확인 다이얼로그에서 확인 | `deleteTicket` API 호출, 카드가 보드에서 사라짐 |
| TC-INT-002-02 | Done 이탈 후 재확인 | Done 카드 존재 | Done에서 다른 컬럼으로 드래그 | `completedAt`이 초기화되고, 해당 카드가 더 이상 Done 24시간 규칙과 무관하게 원래 컬럼에서 정상 조작(수정/삭제) 가능 |

---

## 5. 추적 매트릭스 정합성

이 문서의 TC ID는 [REQUIREMENTS.md](./REQUIREMENTS.md) 4장의 추적 매트릭스와 동일하다.

| 사용자 스토리 | 관련 FR | 관련 TC |
|---|---|---|
| US-001: 새 할 일 등록 | FR-001 | TC-API-001, TC-COMP-004 |
| US-002: 상세 정보 설정 | FR-001 | TC-API-001 |
| US-003: 칸반 보드 현황 파악 | FR-002, FR-008 | TC-API-002, TC-API-008, TC-COMP-002, TC-COMP-003 |
| US-004: 마감 초과 인지 | FR-008 | TC-API-008, TC-COMP-001 |
| US-005: 드래그앤드롭 상태 변경 | FR-007 | TC-API-007, TC-INT-001 |
| US-006: 할 일 완료 처리 | FR-005 | TC-API-005, TC-INT-001, TC-INT-002 |
| US-007: 할 일 수정 | FR-003, FR-004 | TC-API-003, TC-API-004, TC-COMP-005 |
| US-008: 할 일 삭제 | FR-006 | TC-API-006, TC-COMP-006, TC-INT-002 |
