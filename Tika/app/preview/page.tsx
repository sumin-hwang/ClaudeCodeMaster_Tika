'use client';

/**
 * 컴포넌트 프리뷰 갤러리.
 *
 * DB/API 연결 없이 목 데이터로 개별 컴포넌트를 렌더링해 눈으로 확인하기 위한 페이지.
 * docs/FRONTEND_TASKS.md의 Phase 번호와 섹션을 1:1로 맞춘다.
 * Phase 2(ticketApi.ts, useTicketForm)는 시각적 결과물이 없는 인프라라 섹션을 두지 않는다.
 *
 * 각 Phase의 컴포넌트가 완성되면 해당 섹션에 import + 목 데이터를 채워 넣는다.
 */

import { useState } from 'react';
import { DndContext } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '@/client/components/Button';
import { PriorityBadge } from '@/client/components/PriorityBadge';
import { DueDateBadge } from '@/client/components/DueDateBadge';
import { Modal } from '@/client/components/Modal';
import { ConfirmDialog } from '@/client/components/ConfirmDialog';
import { TicketCard } from '@/client/components/TicketCard';
import { Board } from '@/client/components/Board';
import { TicketForm } from '@/client/components/TicketForm';
import { TicketModal } from '@/client/components/TicketModal';
import type { BoardData, CreateTicketInput, Ticket, TicketWithMeta, UpdateTicketInput } from '@/shared/types';

const MOCK_TICKETS: TicketWithMeta[] = [
  {
    id: 1,
    title: '일반 티켓 예시',
    description: null,
    status: 'TODO',
    priority: 'MEDIUM',
    position: 0,
    plannedStartDate: null,
    dueDate: '2026-10-01',
    startedAt: null,
    completedAt: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    isOverdue: false,
  },
  {
    id: 2,
    title: '기한이 지난, 그리고 아주 아주 긴 제목이라 말줄임이 필요한 티켓 예시',
    description: null,
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    position: 0,
    plannedStartDate: null,
    dueDate: '2026-09-01',
    startedAt: '2026-09-01T00:00:00.000Z',
    completedAt: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    isOverdue: true,
  },
  {
    id: 3,
    title: '완료된 티켓 예시',
    description: null,
    status: 'DONE',
    priority: 'LOW',
    position: 0,
    plannedStartDate: null,
    dueDate: null,
    startedAt: '2026-08-01T00:00:00.000Z',
    completedAt: '2026-09-01T00:00:00.000Z',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    isOverdue: false,
  },
];

function Phase3Section() {
  const [lastClicked, setLastClicked] = useState<string | null>(null);

  return (
    <section aria-labelledby="phase-3-heading" className="rounded-panel border border-border bg-surface p-6">
      <h2 id="phase-3-heading" className="text-lg font-semibold text-text">
        Phase 3 — TicketCard
      </h2>
      {lastClicked && <p className="mt-1 text-xs text-text-muted">마지막 클릭: {lastClicked}</p>}
      <div className="mt-4 flex max-w-xs flex-col gap-3">
        <DndContext>
          <SortableContext items={MOCK_TICKETS.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {MOCK_TICKETS.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} onClick={(t) => setLastClicked(t.title)} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </section>
  );
}

const makeMockTicket = (overrides: Partial<TicketWithMeta>): TicketWithMeta => ({
  id: 0,
  title: '티켓',
  description: null,
  status: 'BACKLOG',
  priority: 'MEDIUM',
  position: 0,
  plannedStartDate: null,
  dueDate: null,
  startedAt: null,
  completedAt: null,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
  isOverdue: false,
  ...overrides,
});

const MOCK_BOARD: BoardData['board'] = {
  BACKLOG: [
    makeMockTicket({ id: 101, title: '백로그 티켓 (HIGH)', status: 'BACKLOG', priority: 'HIGH' }),
    makeMockTicket({ id: 102, title: '백로그 티켓 B', status: 'BACKLOG', priority: 'LOW' }),
  ],
  TODO: [
    makeMockTicket({
      id: 103,
      title: '할 일 티켓 (기한 초과)',
      status: 'TODO',
      priority: 'HIGH',
      dueDate: '2026-09-01',
      isOverdue: true,
    }),
    makeMockTicket({ id: 104, title: '할 일 티켓 B', status: 'TODO', dueDate: '2026-10-05' }),
    makeMockTicket({ id: 105, title: '할 일 티켓 C', status: 'TODO', priority: 'LOW' }),
  ],
  IN_PROGRESS: [
    makeMockTicket({
      id: 106,
      title: '진행 중인 티켓',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      dueDate: '2026-10-10',
    }),
  ],
  DONE: [makeMockTicket({ id: 107, title: '완료된 티켓', status: 'DONE', priority: 'LOW' })],
};

function Phase4Section() {
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketWithMeta | null>(null);

  const handleCardClick = (ticket: TicketWithMeta) => {
    setLastAction(`카드 클릭: ${ticket.title}`);
    setSelectedTicket(ticket);
  };

  const handleModalSubmit = async (data: CreateTicketInput | UpdateTicketInput) => {
    setLastAction(`제출: ${JSON.stringify(data)}`);
  };

  const handleDelete = async () => {
    setLastAction(`삭제 확정: ${selectedTicket?.title}`);
    setSelectedTicket(null);
  };

  return (
    <section aria-labelledby="phase-4-heading" className="rounded-panel border border-border bg-surface p-6">
      <h2 id="phase-4-heading" className="text-lg font-semibold text-text">
        Phase 4 — ColumnHeader / Column / Board
      </h2>
      {lastAction && <p className="mt-1 break-all text-xs text-text-muted">{lastAction}</p>}

      <div className="mt-4">
        <Button onClick={() => setIsCreateModalOpen(true)}>티켓생성</Button>
      </div>

      <div className="mt-4">
        <DndContext>
          <Board board={MOCK_BOARD} onCardClick={handleCardClick} />
        </DndContext>
      </div>

      <TicketModal
        mode="create"
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleModalSubmit}
      />

      {selectedTicket && (
        <TicketModal
          mode="edit"
          ticket={selectedTicket}
          isOpen
          onClose={() => setSelectedTicket(null)}
          onSubmit={handleModalSubmit}
          onDelete={handleDelete}
        />
      )}
    </section>
  );
}

function Phase1Section() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  return (
    <section aria-labelledby="phase-1-heading" className="rounded-panel border border-border bg-surface p-6">
      <h2 id="phase-1-heading" className="text-lg font-semibold text-text">
        Phase 1 — 말단 컴포넌트
      </h2>

      <div className="mt-4 flex flex-col gap-6">
        <div>
          <h3 className="text-sm font-semibold text-text-muted">Button (FE-T100)</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="ghost">Ghost</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
            <Button isLoading>저장</Button>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-text-muted">PriorityBadge (FE-T101)</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <PriorityBadge priority="LOW" />
            <PriorityBadge priority="MEDIUM" />
            <PriorityBadge priority="HIGH" />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-text-muted">DueDateBadge (FE-T102)</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <DueDateBadge dueDate="2026-10-01" />
            <DueDateBadge dueDate="2026-09-01" isOverdue />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-text-muted">Modal (FE-T104)</h3>
          <div className="mt-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
              Modal 열기
            </Button>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
              <p className="text-text">범용 Modal 프리미티브 프리뷰입니다.</p>
              <div className="mt-4 flex justify-end">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                  닫기
                </Button>
              </div>
            </Modal>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-text-muted">ConfirmDialog (FE-T103)</h3>
          <div className="mt-2">
            <Button variant="danger" onClick={() => setIsConfirmOpen(true)}>
              삭제 확인 다이얼로그 열기
            </Button>
            <ConfirmDialog
              isOpen={isConfirmOpen}
              title="티켓 삭제"
              message="정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
              onConfirm={() => setIsConfirmOpen(false)}
              onCancel={() => setIsConfirmOpen(false)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

const MOCK_EDIT_TICKET: Ticket = {
  id: 201,
  title: '기존 티켓 제목',
  description: '기존 설명',
  status: 'IN_PROGRESS',
  priority: 'HIGH',
  position: 0,
  plannedStartDate: null,
  dueDate: '2026-10-10',
  startedAt: '2026-09-20T00:00:00.000Z',
  completedAt: null,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-20T00:00:00.000Z',
};

function Phase5Section() {
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const handleSubmit = async (data: CreateTicketInput) => {
    setSubmitted(JSON.stringify(data));
  };

  const handleModalSubmit = async (data: CreateTicketInput | UpdateTicketInput) => {
    setLastAction(`제출: ${JSON.stringify(data)}`);
  };

  const handleDelete = async () => {
    setLastAction('삭제 확정됨 (onDelete 호출)');
  };

  return (
    <section aria-labelledby="phase-5-heading" className="rounded-panel border border-border bg-surface p-6">
      <h2 id="phase-5-heading" className="text-lg font-semibold text-text">
        Phase 5 — TicketForm
      </h2>
      {submitted && <p className="mt-1 break-all text-xs text-text-muted">마지막 제출: {submitted}</p>}
      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-text-muted">생성 모드 (FE-T501)</h3>
          <div className="mt-2">
            <TicketForm onSubmit={handleSubmit} submitLabel="생성" />
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text-muted">수정 모드 (FE-T501)</h3>
          <div className="mt-2">
            <TicketForm
              initialValues={{ title: '기존 티켓 제목', priority: 'HIGH', dueDate: '2026-10-10' }}
              onSubmit={handleSubmit}
              submitLabel="수정"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-border pt-4">
        <h3 className="text-sm font-semibold text-text-muted">TicketModal (FE-T502)</h3>
        {lastAction && <p className="mt-1 break-all text-xs text-text-muted">{lastAction}</p>}
        <div className="mt-2 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setIsCreateModalOpen(true)}>
            생성 모달 열기
          </Button>
          <Button variant="secondary" onClick={() => setIsEditModalOpen(true)}>
            수정 모달 열기 (삭제 2단계 확인 포함)
          </Button>
        </div>

        <TicketModal
          mode="create"
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleModalSubmit}
        />
        <TicketModal
          mode="edit"
          ticket={MOCK_EDIT_TICKET}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleModalSubmit}
          onDelete={handleDelete}
        />
      </div>
    </section>
  );
}

function PreviewSection({
  phaseId,
  title,
  todo,
}: {
  phaseId: string;
  title: string;
  todo: string;
}) {
  const headingId = `${phaseId}-heading`;

  return (
    <section aria-labelledby={headingId} className="rounded-panel border border-border bg-surface p-6">
      <h2 id={headingId} className="text-lg font-semibold text-text">
        {title}
      </h2>
      <div className="mt-4 flex min-h-24 items-center justify-center rounded-card border border-dashed border-border text-sm text-text-muted">
        아직 구현된 컴포넌트 없음 ({todo})
      </div>
    </section>
  );
}

export default function PreviewPage() {
  return (
    <main className="min-h-screen bg-surface-muted p-8">
      <h1 className="text-2xl font-bold text-text">Tika 컴포넌트 프리뷰</h1>
      <p className="mt-1 text-sm text-text-muted">
        FRONTEND_TASKS.md의 Phase 순서대로 컴포넌트가 채워집니다. (Phase 2는 인프라 전용이라 시각 섹션 없음)
      </p>

      <div className="mt-8 flex flex-col gap-6">
        <Phase1Section />
        <Phase3Section />
        <Phase4Section />
        <Phase5Section />
        <PreviewSection phaseId="phase-6" title="Phase 6 — BoardPage" todo="FE-T601 BoardPage" />
      </div>
    </main>
  );
}
