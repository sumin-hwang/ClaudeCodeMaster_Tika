import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/client/components/Button';

describe('Button - 기본 렌더링', () => {
  test('children이 그대로 렌더된다', () => {
    render(<Button>저장</Button>);

    expect(screen.getByText('저장')).toBeInTheDocument();
  });

  test('variant/size 미지정 시 기본값(primary, md) 클래스가 적용된다', () => {
    render(<Button>저장</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary');
    expect(button).toHaveClass('text-base');
  });
});

describe('Button - variant별 클래스', () => {
  test('variant="primary" → bg-primary', () => {
    render(<Button variant="primary">버튼</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-primary');
  });

  test('variant="secondary" → border-border', () => {
    render(<Button variant="secondary">버튼</Button>);
    expect(screen.getByRole('button')).toHaveClass('border-border');
  });

  test('variant="danger" → bg-danger', () => {
    render(<Button variant="danger">버튼</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-danger');
  });

  test('variant="ghost" → bg-transparent', () => {
    render(<Button variant="ghost">버튼</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-transparent');
  });
});

describe('Button - size별 클래스', () => {
  test('size="sm" → text-sm', () => {
    render(<Button size="sm">버튼</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-sm');
  });

  test('size="md" → text-base', () => {
    render(<Button size="md">버튼</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-base');
  });

  test('size="lg" → text-lg', () => {
    render(<Button size="lg">버튼</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-lg');
  });
});

describe('Button - onClick', () => {
  test('클릭 시 onClick 핸들러가 1회 호출된다', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>버튼</Button>);

    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

describe('Button - isLoading', () => {
  test('isLoading=true면 비활성화되고 "처리중 ..." 텍스트가 표시된다', () => {
    render(<Button isLoading>저장</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText('처리중 ...')).toBeInTheDocument();
  });

  test('isLoading=true일 때 클릭해도 onClick이 호출되지 않는다', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    render(
      <Button isLoading onClick={handleClick}>
        저장
      </Button>
    );

    await user.click(screen.getByRole('button'));

    expect(handleClick).not.toHaveBeenCalled();
  });
});
