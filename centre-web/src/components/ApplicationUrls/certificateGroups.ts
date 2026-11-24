import { ApplicationUrl, SslCertificate } from "@/models/ApplicationUrl";
import { getExpiryInfo } from "./sslUtils";

/** A certificate and the URLs on its origin */
export type CertificateGroup = {
    certificate: SslCertificate;
    rows: ApplicationUrl[];
    appCount: number;
    /** The row that stands for the certificate: the bare origin if there is one */
    rootRow: ApplicationUrl;
};

export type RowMeta = {
    /** Null for an http URL, which has no certificate */
    group: CertificateGroup | null;
    /** A path on a host whose certificate another row stands for */
    inherited: boolean;
};

export type Urgency = { priority: number; expiry: number };

const FAR_FUTURE_TIMESTAMP = Number.MAX_SAFE_INTEGER;
const ENV_ORDER: Record<string, number> = { PROD: 1, TEST: 2, DEV: 3 };

const isPathRoute = (url: string): boolean => {
    try {
        return new URL(url).pathname !== "/";
    } catch {
        return false;
    }
};

export const getEnvOrder = (environment: string) => ENV_ORDER[environment] || 99;

/** PROD, TEST, DEV, then any others by name */
export const compareEnvironments = (a: ApplicationUrl, b: ApplicationUrl): number =>
    getEnvOrder(a.environment) - getEnvOrder(b.environment) ||
    a.environment.localeCompare(b.environment) ||
    a.id - b.id;

export const getStatusPriority = (status: string | null): number => {
    switch (status) {
        case "Expired":
        case "Error":
            return 0;
        case "Expiring Soon":
            return 1;
        case "Valid":
            return 2;
        default:
            return 3;
    }
};

export const getExpiryTime = (expiryDate: string | null): number =>
    getExpiryInfo(expiryDate)?.expiry.valueOf() ?? FAR_FUTURE_TIMESTAMP;

/** Group URLs by certificate and work out each row's role in its group. */
export const buildCertificateIndex = (urls: ApplicationUrl[], certificates: SslCertificate[]) => {
    const certificatesById = new Map(certificates.map((certificate) => [certificate.id, certificate]));
    const rowsByCertificate = new Map<number, ApplicationUrl[]>();
    urls.forEach((url) => {
        if (url.certificate_id === null || !certificatesById.has(url.certificate_id)) {
            return;
        }
        const rows = rowsByCertificate.get(url.certificate_id);
        if (rows) {
            rows.push(url);
        } else {
            rowsByCertificate.set(url.certificate_id, [url]);
        }
    });

    const certificateGroups: CertificateGroup[] = [];
    const rowMeta = new Map<number, RowMeta>();

    rowsByCertificate.forEach((rows, certificateId) => {
        const rootRow = [...rows].sort((a, b) =>
            Number(isPathRoute(a.url)) - Number(isPathRoute(b.url)) ||
            getEnvOrder(a.environment) - getEnvOrder(b.environment) ||
            a.app_name.localeCompare(b.app_name) ||
            a.id - b.id
        )[0];
        const group: CertificateGroup = {
            certificate: certificatesById.get(certificateId)!,
            rows,
            rootRow,
            appCount: new Set(rows.map((row) => row.app_name)).size,
        };

        certificateGroups.push(group);
        rows.forEach((row) => rowMeta.set(row.id, {
            group,
            // A path route is still the root when no bare-origin row exists
            inherited: !group.certificate.is_platform_managed && isPathRoute(row.url) && row.id !== rootRow.id,
        }));
    });

    urls.forEach((url) => {
        if (!rowMeta.has(url.id)) {
            rowMeta.set(url.id, { group: null, inherited: false });
        }
    });

    return { certificateGroups, rowMeta };
};

/** The certificates staff renew, most urgent first */
export const getManagedCertificates = (certificateGroups: CertificateGroup[]) =>
    certificateGroups
        .filter((group) => !group.certificate.is_platform_managed)
        .sort((a, b) =>
            getStatusPriority(a.certificate.status) - getStatusPriority(b.certificate.status) ||
            getExpiryTime(a.certificate.expires_at) - getExpiryTime(b.certificate.expires_at) ||
            a.certificate.host.localeCompare(b.certificate.host)
        );

export type CertificateHealth =
    | { state: "issues"; expiring: number; attention: number }
    | { state: "valid"; count: number; next: SslCertificate }
    | { state: "unchecked"; count: number }
    | { state: "stale" }
    | { state: "none" };

/** The summary for the page's stat cards, counting only the certificates staff renew. */
export const summarizeCertificateHealth = (
    certificateGroups: CertificateGroup[],
    isStale: boolean,
): CertificateHealth => {
    const managed = certificateGroups
        .map((group) => group.certificate)
        .filter((certificate) => !certificate.is_platform_managed);
    const expiring = managed.filter((certificate) => certificate.status === "Expiring Soon").length;
    const attention = managed.filter((certificate) =>
        certificate.status === "Expired" || certificate.status === "Error"
    ).length;

    if (expiring || attention) return { state: "issues", expiring, attention };
    if (!managed.length) return { state: "none" };
    // "All valid" only when every certificate has been checked, and recently
    const unchecked = managed.filter((certificate) => certificate.status === "Unknown").length;
    if (unchecked) return { state: "unchecked", count: unchecked };
    if (isStale) return { state: "stale" };

    const next = [...managed].sort((a, b) => getExpiryTime(a.expires_at) - getExpiryTime(b.expires_at))[0];
    return { state: "valid", count: managed.length, next };
};

export const compareUrgency = (a: Urgency, b: Urgency): number => a.priority - b.priority || a.expiry - b.expiry;

/** The app's most urgent certificate, ignoring platform-renewed ones. */
export const getAppUrgency = (appUrls: ApplicationUrl[], rowMeta: Map<number, RowMeta>): Urgency =>
    appUrls.reduce<Urgency>((mostUrgent, url) => {
        const certificate = rowMeta.get(url.id)?.group?.certificate;
        if (!certificate || certificate.is_platform_managed) return mostUrgent;

        const urgency = {
            priority: getStatusPriority(certificate.status),
            expiry: getExpiryTime(certificate.expires_at),
        };
        return compareUrgency(urgency, mostUrgent) < 0 ? urgency : mostUrgent;
    }, { priority: getStatusPriority(null), expiry: FAR_FUTURE_TIMESTAMP });

/** Sorted by urgency or name; ties go by name. */
export const groupAndSortApps = (
    urls: ApplicationUrl[],
    rowMeta: Map<number, RowMeta>,
    sortBy: "expiry" | "name",
    sortOrder: "asc" | "desc",
) => {
    // A Map: an object would treat names like "constructor" as existing groups
    const urlsByApp = new Map<string, ApplicationUrl[]>();
    urls.forEach((url) => {
        const appUrls = urlsByApp.get(url.app_name);
        if (appUrls) {
            appUrls.push(url);
        } else {
            urlsByApp.set(url.app_name, [url]);
        }
    });

    const direction = sortOrder === "asc" ? 1 : -1;
    return [...urlsByApp]
        .map(([appName, appUrls]) => ({
            appName,
            appUrls: appUrls.sort(compareEnvironments),
            urgency: getAppUrgency(appUrls, rowMeta),
        }))
        .sort((a, b) => {
            const order = sortBy === "name"
                ? a.appName.localeCompare(b.appName)
                : compareUrgency(a.urgency, b.urgency);
            // Break ties by name, so the order doesn't depend on the API's
            return order * direction || a.appName.localeCompare(b.appName);
        });
};

const STALE_AFTER_HOURS = 48;

/** Why the check results may be out of date, or null if they're current. */
export const describeStaleness = (certificates: SslCertificate[], now = new Date()): string | null => {
    const checked = certificates
        .map((certificate) => Date.parse(certificate.last_checked ?? ""))
        .filter((time) => !Number.isNaN(time));
    if (!certificates.length) return null;
    if (!checked.length) {
        return "Certificates haven't been checked yet. They're checked once a day, and editors can check one now.";
    }
    const hours = (now.getTime() - Math.max(...checked)) / 3_600_000;
    if (hours <= STALE_AFTER_HOURS) return null;
    return `Certificates were last checked ${Math.floor(hours / 24)} days ago, so the daily check may have stopped. Expiry dates may be out of date.`;
};
