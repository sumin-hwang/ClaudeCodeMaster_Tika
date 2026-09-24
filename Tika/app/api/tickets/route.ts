import { NextResponse } from 'next/server';
import { createTicketSchema } from '@/shared/validations/ticket';
import { createTicket, getBoard } from '@/server/services/ticketService';

export async function GET() {
  const board = await getBoard();
  return NextResponse.json(board);
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = createTicketSchema.safeParse(body);

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

  const ticket = await createTicket(result.data);

  return NextResponse.json(ticket, { status: 201 });
}
