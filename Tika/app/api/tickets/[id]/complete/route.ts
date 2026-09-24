import { NextResponse } from 'next/server';
import { completeTicket } from '@/server/services/ticketService';

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(_request: Request, { params }: RouteParams) {
  const { id } = await params;
  const ticket = await completeTicket(Number(id));

  if (!ticket) {
    return NextResponse.json(
      { error: { code: 'TICKET_NOT_FOUND', message: '티켓을 찾을 수 없습니다' } },
      { status: 404 },
    );
  }

  return NextResponse.json(ticket);
}
