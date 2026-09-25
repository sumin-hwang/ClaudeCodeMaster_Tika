import { render, screen } from '@testing-library/react';
import { DueDateBadge } from '@/client/components/DueDateBadge';

describe('DueDateBadge', () => {
  test('dueDate 값을 그대로 표시한다', () => {
    render(<DueDateBadge dueDate="2026-10-01" />);

    expect(screen.getByText('2026-10-01')).toBeInTheDocument();
  });

  test('isOverdue=true면 경고 색상 클래스가 적용된다', () => {
    render(<DueDateBadge dueDate="2026-10-01" isOverdue />);

    expect(screen.getByText('2026-10-01')).toHaveClass('bg-overdue-bg', 'text-overdue-text');
  });

  test('isOverdue가 없으면(기본값 false) 중립 색상 클래스가 적용된다', () => {
    render(<DueDateBadge dueDate="2026-10-01" />);

    const badge = screen.getByText('2026-10-01');
    expect(badge).not.toHaveClass('bg-overdue-bg');
    expect(badge).toHaveClass('text-text-muted');
  });
});
