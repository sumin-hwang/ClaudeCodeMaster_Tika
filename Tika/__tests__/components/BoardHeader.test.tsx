import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BoardHeader } from '@/client/components/BoardHeader';

describe('BoardHeader', () => {
  test('"Tika" 제목이 렌더된다', () => {
    render(<BoardHeader onCreateClick={jest.fn()} />);

    expect(screen.getByRole('heading', { name: 'Tika' })).toBeInTheDocument();
  });

  test('"새 업무" 버튼이 렌더된다', () => {
    render(<BoardHeader onCreateClick={jest.fn()} />);

    expect(screen.getByRole('button', { name: '새 업무' })).toBeInTheDocument();
  });

  test('"새 업무" 버튼 클릭 시 onCreateClick이 호출된다', async () => {
    const user = userEvent.setup();
    const onCreateClick = jest.fn();
    render(<BoardHeader onCreateClick={onCreateClick} />);

    await user.click(screen.getByRole('button', { name: '새 업무' }));

    expect(onCreateClick).toHaveBeenCalledTimes(1);
  });

  test('검색 input이 렌더되지만 비활성화 상태다', () => {
    render(<BoardHeader onCreateClick={jest.fn()} />);

    expect(screen.getByPlaceholderText('검색 (준비 중)')).toBeDisabled();
  });
});
