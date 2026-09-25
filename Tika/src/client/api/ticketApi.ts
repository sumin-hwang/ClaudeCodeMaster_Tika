import type {
  BoardData,
  CreateTicketInput,
  ReorderTicketInput,
  Ticket,
  TicketWithMeta,
  UpdateTicketInput,
} from '@/shared/types';

interface ApiErrorBody {
  code: string;
  message: string;
}

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
    throw body.error as ApiErrorBody;
  }

  return body as T;
}

export const getBoard = () => request<BoardData>('/tickets');

export const getTicket = (id: number) => request<TicketWithMeta>(`/tickets/${id}`);

export const createTicket = (input: CreateTicketInput) =>
  request<Ticket>('/tickets', { method: 'POST', body: JSON.stringify(input) });

export const updateTicket = (id: number, input: UpdateTicketInput) =>
  request<TicketWithMeta>(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(input) });

export const completeTicket = (id: number) =>
  request<Ticket>(`/tickets/${id}/complete`, { method: 'PATCH' });

export const deleteTicket = (id: number) => request<void>(`/tickets/${id}`, { method: 'DELETE' });

export const reorderTicket = (input: ReorderTicketInput) =>
  request<{ ticket: Ticket; affected: { id: number; position: number }[] }>('/tickets/reorder', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
