import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterBar } from '@/client/components/FilterBar';

describe('FilterBar', () => {
  test('"이번주 업무" 버튼에 weekCount가 표시된다', () => {
    render(
      <FilterBar weekCount={3} overdueCount={1} activeFilter="all" onFilterChange={jest.fn()} />
    );

    expect(screen.getByRole('button', { name: /이번주 업무/ })).toHaveTextContent('3');
  });

  test('"일정 초과" 버튼에 overdueCount가 표시된다', () => {
    render(
      <FilterBar weekCount={3} overdueCount={1} activeFilter="all" onFilterChange={jest.fn()} />
    );

    expect(screen.getByRole('button', { name: /일정 초과/ })).toHaveTextContent('1');
  });

  test('"이번주 업무" 클릭 시 onFilterChange("week")가 호출된다', async () => {
    const user = userEvent.setup();
    const onFilterChange = jest.fn();
    render(
      <FilterBar
        weekCount={3}
        overdueCount={1}
        activeFilter="all"
        onFilterChange={onFilterChange}
      />
    );

    await user.click(screen.getByRole('button', { name: /이번주 업무/ }));

    expect(onFilterChange).toHaveBeenCalledWith('week');
  });

  test('"일정 초과" 클릭 시 onFilterChange("overdue")가 호출된다', async () => {
    const user = userEvent.setup();
    const onFilterChange = jest.fn();
    render(
      <FilterBar
        weekCount={3}
        overdueCount={1}
        activeFilter="all"
        onFilterChange={onFilterChange}
      />
    );

    await user.click(screen.getByRole('button', { name: /일정 초과/ }));

    expect(onFilterChange).toHaveBeenCalledWith('overdue');
  });

  test('활성 필터를 다시 클릭하면 onFilterChange("all")가 호출된다', async () => {
    const user = userEvent.setup();
    const onFilterChange = jest.fn();
    render(
      <FilterBar
        weekCount={3}
        overdueCount={1}
        activeFilter="week"
        onFilterChange={onFilterChange}
      />
    );

    await user.click(screen.getByRole('button', { name: /이번주 업무/ }));

    expect(onFilterChange).toHaveBeenCalledWith('all');
  });

  test('activeFilter와 일치하는 버튼만 aria-pressed="true"다', () => {
    render(
      <FilterBar
        weekCount={3}
        overdueCount={1}
        activeFilter="overdue"
        onFilterChange={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /이번주 업무/ })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(screen.getByRole('button', { name: /일정 초과/ })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
  });
});
