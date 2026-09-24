# Contract: POST /api/tickets

> 정본은 `docs/API_SPEC.md` "1. POST /api/tickets"이다. 이 파일은 spec-kit 산출물 규칙에 따라 이 기능의 계약을 독립적으로 요약한다 — 두 문서가 상충하면 `docs/API_SPEC.md`가 우선한다 (Constitution II).

## Request

`POST /api/tickets`

```json
{
  "title": "API 설계 문서 작성",
  "description": "REST API 엔드포인트와 요청/응답 형식을 정의한다",
  "priority": "HIGH",
  "plannedStartDate": "2026-02-10",
  "dueDate": "2026-02-15"
}
```

`title`만 필수, 나머지는 선택.

## Response — 201 Created

```json
{
  "id": 1,
  "title": "API 설계 문서 작성",
  "description": "REST API 엔드포인트와 요청/응답 형식을 정의한다",
  "status": "BACKLOG",
  "priority": "HIGH",
  "position": -1024,
  "plannedStartDate": "2026-02-10",
  "dueDate": "2026-02-15",
  "startedAt": null,
  "completedAt": null,
  "createdAt": "2026-02-01T09:00:00.000Z",
  "updatedAt": "2026-02-01T09:00:00.000Z"
}
```

## Response — 400 Bad Request

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "제목을 입력해주세요"
  }
}
```

| 조건 | message |
|---|---|
| 제목 누락 | 제목을 입력해주세요 |
| 제목 200자 초과 | 제목은 200자 이내로 입력해주세요 |
| 제목 공백만 입력 | 제목을 입력해주세요 |
| 설명 1000자 초과 | 설명은 1000자 이내로 입력해주세요 |
| 잘못된 우선순위 값 | 우선순위는 LOW, MEDIUM, HIGH 중 선택해주세요 |
| 과거 종료예정일 | 종료예정일은 오늘 이후 날짜를 선택해주세요 |

## 이 계약을 검증하는 테스트

`__tests__/api/tickets.test.ts`의 TC-API-001-01~09 (`docs/TEST_CASES.md` 동일 ID).
