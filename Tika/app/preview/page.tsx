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
import { Button } from '@/client/components/Button';
import { PriorityBadge } from '@/client/components/PriorityBadge';
import { DueDateBadge } from '@/client/components/DueDateBadge';
import { Modal } from '@/client/components/Modal';
import { ConfirmDialog } from '@/client/components/ConfirmDialog';

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
        <PreviewSection phaseId="phase-3" title="Phase 3 — TicketCard" todo="FE-T301 TicketCard" />
        <PreviewSection
          phaseId="phase-4"
          title="Phase 4 — 컬럼/사이드바 컨테이너"
          todo="FE-T401 BoardColumn, FE-T402 BacklogSidebar"
        />
        <PreviewSection
          phaseId="phase-5"
          title="Phase 5 — 폼/모달"
          todo="FE-T501 TicketForm, FE-T502 TicketModal"
        />
        <PreviewSection phaseId="phase-6" title="Phase 6 — BoardPage" todo="FE-T601 BoardPage" />
      </div>
    </main>
  );
}
