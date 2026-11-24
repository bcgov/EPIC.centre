import dayjs, { Dayjs } from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

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

/** "Checked 3 hours ago", or "Not checked yet" */
export const describeLastChecked = (lastChecked: string | null): string => {
    const checked = lastChecked ? dayjs(lastChecked) : null;
    return checked?.isValid() ? `Checked ${checked.fromNow()}` : "Not checked yet";
};
