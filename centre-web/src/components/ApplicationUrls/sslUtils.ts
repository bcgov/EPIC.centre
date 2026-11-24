import dayjs, { Dayjs } from "dayjs";

const PLATFORM_DOMAIN = "devops.gov.bc.ca";

/** True for hosts under devops.gov.bc.ca, whose certificates the OpenShift platform renews. */
export const isPlatformManagedHost = (hostname: string): boolean => {
    const host = hostname.toLowerCase();
    return host === PLATFORM_DOMAIN || host.endsWith(`.${PLATFORM_DOMAIN}`);
};

export const isPlatformManagedUrl = (url: string): boolean => {
    try {
        return isPlatformManagedHost(new URL(url).hostname);
    } catch {
        return false;
    }
};

export type ExpiryInfo = {
    expiry: Dayjs;
    expired: boolean;
    /** Calendar days from today; 0 means it expires later today. */
    daysLeft: number;
    /** "Expired", "Today", "In 3 days" or "In ~2 months" */
    text: string;
};

const describeExpiry = (expired: boolean, daysLeft: number): string => {
    if (expired) return "Expired";
    if (daysLeft === 0) return "Today";
    if (daysLeft <= 30) return `In ${daysLeft} day${daysLeft === 1 ? "" : "s"}`;
    const months = Math.round(daysLeft / 30);
    return `In ~${months} month${months === 1 ? "" : "s"}`;
};

export const getExpiryInfo = (expiryDate: string | null): ExpiryInfo | null => {
    if (!expiryDate) return null;
    const expiry = dayjs(expiryDate);
    if (!expiry.isValid()) return null;

    const now = dayjs();
    // diff() truncates, so a certificate that expired hours ago would read as "Today"
    const expired = !expiry.isAfter(now);
    const daysLeft = expiry.startOf("day").diff(now.startOf("day"), "day");
    return { expiry, expired, daysLeft, text: describeExpiry(expired, daysLeft) };
};
