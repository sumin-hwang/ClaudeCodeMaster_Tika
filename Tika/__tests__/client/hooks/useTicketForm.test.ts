/**
 * FE-T202: useTicketForm — src/shared/validations의 createTicketSchema로 제출 전 검증
 * 참고: docs/TEST_CASES.md TC-COMP-004-04(과거 종료예정일), TC-COMP-004-06(제목 공백)
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { useTicketForm } from '@/client/hooks/useTicketForm';

const fakeEvent = { preventDefault: jest.fn() } as unknown as React.FormEvent;

describe('useTicketForm', () => {
  test('initialValues로 values가 초기화된다', () => {
    const { result } = renderHook(() =>
      useTicketForm({ initialValues: { title: '초기 제목' }, onSubmit: jest.fn() })
    );

    expect(result.current.values.title).toBe('초기 제목');
  });

  test('handleChange로 필드 값이 갱신된다', () => {
    const { result } = renderHook(() => useTicketForm({ onSubmit: jest.fn() }));

    act(() => {
      result.current.handleChange('title', '변경된 제목');
    });

    expect(result.current.values.title).toBe('변경된 제목');
  });

  test('TC-COMP-004-06: 제목이 공백만 있으면 제출이 차단되고 에러 메시지가 표시된다', async () => {
    const handleSubmit = jest.fn();
    const { result } = renderHook(() =>
      useTicketForm({ initialValues: { title: '   ' }, onSubmit: handleSubmit })
    );

    await act(async () => {
      await result.current.handleSubmit(fakeEvent);
    });

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(result.current.errors.title).toBe('제목을 입력해주세요');
  });

  test('TC-COMP-004-04: 종료예정일이 과거면 제출이 차단되고 에러 메시지가 표시된다', async () => {
    const handleSubmit = jest.fn();
    const { result } = renderHook(() =>
      useTicketForm({
        initialValues: { title: '제목', dueDate: '2020-01-01' },
        onSubmit: handleSubmit,
      })
    );

    await act(async () => {
      await result.current.handleSubmit(fakeEvent);
    });

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(result.current.errors.dueDate).toBe('종료예정일은 오늘 이후 날짜를 선택해주세요');
  });

  test('유효한 입력이면 onSubmit이 값과 함께 호출되고 errors가 비워진다', async () => {
    const handleSubmit = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useTicketForm({ initialValues: { title: '유효한 제목' }, onSubmit: handleSubmit })
    );

    await act(async () => {
      await result.current.handleSubmit(fakeEvent);
    });

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: '유효한 제목' }));
    expect(result.current.errors).toEqual({});
  });

  test('제출 중에는 isSubmitting이 true였다가, 완료되면 false로 돌아온다', async () => {
    let resolveSubmit: () => void = () => {};
    const handleSubmit = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        })
    );
    const { result } = renderHook(() =>
      useTicketForm({ initialValues: { title: '유효한 제목' }, onSubmit: handleSubmit })
    );

    expect(result.current.isSubmitting).toBe(false);

    act(() => {
      result.current.handleSubmit(fakeEvent);
    });

    await waitFor(() => expect(result.current.isSubmitting).toBe(true));

    await act(async () => {
      resolveSubmit();
    });

    expect(result.current.isSubmitting).toBe(false);
  });
});
