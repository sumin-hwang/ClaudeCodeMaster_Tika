/**
 * TC-COMP-004: TicketForm (생성/수정 공용 폼)
 * 참고: docs/TEST_CASES.md TC-COMP-004, docs/COMPONENT_SPEC.md 5.2
 *
 * useTicketForm(이미 구현/테스트됨)을 그대로 사용해 실제 검증 동작까지 함께 확인한다(mock하지 않음).
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketForm } from '@/client/components/TicketForm';

describe('TicketForm', () => {
  test('C004-1: 생성 모드 — 필드가 비어 있고 우선순위는 MEDIUM 기본값이다', () => {
    render(<TicketForm onSubmit={jest.fn()} submitLabel="생성" />);

    expect(screen.getByLabelText('제목')).toHaveValue('');
    expect(screen.getByLabelText('설명')).toHaveValue('');
    expect(screen.getByLabelText('우선순위')).toHaveValue('MEDIUM');
  });

  test('C004-2: 수정 모드 — initialValues가 필드에 반영된다', () => {
    render(
      <TicketForm
        initialValues={{ title: '기존 제목', description: '기존 설명', priority: 'HIGH' }}
        onSubmit={jest.fn()}
        submitLabel="수정"
      />
    );

    expect(screen.getByLabelText('제목')).toHaveValue('기존 제목');
    expect(screen.getByLabelText('설명')).toHaveValue('기존 설명');
    expect(screen.getByLabelText('우선순위')).toHaveValue('HIGH');
  });

  test('C004-3: 제목이 비어 있으면 "제목을 입력해주세요" 에러가 표시된다', async () => {
    const user = userEvent.setup();
    const handleSubmit = jest.fn();
    render(<TicketForm onSubmit={handleSubmit} submitLabel="생성" />);

    await user.click(screen.getByRole('button', { name: '생성' }));

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('제목을 입력해주세요')).toBeInTheDocument();
  });

  test('C004-4: 종료예정일이 과거면 "종료예정일은 오늘 이후 날짜를 선택해주세요" 에러가 표시된다', async () => {
    const user = userEvent.setup();
    const handleSubmit = jest.fn();
    render(<TicketForm initialValues={{ title: '제목' }} onSubmit={handleSubmit} submitLabel="생성" />);

    fireEvent.change(screen.getByLabelText('종료예정일'), { target: { value: '2020-01-01' } });
    await user.click(screen.getByRole('button', { name: '생성' }));

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('종료예정일은 오늘 이후 날짜를 선택해주세요')).toBeInTheDocument();
  });

  test('C004-5: 시작예정일 date input이 렌더된다', () => {
    render(<TicketForm onSubmit={jest.fn()} submitLabel="생성" />);

    expect(screen.getByLabelText('시작예정일')).toHaveAttribute('type', 'date');
  });

  test('C004-6: 유효한 값으로 제출하면 onSubmit이 입력한 데이터와 함께 호출된다', async () => {
    const user = userEvent.setup();
    const handleSubmit = jest.fn().mockResolvedValue(undefined);
    render(<TicketForm onSubmit={handleSubmit} submitLabel="생성" />);

    await user.type(screen.getByLabelText('제목'), '새 티켓');
    await user.click(screen.getByRole('button', { name: '생성' }));

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: '새 티켓' }));
  });

  test('C004-7: 제출 중이면 제출 버튼이 비활성화된다', async () => {
    const user = userEvent.setup();
    let resolveSubmit: () => void = () => {};
    const handleSubmit = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        })
    );
    render(<TicketForm initialValues={{ title: '제목' }} onSubmit={handleSubmit} submitLabel="생성" />);

    const submitButton = screen.getByRole('button', { name: '생성' });
    await user.click(submitButton);

    await waitFor(() => expect(submitButton).toBeDisabled());

    await act(async () => {
      resolveSubmit();
    });
  });
});
