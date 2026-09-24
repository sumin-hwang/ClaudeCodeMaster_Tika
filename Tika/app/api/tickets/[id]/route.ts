import { NextResponse } from 'next/server';
import { updateTicketSchema } from '@/shared/validations/ticket';
import { deleteTicket, getTicketById, updateTicket } from '@/server/services/ticketService';

type RouteParams = { params: Promise<{ id: string }> };

const notFound = () =>
  NextResponse.json(
    { error: { code: 'TICKET_NOT_FOUND', message: '티켓을 찾을 수 없습니다' } },
    { status: 404 },
  );

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const ticket = await getTicketById(Number(id));

  if (!ticket) return notFound();

  return NextResponse.json(ticket);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();
  const result = updateTicketSchema.safeParse(body);

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

  const ticket = await updateTicket(Number(id), result.data);

  if (!ticket) return notFound();

  return NextResponse.json(ticket);
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const success = await deleteTicket(Number(id));

  if (!success) return notFound();

  return new NextResponse(null, { status: 204 });
}
