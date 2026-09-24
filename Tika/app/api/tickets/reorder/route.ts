import { NextResponse } from 'next/server';
import { reorderTicketSchema } from '@/shared/validations/ticket';
import { reorderTicket } from '@/server/services/ticketService';

export async function PATCH(request: Request) {
  const body = await request.json();
  const result = reorderTicketSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: result.error.issues[0].message,
        },
      },
      { status: 400 },
    );
  }

  const outcome = await reorderTicket(result.data);

  if (!outcome) {
    return NextResponse.json(
      { error: { code: 'TICKET_NOT_FOUND', message: '티켓을 찾을 수 없습니다' } },
      { status: 404 },
    );
  }

  return NextResponse.json(outcome);
}
