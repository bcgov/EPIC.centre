import { ApplicationUrl } from "@/models/ApplicationUrl";
import { getExpiryInfo, isPlatformManagedHost } from "./sslUtils";

/** The URLs on one origin, which share its certificate */
export type CertificateGroup = {
    key: string;
    host: string;
    rows: ApplicationUrl[];
    appCount: number;
    /** The row that stands for the certificate: the bare origin if there is one */
    rootRow: ApplicationUrl;
    /** The most urgent status in the group */
    status: string | null;
    isPlatformManaged: boolean;
};

export type RowMeta = {
    group: CertificateGroup;
    /** A path on a host whose certificate another row stands for */
    inherited: boolean;
};

export type Urgency = { priority: number; expiry: number };

const FAR_FUTURE_TIMESTAMP = Number.MAX_SAFE_INTEGER;
const ENV_ORDER: Record<string, number> = { PROD: 1, TEST: 2, DEV: 3 };

const parseUrlInfo = (value: string) => {
    try {
        const parsed = new URL(value);
        return {
            origin: parsed.origin,
            host: parsed.host,
            hostname: parsed.hostname,
            pathname: parsed.pathname || "/",
        };
    } catch {
        return null;
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
        case "Managed":
            return 3;
        default:
            return 4;
    }
};

export const getExpiryTime = (expiryDate: string | null): number =>
    getExpiryInfo(expiryDate)?.expiry.valueOf() ?? FAR_FUTURE_TIMESTAMP;

/** Group the URLs by origin, and work out each row's place in its group. */
export const buildCertificateIndex = (urls: ApplicationUrl[]) => {
    const rowsByOrigin = new Map<string, { host: string; hostname: string; rows: ApplicationUrl[] }>();
    const isPathRoute = new Map<number, boolean>();

    urls.forEach((url) => {
        const parsed = parseUrlInfo(url.url);
        isPathRoute.set(url.id, !!parsed && parsed.pathname !== "/");
        const key = parsed?.origin.toLowerCase() || url.url.toLowerCase();
        const entry = rowsByOrigin.get(key);
        if (entry) {
            entry.rows.push(url);
        } else {
            rowsByOrigin.set(key, { host: parsed?.host || url.url, hostname: parsed?.hostname || "", rows: [url] });
        }
    });

    const certificateGroups: CertificateGroup[] = [];
    const rowMeta = new Map<number, RowMeta>();

    rowsByOrigin.forEach(({ host, hostname, rows }, key) => {
        const rootRow = [...rows].sort((a, b) =>
            Number(isPathRoute.get(a.id)) - Number(isPathRoute.get(b.id)) ||
            getEnvOrder(a.environment) - getEnvOrder(b.environment) ||
            a.app_name.localeCompare(b.app_name) ||
            a.id - b.id
        )[0];
        const status = rows.reduce(
            (mostUrgent, row) => getStatusPriority(row.ssl_status) < getStatusPriority(mostUrgent) ? row.ssl_status : mostUrgent,
            rows[0].ssl_status,
        ) || null;
        const group: CertificateGroup = {
            key,
            host,
            rows,
            rootRow,
            status,
            appCount: new Set(rows.map((row) => row.app_name)).size,
            isPlatformManaged: isPlatformManagedHost(hostname),
        };

        certificateGroups.push(group);
        rows.forEach((row) => rowMeta.set(row.id, {
            group,
            // A path route is still the root when no bare-origin row exists
            inherited: !group.isPlatformManaged && !!isPathRoute.get(row.id) && row.id !== rootRow.id,
        }));
    });

    return { certificateGroups, rowMeta };
};

/** The certificates staff renew, most urgent first */
export const getManagedCertificates = (certificateGroups: CertificateGroup[]) =>
    certificateGroups
        .filter((group) => !group.isPlatformManaged && group.status !== "Managed")
        .sort((a, b) =>
            getStatusPriority(a.status) - getStatusPriority(b.status) ||
            getExpiryTime(a.rootRow.ssl_expiry) - getExpiryTime(b.rootRow.ssl_expiry) ||
            a.host.localeCompare(b.host)
        );

export const compareUrgency = (a: Urgency, b: Urgency): number => a.priority - b.priority || a.expiry - b.expiry;

/** The most urgent certificate behind an app's URLs, leaving out the ones the platform renews. */
export const getAppUrgency = (appUrls: ApplicationUrl[], rowMeta: Map<number, RowMeta>): Urgency =>
    appUrls.reduce<Urgency>((mostUrgent, url) => {
        const meta = rowMeta.get(url.id);
        if (!meta || meta.group.isPlatformManaged) return mostUrgent;

        const certificateRow = meta.inherited ? meta.group.rootRow : url;
        const urgency = {
            priority: getStatusPriority(certificateRow.ssl_status),
            expiry: getExpiryTime(certificateRow.ssl_expiry),
        };
        return compareUrgency(urgency, mostUrgent) < 0 ? urgency : mostUrgent;
    }, { priority: getStatusPriority(null), expiry: FAR_FUTURE_TIMESTAMP });

/** Group URLs by app, sorted by renewal urgency or name, ties broken by name. */
export const groupAndSortApps = (
    urls: ApplicationUrl[],
    rowMeta: Map<number, RowMeta>,
    sortBy: "expiry" | "name",
    sortOrder: "asc" | "desc",
) => {
    // A Map, as an object would mistake names like "constructor" for existing groups
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
