export interface ApplicationUrl {
    id: number;
    app_name: string;
    environment: string;
    url: string;
    ssl_expiry: string | null;
    ssl_status: string | null;
    ssl_error_message: string | null;
    ticket_reference: string | null;
    renewal_status: 'NONE' | 'TICKET_CREATED' | 'ORDERED' | 'PLANNED' | null;
    renewal_comments: string | null;
    last_checked: string | null;
    is_active: boolean;
}

export type RenewalStatus =
    | 'NONE'
    | 'TICKET_CREATED'
    | 'ORDERED'
    | 'PLANNED'
    | null;

export interface CreateApplicationUrlPayload {
    app_name: string;
    environment: string;
    url: string;
    ticket_reference?: string | null;
    renewal_status?: RenewalStatus;
    renewal_comments?: string | null;
}
