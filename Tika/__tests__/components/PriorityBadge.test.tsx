import { render, screen } from '@testing-library/react';
import { PriorityBadge } from '@/client/components/PriorityBadge';

describe('PriorityBadge', () => {
  test('priority="LOW" → 회색 계열 클래스로 "낮음" 표시', () => {
    render(<PriorityBadge priority="LOW" />);

    const badge = screen.getByText('낮음');
    expect(badge).toHaveClass('bg-priority-low-bg', 'text-priority-low-text');
  });

  test('priority="MEDIUM" → 파란색 계열 클래스로 "보통" 표시', () => {
    render(<PriorityBadge priority="MEDIUM" />);

    const badge = screen.getByText('보통');
    expect(badge).toHaveClass('bg-priority-medium-bg', 'text-priority-medium-text');
  });

  test('priority="HIGH" → 빨간색 계열 클래스로 "높음" 표시', () => {
    render(<PriorityBadge priority="HIGH" />);

    const badge = screen.getByText('높음');
    expect(badge).toHaveClass('bg-priority-high-bg', 'text-priority-high-text');
  });
});
