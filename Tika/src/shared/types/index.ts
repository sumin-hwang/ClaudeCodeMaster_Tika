// FE에서 사용하는 핵심 타입

export type { CreateTicketInput, UpdateTicketInput } from '@/shared/validations/ticket';

export const TICKET_STATUS = {
    BACKLOG : 'BACKLOG', 
    TODO: 'TODO',
    IN_PROGRESS : 'IN_PROGRESS', 
    DONE : 'DONE',
 } as const;

export const TICKET_PRIORITY = {
    LOW : 'LOW',
    MEDIUM : 'MEDIUM',
    HIGH : 'HIGH'
} as const;

export type TicketStatus = typeof TICKET_STATUS[keyof typeof TICKET_STATUS];
export type TicketPriority = typeof TICKET_PRIORITY[keyof typeof TICKET_PRIORITY];

export interface Ticket {
    id: number;
    title: string;
    description: string | null;
    status: TicketStatus;
    priority: TicketPriority;
    position: number;
    plannedStartDate: string | null;
    dueDate: string | null;
    startedAt: string | null;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface TicketWithMeta extends Ticket {
    isOverdue : boolean // 서버에서 계산된 파생 필드 
}

export interface BoardData {
    board : Record <TicketStatus, TicketWithMeta[]>;
    total : number;
}