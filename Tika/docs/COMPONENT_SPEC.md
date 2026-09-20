# Tika - 컴포넌트 명세서 (COMPONENT_SPEC.md)

> 버전: 1.0 (MVP)
> 참고 문서: [PRD.md](./PRD.md), [TRD.md](./TRD.md), [DATA_MODEL.md](./DATA_MODEL.md), [API_SPEC.md](./API_SPEC.md), [REQUIREMENTS.md](./REQUIREMENTS.md)
> 대상 디렉터리: `src/client/`

---

## 0. 컨벤션 (CLAUDE.md 요약)

- 함수 컴포넌트 + 화살표 함수로 작성
- Props 타입은 컴포넌트 파일 내에 정의 (별도 types 파일 분리 X, 단 공유 타입은 `src/shared/types`에서 import)
- 파일명: PascalCase (예: `TicketCard.tsx`)
- API 호출은 `src/client/api/ticketApi.ts`를 통해서만 수행 (컴포넌트/훅에서 직접 `fetch` 금지)
- `src/client/`는 `src/server/`를 import하지 않는다 ([TRD.md](./TRD.md) 4장 경계 규칙)

---

## 1. 컴포넌트 트리

```
app/page.tsx (Server Component, 진입점)
 └─ BoardPage (Client Component, 상태 오케스트레이션)
     ├─ BacklogSidebar
     │    ├─ TicketCard (BACKLOG 티켓 수만큼 반복)
     │    └─ "+ 새 티켓" 버튼 → TicketModal(mode="create") 오픈
     │
     ├─ BoardColumn (status="TODO")
     │    └─ TicketCard (TODO 티켓 수만큼 반복)
     ├─ BoardColumn (status="IN_PROGRESS")
     │    └─ TicketCard (IN_PROGRESS 티켓 수만큼 반복)
     ├─ BoardColumn (status="DONE")
     │    └─ TicketCard (DONE 티켓 수만큼 반복, 24시간 이내만)
     │
     ├─ TicketModal (mode: "create" | "edit", 조건부 렌더)
     │    └─ TicketForm (제목/설명/우선순위/시작예정일/종료예정일 입력)
     └─ ConfirmDialog (삭제 확인, 조건부 렌더)
```

`TicketCard`는 `PriorityBadge`, `OverdueBadge`를 내부에서 사용한다.

---

## 2. 디렉터리 구조

```
src/client/
├── components/
│   ├── BoardPage.tsx
│   ├── BacklogSidebar.tsx
│   ├── BoardColumn.tsx
│   ├── TicketCard.tsx
│   ├── PriorityBadge.tsx
│   ├── OverdueBadge.tsx
│   ├── TicketModal.tsx
│   ├── TicketForm.tsx
│   └── ConfirmDialog.tsx
├── hooks/
│   ├── useBoardData.ts
│   ├── useDragAndDrop.ts
│   └── useTicketForm.ts
└── api/
    └── ticketApi.ts
```

---

## 3. 페이지 / 레이아웃 컴포넌트

### 3.1 BoardPage

**역할**: 보드 전체 상태를 관리하는 최상위 클라이언트 컴포넌트. `useBoardData`, `useDragAndDrop`을 호출하여 하위 컴포넌트에 데이터와 핸들러를 내려준다. 반응형 레이아웃(사이드바 + 3컬럼 ↔ 모바일 스택)의 최상위 컨테이너 역할도 겸한다.

**Props**: 없음 (페이지 최상위 컴포넌트)

**내부 상태 (useBoardData, useDragAndDrop 경유)**:
| 상태 | 타입 | 설명 |
|---|---|---|
| board | `BoardData` | 4개 칼럼별 티켓 목록 |
| isLoading | `boolean` | 최초 로딩 여부 |
| error | `string \| null` | 조회 실패 메시지 |
| activeModal | `{ mode: 'create' \| 'edit'; ticket?: Ticket } \| null` | 열려있는 모달 상태 (로컬 useState) |
| confirmDeleteId | `number \| null` | 삭제 확인 대상 티켓 ID (로컬 useState) |

**주요 동작**:
- 마운트 시 `useBoardData`가 `GET /api/tickets` 호출 → `board` 초기화 (FR-002)
- `BacklogSidebar`의 "+ 새 티켓" 클릭 → `activeModal = { mode: 'create' }`
- `TicketCard` 클릭 → `activeModal = { mode: 'edit', ticket }` (US-007)
- `TicketModal` 제출 → 생성/수정 API 호출 후 `board` 갱신, 모달 닫기
- `TicketModal` 삭제 클릭 → `confirmDeleteId` 설정 → `ConfirmDialog` 오픈 (US-008)
- 드래그앤드롭 이벤트는 `useDragAndDrop`이 처리하고 결과만 `board`에 반영

**관련 FR/NFR**: FR-002, NFR-002(반응형 레이아웃 컨테이너)

---

### 3.2 BacklogSidebar

**역할**: 착수하지 않은 `BACKLOG` 티켓 목록을 좌측 사이드바 형태로 표시. 신규 티켓 생성 진입점.

```typescript
interface BacklogSidebarProps {
  tickets: TicketWithMeta[];
  onCardClick: (ticket: TicketWithMeta) => void;
  onAddClick: () => void;
}
```

**주요 동작**:
- `tickets`를 position 오름차순으로 렌더 (정렬은 `useBoardData`에서 이미 정렬된 데이터를 전달받음)
- 상단에 "Backlog" 라벨과 카드 수(`tickets.length`) 표시 (US-003)
- 하단 또는 상단에 "+ 새 티켓" 버튼 → `onAddClick()` 호출 (US-001)
- `@dnd-kit`의 드롭 가능 영역(`useDroppable`, `id: 'BACKLOG'`)으로 등록되어 다른 컬럼에서 드래그된 카드를 받을 수 있음

**관련 FR/US**: FR-001, FR-002, US-001, US-003

---

### 3.3 BoardColumn

**역할**: `TODO` / `IN_PROGRESS` / `DONE` 3개 컬럼에 공통으로 사용되는 재사용 컴포넌트.

```typescript
interface BoardColumnProps {
  status: Exclude<TicketStatus, 'BACKLOG'>; // 'TODO' | 'IN_PROGRESS' | 'DONE'
  title: string;                            // COLUMN_LABELS[status]
  tickets: TicketWithMeta[];
  onCardClick: (ticket: TicketWithMeta) => void;
}
```

**주요 동작**:
- 컬럼 헤더에 `title`과 카드 수(`tickets.length`) 표시 (US-003)
- `tickets`를 position 오름차순으로 렌더
- `@dnd-kit`의 드롭 가능 영역(`useDroppable`, `id: status`)으로 등록
- `status === 'DONE'`인 경우 서버에서 이미 24시간 필터가 적용된 목록을 그대로 표시 (별도 클라이언트 필터링 불필요, [DATA_MODEL.md](./DATA_MODEL.md) 5.4)

**관련 FR/US**: FR-002, US-003

---

## 4. 티켓 표시 컴포넌트

### 4.1 TicketCard

**역할**: 보드/사이드바에 표시되는 개별 티켓 카드. 드래그 가능한 최소 단위.

```typescript
interface TicketCardProps {
  ticket: TicketWithMeta;
  onClick: (ticket: TicketWithMeta) => void;
}
```

**표시 내용**:
| 요소 | 소스 | 비고 |
|---|---|---|
| 제목 | `ticket.title` | 1줄 말줄임(truncate) |
| 우선순위 뱃지 | `ticket.priority` | `PriorityBadge` 컴포넌트 사용 |
| 일정 요약 | `ticket.plannedStartDate` ~ `ticket.dueDate` | 둘 다 null이면 미표시 |
| 오버듀 표시 | `ticket.isOverdue` | `true`일 때만 `OverdueBadge` 렌더 (FR-008, US-004) |

**주요 동작**:
- `@dnd-kit`의 `useSortable({ id: ticket.id })`로 드래그 가능 요소 등록
- 클릭(드래그가 아닌 클릭) 시 `onClick(ticket)` 호출 → 상세/수정 모달 오픈 (US-007)
- 드래그 중에는 `isDragging` 상태에 따라 투명도/그림자 등 시각적 피드백 적용

**접근성 (NFR-003)**:
- 카드 루트 요소는 `role="button"`, `tabIndex={0}`
- `aria-label`: `"${title}, 우선순위 ${priority}${isOverdue ? ', 기한 초과' : ''}"`
- `Enter`/`Space` 키로 `onClick` 트리거 가능해야 함
- 키보드 드래그: `@dnd-kit`의 `KeyboardSensor` 활성화로 화살표 키 이동 지원

**관련 FR/US**: FR-002, FR-008, US-004, US-007

---

### 4.2 PriorityBadge

**역할**: 우선순위를 색상 뱃지로 표시.

```typescript
interface PriorityBadgeProps {
  priority: TicketPriority; // 'LOW' | 'MEDIUM' | 'HIGH'
}
```

**표시 규칙** ([REQUIREMENTS.md](./REQUIREMENTS.md) 6장):
| priority | 색상 |
|---|---|
| LOW | 회색 |
| MEDIUM | 파란색 |
| HIGH | 빨간색 |

색상 대비는 NFR-003(충분한 색상 대비) 기준을 만족해야 한다.

---

### 4.3 OverdueBadge

**역할**: 종료예정일이 지난 미완료 티켓에 표시되는 경고 뱃지. `TicketCard`에서 `ticket.isOverdue === true`일 때만 조건부 렌더된다.

**Props**: 없음 (표시 여부는 부모인 `TicketCard`가 판단)

**표시 규칙**: 다른 뱃지/카드와 시각적으로 명확히 구분되는 색상(예: 경고색 배경 또는 아이콘) 사용 (US-004)

---

## 5. 폼 / 모달 컴포넌트

### 5.1 TicketModal

**역할**: 티켓 생성과 수정을 함께 처리하는 모달 컨테이너. 내부에 `TicketForm`을 포함하며, 수정 모드에서는 삭제 버튼을 추가로 노출한다.

```typescript
interface TicketModalProps {
  mode: 'create' | 'edit';
  ticket?: Ticket;              // mode === 'edit'일 때 필수
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTicketInput | UpdateTicketInput) => Promise<void>;
  onDelete?: () => void;        // mode === 'edit'일 때만 표시
}
```

**주요 동작**:
- `mode === 'create'`: 빈 폼 표시, 제출 시 `POST /api/tickets` 매핑 (FR-001, US-001, US-002)
- `mode === 'edit'`: `ticket` 값으로 폼 초기화, 제출 시 `PATCH /api/tickets/:id` 매핑 (FR-004, US-007)
- `mode === 'edit'`일 때만 "삭제" 버튼 표시 → 클릭 시 `onDelete()` 호출 (모달을 직접 닫지 않고 `ConfirmDialog`를 여는 책임은 `BoardPage`에 위임) (US-008)
- 제출 성공 시 `onClose()` 호출

**접근성 (NFR-003)**:
- `role="dialog"`, `aria-modal="true"`, `aria-labelledby`로 모달 제목 연결
- 열릴 때 첫 입력 필드(제목)로 포커스 이동, 닫힐 때 트리거 요소로 포커스 복귀
- `Esc` 키로 닫기 가능

**관련 FR/US**: FR-001, FR-004, US-001, US-002, US-007

---

### 5.2 TicketForm

**역할**: `TicketModal` 내부에서 실제 입력 필드를 렌더링하는 폼. `useTicketForm` 훅으로 상태/검증을 위임한다.

```typescript
interface TicketFormProps {
  initialValues?: Partial<CreateTicketInput>;
  onSubmit: (data: CreateTicketInput | UpdateTicketInput) => Promise<void>;
  submitLabel: string; // '생성' | '수정'
}
```

**입력 필드** ([API_SPEC.md](./API_SPEC.md) 1장, 4장 기준):
| 필드 | 컴포넌트 | 필수 | 비고 |
|---|---|---|---|
| title | text input | O | 1~200자 |
| description | textarea | X | 최대 1000자 |
| priority | select/segmented control | X | LOW/MEDIUM/HIGH, 기본 MEDIUM |
| plannedStartDate | date input | X | 시작예정일 |
| dueDate | date input | X | 종료예정일, 오늘 이후만 선택 가능 (US-002) |

**검증 에러 표시**: `useTicketForm`이 반환하는 `errors` 객체를 각 필드 하단에 표시. 에러 메시지는 [API_SPEC.md](./API_SPEC.md)의 Zod 스키마 메시지와 동일한 문구를 클라이언트에서도 그대로 사용한다 (이중 검증, NFR-004).

**관련 FR/US**: FR-001, FR-004, US-001, US-002

---

### 5.3 ConfirmDialog

**역할**: 삭제 등 되돌릴 수 없는 작업 전 확인을 받는 범용 다이얼로그.

```typescript
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}
```

**주요 동작**:
- `onConfirm` 호출 시 `DELETE /api/tickets/:id` 매핑 (FR-006)
- 확인 후 티켓이 보드에서 제거되고 다이얼로그와 `TicketModal`이 모두 닫힘 (US-008)

**접근성**: `TicketModal`과 동일한 `role="dialog"` / 포커스 트랩 규칙 적용

**관련 FR/US**: FR-006, US-008

---

## 6. 커스텀 훅

### 6.1 useBoardData

**역할**: 보드 데이터 조회 및 모든 CRUD/상태변경 API 호출을 캡슐화. `src/client/api/ticketApi.ts`만 사용하며, 낙관적 업데이트와 실패 시 롤백을 담당한다 (NFR-004).

```typescript
interface UseBoardDataResult {
  board: BoardData;
  isLoading: boolean;
  error: string | null;
  createTicket: (input: CreateTicketInput) => Promise<void>;
  updateTicket: (id: number, input: UpdateTicketInput) => Promise<void>;
  deleteTicket: (id: number) => Promise<void>;
  moveTicket: (ticketId: number, targetStatus: TicketStatus, targetPosition: number) => Promise<void>;
  refetch: () => Promise<void>;
}
```

**API 매핑**:
| 함수 | 호출 API | 관련 FR |
|---|---|---|
| 초기 로드 | `GET /api/tickets` | FR-002 |
| createTicket | `POST /api/tickets` | FR-001 |
| updateTicket | `PATCH /api/tickets/:id` | FR-004 |
| deleteTicket | `DELETE /api/tickets/:id` | FR-006 |
| moveTicket (targetStatus === 'DONE') | `PATCH /api/tickets/:id/complete` | FR-005 |
| moveTicket (targetStatus !== 'DONE') | `PATCH /api/tickets/reorder` | FR-007 |

`moveTicket`의 API 분기 규칙은 [API_SPEC.md](./API_SPEC.md) "프론트엔드 DnD 라우팅 규칙"을 그대로 따른다.

**낙관적 업데이트 흐름** (NFR-004):
1. `moveTicket` 호출 즉시 `board` 상태를 낙관적으로 갱신 (티켓의 status/position 즉시 변경)
2. 대응하는 API 호출
3. 성공: 서버 응답값(재계산된 position, `affected` 목록 포함)으로 `board` 재동기화
4. 실패: 호출 직전의 `board` 스냅샷으로 롤백하고 `error` 설정

---

### 6.2 useDragAndDrop

**역할**: `@dnd-kit` 설정과 `onDragEnd` 처리를 캡슐화하여 `BoardPage`의 JSX를 단순하게 유지.

```typescript
interface UseDragAndDropParams {
  board: BoardData;
  moveTicket: UseBoardDataResult['moveTicket'];
}

interface UseDragAndDropResult {
  sensors: SensorDescriptor<SensorOptions>[]; // PointerSensor, TouchSensor, KeyboardSensor
  onDragEnd: (event: DragEndEvent) => void;
}
```

**주요 동작**:
- `PointerSensor` + `TouchSensor`로 마우스/터치 드래그 지원 (NFR-002 모바일 터치)
- `KeyboardSensor`로 키보드 이동 지원 (NFR-003)
- `onDragEnd`: 드롭된 컬럼(`over.data.current.status`)과 인접 카드 위치로부터 `position`을 추정해 `moveTicket(ticketId, targetStatus, targetPosition)` 호출. 최종 position 값은 서버([DATA_MODEL.md](./DATA_MODEL.md) 5.5 재계산 로직)가 확정하며, 클라이언트는 추정치로 낙관적 업데이트만 수행한다.
- BACKLOG로의 드롭은 UI상 이동 대상에서 제외한다 (REQUIREMENTS.md 칼럼 이동 제약은 없으나, MVP 와이어프레임상 Backlog는 사이드바이며 `reorder` API의 `status`는 `BACKLOG | TODO | IN_PROGRESS`만 허용 — Backlog 내 재정렬은 지원, Backlog로의 역이동 시에도 동일 API 사용)

**관련 FR/NFR**: FR-007, NFR-002, NFR-003, NFR-004

---

### 6.3 useTicketForm

**역할**: `TicketForm`의 입력 상태, 클라이언트 사이드 Zod 검증, 제출 처리를 담당.

```typescript
interface UseTicketFormResult {
  values: CreateTicketInput;
  errors: Partial<Record<keyof CreateTicketInput, string>>;
  handleChange: <K extends keyof CreateTicketInput>(field: K, value: CreateTicketInput[K]) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  isSubmitting: boolean;
}
```

**주요 동작**:
- `src/shared/validations`의 `createTicketSchema` / `updateTicketSchema`([API_SPEC.md](./API_SPEC.md) "검증 스키마" 참고)로 제출 전 클라이언트 검증 수행
- 검증 실패 시 `errors`에 Zod 메시지를 그대로 매핑하여 표시 (서버와 동일 문구, NFR-004 이중 검증)
- 검증 통과 시 `TicketForm`의 `onSubmit` prop 호출

**관련 FR/NFR**: FR-001, FR-004, NFR-004

---

## 7. 반응형 동작 (NFR-002 매핑)

| 브레이크포인트 | 레이아웃 | 담당 컴포넌트 |
|---|---|---|
| 모바일 (360px~) | 단일 칼럼 스크롤 뷰 (Backlog/TODO/In Progress/Done을 가로 스크롤 스냅으로 전환) | `BoardPage` (Tailwind `overflow-x-auto` + `scroll-snap` 레이아웃) |
| 태블릿 (768px~) | 2칼럼 그리드로 배치, 나머지는 스크롤 | `BoardPage` (Tailwind `md:grid-cols-2`) |
| 데스크톱 (1024px~) | 좌측 Backlog 사이드바 + 우측 3컬럼 가로 배치 (PRD.md 7장 와이어프레임과 동일) | `BoardPage` (Tailwind `lg:grid-cols-[280px_1fr_1fr_1fr]` 또는 flex) |

`BacklogSidebar`, `BoardColumn`, `TicketCard`는 브레이크포인트별 분기 로직을 갖지 않고, `BoardPage`가 제공하는 컨테이너 크기에 맞춰 자연스럽게 리플로우되도록 구현한다 (컴포넌트 자체는 반응형에 무관하게 재사용).

---

## 8. 접근성 요구사항 (NFR-003 매핑)

| 요구사항 | 적용 컴포넌트 |
|---|---|
| 키보드로 카드 선택 및 이동 가능 | `TicketCard`(포커스/Enter), `useDragAndDrop`(KeyboardSensor) |
| 스크린 리더 지원 (aria-label, role) | `TicketCard`(role="button", aria-label), `BoardColumn`/`BacklogSidebar`(role="list"), `TicketModal`/`ConfirmDialog`(role="dialog", aria-modal) |
| 충분한 색상 대비 | `PriorityBadge`, `OverdueBadge` |

---

## 9. 컴포넌트 ↔ API ↔ FR/US 추적 매트릭스

| 컴포넌트/훅 | 관련 API | 관련 FR | 관련 US |
|---|---|---|---|
| BacklogSidebar | GET /api/tickets | FR-002 | US-001, US-003 |
| BoardColumn | GET /api/tickets | FR-002 | US-003 |
| TicketCard | - (표시 전용) | FR-002, FR-008 | US-003, US-004, US-007 |
| TicketModal + TicketForm | POST /api/tickets, PATCH /api/tickets/:id | FR-001, FR-004 | US-001, US-002, US-007 |
| ConfirmDialog | DELETE /api/tickets/:id | FR-006 | US-008 |
| useBoardData | GET/POST/PATCH/DELETE /api/tickets, PATCH /api/tickets/:id/complete | FR-001~FR-006 | - |
| useDragAndDrop | PATCH /api/tickets/reorder, PATCH /api/tickets/:id/complete | FR-005, FR-007 | US-005, US-006 |
| useTicketForm | - (클라이언트 검증) | FR-001, FR-004 | US-001, US-002 |
