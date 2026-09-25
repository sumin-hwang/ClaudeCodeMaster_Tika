import { render, screen } from '@testing-library/react';
import { ColumnHeader } from '@/client/components/ColumnHeader';

describe('ColumnHeader', () => {
  test('title이 표시된다', () => {
    render(<ColumnHeader title="TODO" count={3} />);

    expect(screen.getByText('TODO')).toBeInTheDocument();
  });

  test('count가 표시된다', () => {
    render(<ColumnHeader title="TODO" count={3} />);

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('count=0이어도 "0"이 표시된다', () => {
    render(<ColumnHeader title="Done" count={0} />);

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  test('title이 heading 역할로 노출된다', () => {
    render(<ColumnHeader title="TODO" count={3} />);

    expect(screen.getByRole('heading', { name: 'TODO' })).toBeInTheDocument();
  });
});
