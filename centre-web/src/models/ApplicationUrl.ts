export interface ApplicationUrl {
    id: number;
    app_name: string;
    environment: string;
    url: string;
    /** The certificate its host serves; null for http URLs */
    certificate_id: number | null;
    is_active: boolean;
}

export type RenewalStatus = 'NONE' | 'TICKET_CREATED' | 'ORDERED' | 'PLANNED';

export const RENEWAL_STATUS_LABELS: Record<RenewalStatus, string> = {
    NONE: "No Action Taken",
    TICKET_CREATED: "Ticket Created",
    ORDERED: "Certificate Ordered",
    PLANNED: "Installation Planned",
};

/** Worked out by the API from the last check whenever it's read */
export type CertificateStatus = 'Unknown' | 'Valid' | 'Expiring Soon' | 'Expired' | 'Error';

/** Shared by every URL on an https origin */
export interface SslCertificate {
    id: number;
    origin: string;
    host: string;
    port: number;
    status: CertificateStatus;
    expires_at: string | null;
    issuer: string | null;
    /** Why the last check failed or the certificate isn't trusted */
    check_error: string | null;
    last_checked: string | null;
    /** Renewed by the OpenShift platform, not by staff */
    is_platform_managed: boolean;
    ticket_reference: string | null;
    renewal_status: RenewalStatus;
    renewal_comments: string | null;
}

export interface CreateApplicationUrlPayload {
    app_name: string;
    environment: string;
    url: string;
}

export interface UpdateApplicationUrlPayload {
    id: number;
    url: string;
}

export interface UpdateCertificateRenewalPayload {
    id: number;
    ticket_reference: string | null;
    renewal_status: RenewalStatus;
    renewal_comments: string | null;
}
