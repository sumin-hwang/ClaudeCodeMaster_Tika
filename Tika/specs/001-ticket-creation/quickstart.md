# Quickstart: 티켓 생성 (POST /api/tickets) 검증

## Prerequisites

- 로컬 PostgreSQL이 `localhost:5432`에서 실행 중이고, `tika_user`/`tika_dev`/`tika_test`가 존재
- `Tika/.env.local`에 `DATABASE_URL`(→ `tika_dev`), `Tika/.env.test`에 `DATABASE_URL`(→ `tika_test`) 설정됨
- `npm install` 완료

## Setup

```bash
cd Tika
npm run db:push   # tickets 테이블을 tika_dev에 생성/동기화
```

## Run

자동 테스트로 계약(`contracts/post-tickets.md`) 및 요구사항(`spec.md`의 FR-001~010)을 검증한다:

```bash
npm test -- __tests__/api/tickets.test.ts
```

## Expected Outcome

- TC-API-001-01, 03~09: PASS (필수값만 입력 생성, 각종 검증 실패 케이스, position 계산)
- TC-API-001-02: 테스트 데이터의 `dueDate`가 하드코딩된 과거 상대 날짜라 시스템 시각에 따라 실패할 수 있음 — 알려진 이슈이며 구현 결함이 아님

## 수동 확인 (선택)

```bash
npm run dev
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{"title":"새 티켓"}'
```

`201`과 함께 `status: "BACKLOG"`, `priority: "MEDIUM"`인 티켓 JSON이 반환되면 정상.
