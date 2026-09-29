import type {
  BoardData,
  CreateTicketInput,
  ReorderTicketInput,
  Ticket,
  TicketWithMeta,
  UpdateTicketInput,
} from '@/shared/types';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method: 'GET',
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error.message);
  }

  return body as T;
}

export const getBoard = () => request<BoardData>('/tickets');

export const getTicket = (id: number) => request<TicketWithMeta>(`/tickets/${id}`);

export const create = (input: CreateTicketInput) =>
  request<Ticket>('/tickets', { method: 'POST', body: JSON.stringify(input) });

export const update = (id: number, input: UpdateTicketInput) =>
  request<TicketWithMeta>(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(input) });

export const complete = (id: number) =>
  request<Ticket>(`/tickets/${id}/complete`, { method: 'PATCH' });

export const remove = (id: number) => request<void>(`/tickets/${id}`, { method: 'DELETE' });

export const reorder = (input: ReorderTicketInput) =>
  request<{ ticket: Ticket; affected: { id: number; position: number }[] }>('/tickets/reorder', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
