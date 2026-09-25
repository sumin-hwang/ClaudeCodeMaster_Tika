// FE에서 사용하는 핵심 타입

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

export interface TicketWithMeta extends Ticket {
    isOverdue : boolean // 서버에서 계산된 파생 필드 
}

export interface BoardData {
    board : Record <TicketStatus, TicketWithMeta[]>;
    total : number;
}