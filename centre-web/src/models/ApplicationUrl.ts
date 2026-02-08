export interface ApplicationUrl {
    id: number;
    app_name: string;
    environment: string;
    url: string;
    ssl_expiry: string | null;
    ssl_status: string | null;
    ssl_error_message: string | null;
    last_checked: string | null;
    is_active: boolean;
}
