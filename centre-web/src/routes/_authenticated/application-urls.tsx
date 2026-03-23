import { PageLoader } from "@/components/PageLoader";
import { PageContainer } from "@/components/Shared/PageGrid";
import { useCurrentUser } from "@/contexts/UserContext";
import { useGetApplicationUrls } from "@/hooks/api/useApplicationUrls";
import { ApplicationUrl } from "@/models/ApplicationUrl";
import { Edit, Sort as SortIcon, ArrowUpward, ArrowDownward } from "@mui/icons-material";
import {
    Box,
    Button,
    IconButton,
    Paper,
    Typography,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Divider,
    TextField,
    InputAdornment,
    Chip,
    Tooltip,
    Stack,
    Tabs,
    Tab,
} from "@mui/material";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import dayjs from "dayjs";
import { EnvironmentChip } from "@/components/ApplicationUrls/EnvironmentChip";
import { ExpiryDisplay } from "@/components/ApplicationUrls/ExpiryDisplay";
import { CopyToClipboardButton } from "@/components/ApplicationUrls/CopyToClipboardButton";
import { SSLStatusChip } from "@/components/ApplicationUrls/SSLStatusChip";
import { AddUrlModal } from "@/components/ApplicationUrls/AddUrlModal";
import { EditUrlModal } from "@/components/ApplicationUrls/EditUrlModal";
import {
    Add,
    Search,
    Close,
    ConfirmationNumber,
    ShoppingCart,
    Event,
    Help,
    Apps,
    WarningAmber,
    ErrorOutline,
    TravelExplore,
    InfoOutlined,
    AccountTree,
    South,
    Info,
    VerifiedUser,
    Window,
    AccountBalance,
    AssignmentTurnedIn,
    RuleFolder,
    Gavel,
    FactCheck,
    Security,
} from "@mui/icons-material";

export const Route = createFileRoute("/_authenticated/application-urls")({
    component: ApplicationUrls,
});

type SortOption = 'expiry' | 'name';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'certificates' | 'applications';
type CertificateGroup = {
    key: string;
    origin: string;
    host: string;
    rows: ApplicationUrl[];
    appCount: number;
};

// Constants
const FAR_FUTURE_TIMESTAMP = Number.MAX_SAFE_INTEGER;
const ENV_ORDER: Record<string, number> = { PROD: 1, TEST: 2, DEV: 3 };

const parseUrlInfo = (value: string) => {
    try {
        const parsed = new URL(value);
        return {
            origin: parsed.origin,
            host: parsed.host,
            pathname: parsed.pathname || "/",
        };
    } catch {
        return null;
    }
};

const getCertificateGroupKey = (url: ApplicationUrl): string => {
    const parsed = parseUrlInfo(url.url);
    return parsed?.origin.toLowerCase() || url.url.toLowerCase();
};

const isPlatformManagedUrl = (url: ApplicationUrl): boolean => {
    const parsed = parseUrlInfo(url.url);
    return (parsed?.host || url.url).includes("devops.gov.bc.ca");
};

const isInheritedSslRoute = (url: ApplicationUrl): boolean => {
    const parsed = parseUrlInfo(url.url);
    if (!parsed) {
        return false;
    }

    return parsed.pathname !== "/" && parsed.pathname !== "";
};

const getCertificateGroupDisplay = (group: CertificateGroup): string => group.host || group.origin;

const getCertificateGroupRootRow = (group: CertificateGroup): ApplicationUrl => {
    return [...group.rows].sort((a, b) => {
        const aInherited = isInheritedSslRoute(a) ? 1 : 0;
        const bInherited = isInheritedSslRoute(b) ? 1 : 0;

        if (aInherited !== bInherited) {
            return aInherited - bInherited;
        }

        const aEnv = ENV_ORDER[a.environment] || 99;
        const bEnv = ENV_ORDER[b.environment] || 99;
        if (aEnv !== bEnv) {
            return aEnv - bEnv;
        }

        return a.app_name.localeCompare(b.app_name);
    })[0];
};

const getExpirySummaryLabel = (expiryDate: string | null): string => {
    if (!expiryDate) {
        return "Expiry on root host";
    }

    const expiry = dayjs(expiryDate);
    if (!expiry.isValid()) {
        return "Expiry on root host";
    }

    const now = dayjs();
    const daysUntilExpiry = expiry.diff(now, "day");

    if (daysUntilExpiry < 0) {
        return "Expired on root host";
    }

    if (daysUntilExpiry === 0) {
        return "Expires today on root host";
    }

    if (daysUntilExpiry <= 30) {
        return `In ${daysUntilExpiry} day${daysUntilExpiry === 1 ? "" : "s"} on root host`;
    }

    const monthsUntilExpiry = Math.round(daysUntilExpiry / 30);
    return `In ~${monthsUntilExpiry} month${monthsUntilExpiry === 1 ? "" : "s"} on root host`;
};

const getStatusPriority = (status: string | null): number => {
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

const getCertificateGroupStatus = (group: CertificateGroup): string | null => {
    return [...group.rows]
        .sort((a, b) => getStatusPriority(a.ssl_status) - getStatusPriority(b.ssl_status))[0]?.ssl_status || null;
};

const buildCertificateGroupTooltip = (group: CertificateGroup, inherited: boolean) => (
    <Box sx={{ maxWidth: 320 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {getCertificateGroupDisplay(group)}
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
            {inherited
                ? "This route inherits SSL from the shared host certificate below."
                : "This host certificate is shared across the linked application routes below."}
        </Typography>
        <Box sx={{ mt: 1 }}>
            {group.rows.slice(0, 6).map((linkedUrl) => (
                <Typography key={linkedUrl.id} variant="caption" sx={{ display: 'block' }}>
                    {linkedUrl.app_name} · {linkedUrl.environment} · {linkedUrl.url}
                </Typography>
            ))}
            {group.rows.length > 6 && (
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                    +{group.rows.length - 6} more linked route(s)
                </Typography>
            )}
        </Box>
    </Box>
);

const getAppIcon = (appName: string) => {
    const normalized = appName.toLowerCase();

    if (normalized.includes("condition")) {
        return RuleFolder;
    }
    if (normalized.includes("submit")) {
        return AssignmentTurnedIn;
    }
    if (normalized.includes("eagle")) {
        return AccountBalance;
    }
    if (normalized.includes("compliance")) {
        return FactCheck;
    }
    if (normalized.includes("auth")) {
        return Security;
    }
    if (normalized.includes("centre")) {
        return Gavel;
    }

    return Window;
};

const sharedTooltipSlotProps = {
    tooltip: {
        sx: {
            bgcolor: "common.white",
            color: "text.primary",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: 3,
            maxWidth: 360,
            p: 1.5,
        },
    },
};

// Helper functions
const getMinExpiry = (urls: ApplicationUrl[]): number => {
    const timestamps = urls
        .filter(u => u.ssl_expiry)
        .map(u => new Date(u.ssl_expiry!).getTime());
    return timestamps.length > 0 ? Math.min(...timestamps) : FAR_FUTURE_TIMESTAMP;
};

const sortByName = (nameA: string, nameB: string, order: SortOrder): number => {
    return order === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
};

const sortByExpiry = (urlsA: ApplicationUrl[], urlsB: ApplicationUrl[], order: SortOrder): number => {
    const minExpiryA = getMinExpiry(urlsA);
    const minExpiryB = getMinExpiry(urlsB);
    return order === 'asc' ? minExpiryA - minExpiryB : minExpiryB - minExpiryA;
};

function ApplicationUrls() {
    const { canViewApplicationUrls, canManageApplicationUrls } = useCurrentUser();
    const { data: urls = [], isPending } = useGetApplicationUrls(canViewApplicationUrls);
    const [editingUrl, setEditingUrl] = useState<ApplicationUrl | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addModalAppName, setAddModalAppName] = useState("");
    const [viewMode, setViewMode] = useState<ViewMode>('applications');

    // Filtering State
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedEnvs, setSelectedEnvs] = useState<Record<string, boolean>>({
        PROD: true,
        TEST: true,
        DEV: true
    });

    // Sorting State
    const [sortBy, setSortBy] = useState<SortOption>('expiry');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);

    const allEnvironments = useMemo(() => {
        return [...new Set(urls.map((url) => url.environment))].sort((a, b) => {
            const orderA = ENV_ORDER[a] || 99;
            const orderB = ENV_ORDER[b] || 99;

            if (orderA !== orderB) {
                return orderA - orderB;
            }

            return a.localeCompare(b);
        });
    }, [urls]);

    const certificateGroups = useMemo(() => {
        const groups = new Map<string, CertificateGroup>();

        urls.forEach((url) => {
            const parsed = parseUrlInfo(url.url);
            const key = getCertificateGroupKey(url);
            const existing = groups.get(key);

            if (existing) {
                existing.rows.push(url);
                existing.appCount = new Set(existing.rows.map((row) => row.app_name)).size;
                return;
            }

            groups.set(key, {
                key,
                origin: parsed?.origin || url.url,
                host: parsed?.host || url.url,
                rows: [url],
                appCount: 1,
            });
        });

        return groups;
    }, [urls]);

    const handleEdit = (url: ApplicationUrl) => {
        setEditingUrl(url);
    };

    const handleClose = () => {
        setEditingUrl(null);
    };

    const handleSortClick = (event: React.MouseEvent<HTMLElement>) => {
        setSortAnchorEl(event.currentTarget);
    };

    const handleSortClose = () => {
        setSortAnchorEl(null);
    };

    const handleSortChange = (option: SortOption) => {
        if (sortBy === option) {
            // Toggle order if clicking same option
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(option);
            setSortOrder('asc'); // Default to asc for new option
        }
        handleSortClose();
    };

    const handleOrderChange = (order: SortOrder) => {
        setSortOrder(order);
        handleSortClose();
    };

    const handleEnvToggle = (env: string) => {
        setSelectedEnvs(prev => ({
            ...prev,
            [env]: !prev[env]
        }));
    };

    const handleJumpToApplicationView = (rootRowId: number) => {
        setViewMode('applications');
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                const target = document.getElementById(`ssl-root-row-${rootRowId}`);
                target?.scrollIntoView({ behavior: "smooth", block: "center" });
            });
        });
    };

    const stats = useMemo(() => {
        const appCount = new Set(urls.map((url) => url.app_name)).size;
        const groups = [...certificateGroups.values()];
        const expiringCount = groups.filter((group) => getCertificateGroupStatus(group) === "Expiring Soon").length;
        const errorCount = groups.filter((group) => {
            const status = getCertificateGroupStatus(group);
            return status === "Error" || status === "Expired";
        }).length;
        const managedCount = urls.filter((url) => isPlatformManagedUrl(url) || url.ssl_status === "Managed").length;

        return { appCount, expiringCount, errorCount, managedCount };
    }, [certificateGroups, urls]);

    const rootCertificateRows = useMemo(() => {
        return [...certificateGroups.values()]
            .map((group) => ({
                group,
                rootRow: getCertificateGroupRootRow(group),
                status: getCertificateGroupStatus(group),
            }))
            .filter(({ rootRow, status }) => !isInheritedSslRoute(rootRow) && status !== "Managed")
            .sort((a, b) => {
                const statusCompare = getStatusPriority(a.status) - getStatusPriority(b.status);
                if (statusCompare !== 0) {
                    return statusCompare;
                }

                const expiryA = a.rootRow.ssl_expiry ? new Date(a.rootRow.ssl_expiry).getTime() : FAR_FUTURE_TIMESTAMP;
                const expiryB = b.rootRow.ssl_expiry ? new Date(b.rootRow.ssl_expiry).getTime() : FAR_FUTURE_TIMESTAMP;
                return expiryA - expiryB;
            });
    }, [certificateGroups]);

    // Grouping and Filtering Logic
    const groupedApps = useMemo(() => {
        const groups: Record<string, ApplicationUrl[]> = {};

        // Filter URLs first
        const filteredUrls = urls.filter(url => {
            // 1. Filter by environment
            if (!selectedEnvs[url.environment] && selectedEnvs[url.environment] !== undefined) {
                return false;
            }

            // 2. Filter by search term
            if (searchTerm && !url.app_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                !url.url.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }

            return true;
        });

        // Group filtered URLs
        filteredUrls.forEach((url) => {
            if (!groups[url.app_name]) {
                groups[url.app_name] = [];
            }
            groups[url.app_name].push(url);
        });

        // Sort Environments WITHIN groups (PROD -> TEST -> DEV)
        Object.keys(groups).forEach(app => {
            groups[app].sort((a, b) => {
                const orderA = ENV_ORDER[a.environment] || 99;
                const orderB = ENV_ORDER[b.environment] || 99;
                return orderA - orderB;
            });
        });

        return groups;
    }, [urls, searchTerm, selectedEnvs]);

    // Sorting comparator for app groups
    const sortGroups = useMemo(() => {
        return (a: [string, ApplicationUrl[]], b: [string, ApplicationUrl[]]) => {
            const [nameA, urlsA] = a;
            const [nameB, urlsB] = b;

            if (sortBy === 'name') {
                return sortByName(nameA, nameB, sortOrder);
            }

            return sortByExpiry(urlsA, urlsB, sortOrder);
        };
    }, [sortBy, sortOrder]);

    if (!canViewApplicationUrls) {
        return <Navigate to="/access-denied" />;
    }

    if (isPending) {
        return <PageLoader />;
    }

    return (
        <PageContainer>
            <Paper
                variant="outlined"
                sx={{
                    mb: 3,
                    p: 3,
                    borderRadius: 4,
                    background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
                    borderColor: "rgba(15,23,42,0.06)",
                    boxShadow: "0 1px 3px rgba(15,23,42,0.02)",
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', md: 'center' },
                        gap: 2,
                        flexWrap: 'wrap',
                    }}
                >
                    <Box>
                        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 800 }}>
                            Application URLs & SSL
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 760 }}>
                            Find application URLs quickly, see renewal urgency at a glance, and maintain environments as new apps or extra deployments are added.
                        </Typography>
                    </Box>
                    {canManageApplicationUrls && (
                        <Button
                            variant="contained"
                            startIcon={<Apps />}
                            onClick={() => {
                                setAddModalAppName("");
                                setIsAddModalOpen(true);
                            }}
                            sx={{
                                px: 2.5,
                                py: 1.1,
                                borderRadius: 2,
                                fontWeight: 700,
                                boxShadow: 'none',
                            }}
                        >
                            Add Application
                        </Button>
                    )}
                </Box>

                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mt: 2.5 }}>
                    <Paper 
                        variant="outlined" 
                        sx={{ 
                            px: 2, py: 1.5, borderRadius: 3, minWidth: 170, 
                            bgcolor: '#eff6ff', borderColor: '#bfdbfe',
                            transition: 'all 0.2s ease',
                            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(29, 78, 216, 0.08)' }
                        }}
                    >
                        <Box display="flex" alignItems="center" gap={1}>
                            <Apps sx={{ fontSize: 20, color: '#1d4ed8' }} />
                            <Typography variant="body2" sx={{ color: '#1e3a8a', fontWeight: 600 }}>Applications</Typography>
                            <Tooltip title="Total unique applications listed below. Each application section groups its environments together, even when SSL is shared with other apps on the same host.">
                                <InfoOutlined sx={{ fontSize: 16, color: '#3b82f6' }} />
                            </Tooltip>
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: '#1e3a8a' }}>{stats.appCount}</Typography>
                    </Paper>
                    <Paper 
                        variant="outlined" 
                        sx={{ 
                            px: 2, py: 1.5, borderRadius: 3, minWidth: 170,
                            bgcolor: '#fff7ed', borderColor: '#fed7aa',
                            transition: 'all 0.2s ease',
                            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(194, 65, 12, 0.08)' }
                        }}
                    >
                        <Box display="flex" alignItems="center" gap={1}>
                            <WarningAmber sx={{ fontSize: 20, color: '#c2410c' }} />
                            <Typography variant="body2" sx={{ color: '#7c2d12', fontWeight: 600 }}>Expiring Soon</Typography>
                            <Tooltip title="Certificate groups expiring within 30 days. Shared host certificates are counted once, even if several application routes use them.">
                                <InfoOutlined sx={{ fontSize: 16, color: '#f97316' }} />
                            </Tooltip>
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: '#7c2d12' }}>{stats.expiringCount}</Typography>
                    </Paper>
                    <Paper 
                        variant="outlined" 
                        sx={{ 
                            px: 2, py: 1.5, borderRadius: 3, minWidth: 170,
                            bgcolor: '#fef2f2', borderColor: '#fecaca',
                            transition: 'all 0.2s ease',
                            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(185, 28, 28, 0.08)' }
                        }}
                    >
                        <Box display="flex" alignItems="center" gap={1}>
                            <ErrorOutline sx={{ fontSize: 20, color: '#b91c1c' }} />
                            <Typography variant="body2" sx={{ color: '#7f1d1d', fontWeight: 600 }}>Needs Attention</Typography>
                            <Tooltip title="Certificate groups that are expired or returned an SSL error. Shared host certificates are counted once to avoid duplicate renewal noise.">
                                <InfoOutlined sx={{ fontSize: 16, color: '#ef4444' }} />
                            </Tooltip>
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: '#7f1d1d' }}>{stats.errorCount}</Typography>
                    </Paper>
                    <Paper 
                        variant="outlined" 
                        sx={{ 
                            px: 2, py: 1.5, borderRadius: 3, minWidth: 170,
                            bgcolor: '#f8fafc', borderColor: '#e2e8f0',
                            transition: 'all 0.2s ease',
                            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(71, 85, 105, 0.08)' }
                        }}
                    >
                        <Box display="flex" alignItems="center" gap={1}>
                            <TravelExplore sx={{ fontSize: 20, color: '#475569' }} />
                            <Typography variant="body2" sx={{ color: '#0f172a', fontWeight: 600 }}>Platform Managed</Typography>
                            <Tooltip title="Platform-managed certificate groups, typically on devops.gov.bc.ca. These are tracked for visibility but not usually renewed by staff here.">
                                <InfoOutlined sx={{ fontSize: 16, color: '#64748b' }} />
                            </Tooltip>
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: '#0f172a' }}>{stats.managedCount}</Typography>
                    </Paper>
                </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ mb: 3, borderRadius: 4, overflow: "hidden", borderColor: "rgba(15,23,42,0.06)", boxShadow: "0 4px 20px -5px rgba(15,23,42,0.02)" }}>
                <Tabs
                    value={viewMode}
                    onChange={(_, value: ViewMode) => setViewMode(value)}
                    sx={{
                        px: 2,
                        pt: 1,
                        borderBottom: 1,
                        borderColor: "divider",
                        bgcolor: "background.paper",
                    }}
                >
                    <Tab
                        value="applications"
                        icon={<Apps fontSize="small" />}
                        iconPosition="start"
                        label={`Applications & Routes (${urls.length})`}
                        sx={{ textTransform: "none", fontWeight: 700 }}
                    />
                    <Tab
                        value="certificates"
                        icon={<VerifiedUser fontSize="small" />}
                        iconPosition="start"
                        label={`Certificates We Track (${rootCertificateRows.length})`}
                        sx={{ textTransform: "none", fontWeight: 700 }}
                    />
                </Tabs>

                <Box
                    sx={{
                        px: 2.5,
                        py: 1.25,
                        borderBottom: 1,
                        borderColor: "divider",
                        bgcolor: "rgba(15,23,42,0.025)",
                    }}
                >
                    <Typography variant="body2" color="text.secondary">
                        {viewMode === "applications"
                            ? "Use this tab to find application URLs quickly and manage environments. Shared SSL relationships are still shown where relevant."
                            : "Use this tab to review the certificate-owning root hosts staff are responsible for tracking."}
                    </Typography>
                </Box>

                {viewMode === 'certificates' ? (
                    <Box sx={{ p: 2.5 }}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                Certificates We Track
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Root certificate hosts staff may need to track. Platform-managed hosts and inherited child routes are excluded here.
                            </Typography>
                        </Box>

                        {rootCertificateRows.length === 0 ? (
                            <Paper variant="outlined" sx={{ p: 4, borderRadius: 2.5, textAlign: "center" }}>
                                <Typography variant="h6" color="text.secondary" gutterBottom>
                                    No root certificates need tracking right now
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    This view shows only certificate-owning root hosts that staff may need to renew.
                                </Typography>
                            </Paper>
                        ) : (
                            <Stack spacing={1.25}>
                                {rootCertificateRows.map(({ group, rootRow, status }) => (
                                    <Paper
                                        key={`root-overview-${group.key}`}
                                        variant="outlined"
                                        sx={{
                                            p: 2,
                                            borderRadius: 3,
                                            bgcolor: "#ffffff",
                                            borderColor: "rgba(15,23,42,0.06)",
                                            boxShadow: "0 1px 4px -1px rgba(15,23,42,0.04)",
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                transform: 'translateY(-1px)',
                                                boxShadow: "0 4px 12px -2px rgba(15,23,42,0.06)",
                                                borderColor: "rgba(15,23,42,0.12)",
                                            }
                                        }}
                                    >
                                        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, alignItems: { xs: "flex-start", md: "center" }, flexWrap: "wrap" }}>
                                            <Box sx={{ minWidth: 0 }}>
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                                                        {getCertificateGroupDisplay(group)}
                                                    </Typography>
                                                    {group.rows.length > 1 && (
                                                        <Tooltip title={buildCertificateGroupTooltip(group, false)} slotProps={sharedTooltipSlotProps}>
                                                            <IconButton
                                                                size="small"
                                                                sx={{
                                                                    width: 24,
                                                                    height: 24,
                                                                    border: '1px solid',
                                                                    borderColor: 'divider',
                                                                }}
                                                            >
                                                                <Info sx={{ fontSize: 16 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    Covers {group.appCount} app{group.appCount === 1 ? "" : "s"} across {group.rows.length} route{group.rows.length === 1 ? "" : "s"}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                                                <SSLStatusChip status={status} />
                                                <ExpiryDisplay expiryDate={rootRow.ssl_expiry} url={rootRow.url} />
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={() => handleJumpToApplicationView(rootRow.id)}
                                                    sx={{ textTransform: "none", borderRadius: 5, fontWeight: 700, borderColor: 'rgba(15,23,42,0.12)', color: '#475569', '&:hover': { bgcolor: 'rgba(15,23,42,0.04)', borderColor: 'rgba(15,23,42,0.2)' } }}
                                                >
                                                    View Routes
                                                </Button>
                                            </Box>
                                        </Box>
                                    </Paper>
                                ))}
                            </Stack>
                        )}
                    </Box>
                ) : (
                    <>
                        <Box
                            sx={{
                                p: 2,
                                display: 'flex',
                                gap: 2,
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                borderBottom: 1,
                                borderColor: "divider",
                            }}
                        >
                            <Box sx={{ minWidth: 220 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                    Applications & Routes
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    Full URL inventory, environment management, and shared SSL context.
                                </Typography>
                            </Box>
                            <TextField
                                size="small"
                                placeholder="Search applications or URLs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
                                    endAdornment: searchTerm ? (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={() => setSearchTerm("")}>
                                                <Close fontSize="small" />
                                            </IconButton>
                                        </InputAdornment>
                                    ) : null
                                }}
                                sx={{ minWidth: 300, flexGrow: 1 }}
                            />

                            <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                                <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ mr: 0.5 }}>
                                    Environments:
                                </Typography>
                                {allEnvironments.map((env) => {
                                    const selected = selectedEnvs[env] !== false;
                                    return (
                                        <Chip
                                            key={env}
                                            label={env}
                                            onClick={() => handleEnvToggle(env)}
                                            color={selected ? "primary" : "default"}
                                            variant={selected ? "filled" : "outlined"}
                                            sx={{
                                                fontWeight: 700,
                                                borderRadius: '8px',
                                                border: selected ? 'none' : '1px solid',
                                                borderColor: selected ? 'transparent' : 'rgba(15,23,42,0.12)',
                                                bgcolor: selected ? 'primary.main' : 'transparent',
                                                color: selected ? 'primary.contrastText' : 'text.secondary',
                                                '&:hover': {
                                                    bgcolor: selected ? 'primary.dark' : 'rgba(15,23,42,0.04)',
                                                }
                                            }}
                                        />
                                    );
                                })}
                            </Box>

                            <Button
                                variant="outlined"
                                color="inherit"
                                startIcon={<SortIcon />}
                                onClick={handleSortClick}
                                sx={{ color: 'text.secondary', borderRadius: 5 }}
                            >
                                Sort By: {sortBy === 'expiry' ? 'Urgency' : 'Name'}
                            </Button>
                        </Box>

                        {Object.keys(groupedApps).length === 0 ? (
                            <Box sx={{ py: 8, textAlign: "center" }}>
                                <Typography variant="h6" color="text.secondary" gutterBottom>
                                    {searchTerm || Object.values(selectedEnvs).some(v => !v)
                                        ? "No application URLs match your filters"
                                        : "No application URLs configured"}
                                </Typography>
                                {canManageApplicationUrls && !searchTerm && Object.values(selectedEnvs).every(v => v) && (
                                    <Button
                                        variant="outlined"
                                        startIcon={<Add />}
                                        onClick={() => setIsAddModalOpen(true)}
                                        sx={{ mt: 2 }}
                                    >
                                        Add Your First Application
                                    </Button>
                                )}
                            </Box>
                        ) : (
                            <Stack spacing={2} sx={{ p: 2 }}>
                                {Object.entries(groupedApps).sort(sortGroups).map(([appName, appUrls]) => (
                                    (() => {
                                        const AppIcon = getAppIcon(appName);
                                        return (
                                    <Paper
                                        key={`group-${appName}`}
                                        variant="outlined"
                                        sx={{
                                            borderRadius: 3,
                                            overflow: "hidden",
                                            background: "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(248,250,252,0.6) 100%)",
                                            borderColor: "rgba(15,23,42,0.06)",
                                            boxShadow: "0 2px 8px -2px rgba(15,23,42,0.02)",
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                boxShadow: "0 4px 16px -4px rgba(15,23,42,0.06)",
                                            }
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                px: 2,
                                                py: 1.5,
                                                borderBottom: "1px solid",
                                                borderColor: "rgba(15,23,42,0.04)",
                                                background: "linear-gradient(90deg, rgba(241,245,249,0.5) 0%, rgba(255,255,255,0) 100%)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                gap: 2,
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            <Box display="flex" alignItems="center" gap={1.25}>
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 1.25,
                                                        minWidth: 0,
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            width: 36,
                                                            height: 36,
                                                            borderRadius: '10px',
                                                            display: "grid",
                                                            placeItems: "center",
                                                            background: "linear-gradient(135deg, rgba(29,78,216,0.1) 0%, rgba(29,78,216,0.02) 100%)",
                                                            border: "1px solid",
                                                            borderColor: "rgba(29,78,216,0.15)",
                                                            color: "#1d4ed8",
                                                            flexShrink: 0,
                                                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
                                                        }}
                                                    >
                                                        <AppIcon sx={{ fontSize: 18 }} />
                                                    </Box>
                                                    <Box sx={{ minWidth: 0 }}>
                                                        <Typography
                                                            variant="subtitle2"
                                                            sx={{
                                                                fontWeight: 800,
                                                                fontSize: "0.98rem",
                                                                lineHeight: 1.15,
                                                                color: "text.primary",
                                                                whiteSpace: "nowrap",
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis",
                                                            }}
                                                        >
                                                            {appName}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Chip
                                                    label={`${appUrls.length} env${appUrls.length > 1 ? "s" : ""}`}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ height: 22 }}
                                                />
                                            </Box>
                                            {canManageApplicationUrls && (
                                                <Button
                                                    startIcon={<Add />}
                                                    size="small"
                                                    variant="outlined"
                                                    color="primary"
                                                    sx={{
                                                        fontSize: '0.8rem',
                                                        textTransform: 'none',
                                                        borderRadius: 5,
                                                        fontWeight: 700,
                                                        boxShadow: 'none',
                                                    }}
                                                    onClick={() => {
                                                        setAddModalAppName(appName);
                                                        setIsAddModalOpen(true);
                                                    }}
                                                >
                                                    Add New Environment
                                                </Button>
                                            )}
                                        </Box>

                                        <Box sx={{ p: 2 }}>
                                            <Stack spacing={1.5}>
                                                {appUrls.map((url) => (
                                                    <Paper
                                                        key={url.id}
                                                        id={
                                                            (() => {
                                                                const certificateGroup = certificateGroups.get(getCertificateGroupKey(url));
                                                                const rootRow = certificateGroup ? getCertificateGroupRootRow(certificateGroup) : url;
                                                                return rootRow.id === url.id ? `ssl-root-row-${url.id}` : undefined;
                                                            })()
                                                        }
                                                        variant="outlined"
                                                        sx={{
                                                            p: 1.5,
                                                            borderRadius: 2.5,
                                                            borderColor: "rgba(15,23,42,0.06)",
                                                            bgcolor: "#ffffff",
                                                            boxShadow: "0 1px 4px -1px rgba(15,23,42,0.04)",
                                                            transition: 'all 0.2s ease',
                                                            '&:hover': {
                                                                transform: 'translateY(-1px)',
                                                                boxShadow: "0 4px 12px -2px rgba(15,23,42,0.06)",
                                                                borderColor: "rgba(15,23,42,0.12)",
                                                            }
                                                        }}
                                                    >
                                                        <Box
                                                            sx={{
                                                                display: "grid",
                                                                gridTemplateColumns: { xs: "1fr", lg: canManageApplicationUrls ? "minmax(0, 1.4fr) minmax(280px, 0.9fr) auto" : "minmax(0, 1.4fr) minmax(280px, 0.9fr)" },
                                                                gap: 2.5,
                                                                alignItems: "start",
                                                            }}
                                                        >
                                                            <Box>
                                                                {(() => {
                                                                    const certificateGroup = certificateGroups.get(getCertificateGroupKey(url));
                                                                    const isPlatformManaged = isPlatformManagedUrl(url);
                                                                    const inherited = !isPlatformManaged && isInheritedSslRoute(url);
                                                                    const sharedRouteCount = certificateGroup?.rows.length || 1;
                                                                    const sharedAppCount = certificateGroup?.appCount || 1;
                                                                    const fallbackGroup = {
                                                                        key: url.url,
                                                                        origin: url.url,
                                                                        host: url.url,
                                                                        rows: [url],
                                                                        appCount: 1,
                                                                    };
                                                                    const resolvedGroup = certificateGroup || fallbackGroup;
                                                                    const tooltipTitle = buildCertificateGroupTooltip(resolvedGroup, inherited);

                                                                    return (
                                                                        <Box display="flex" flexDirection="column" gap={1}>
                                                                            <Box display="flex" alignItems="center" gap={1.25} flexWrap="wrap">
                                                                                <EnvironmentChip environment={url.environment} />
                                                                                <Typography
                                                                                    variant="body2"
                                                                                    component="a"
                                                                                    href={url.url}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    sx={{
                                                                                        color: '#0369a1',
                                                                                        textDecoration: 'none',
                                                                                        fontWeight: 700,
                                                                                        wordBreak: 'break-all',
                                                                                        transition: 'color 0.2s',
                                                                                        '&:hover': { color: '#0284c7', textDecoration: 'underline' }
                                                                                    }}
                                                                                    title={url.url}
                                                                                >
                                                                                    {url.url}
                                                                                </Typography>
                                                                                <CopyToClipboardButton text={url.url} />
                                                                            </Box>
                                                                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                                                {sharedRouteCount > 1 && !inherited && !isPlatformManaged && (
                                                                                    <>
                                                                                        <Chip
                                                                                            size="small"
                                                                                            variant="outlined"
                                                                                            color="default"
                                                                                            icon={<AccountTree fontSize="small" />}
                                                                                            label={`Root host for ${sharedRouteCount} route${sharedRouteCount > 1 ? "s" : ""}`}
                                                                                            sx={{ height: 24, fontSize: '0.75rem' }}
                                                                                        />
                                                                                        <Tooltip title={tooltipTitle} slotProps={sharedTooltipSlotProps}>
                                                                                            <IconButton
                                                                                                size="small"
                                                                                                sx={{
                                                                                                    width: 24,
                                                                                                    height: 24,
                                                                                                    border: '1px solid',
                                                                                                    borderColor: 'divider',
                                                                                                }}
                                                                                            >
                                                                                                <Info sx={{ fontSize: 16 }} />
                                                                                            </IconButton>
                                                                                        </Tooltip>
                                                                                    </>
                                                                                )}
                                                                                {sharedAppCount > 1 && !isPlatformManaged && (
                                                                                    <Tooltip title={tooltipTitle} slotProps={sharedTooltipSlotProps}>
                                                                                        <Chip
                                                                                            size="small"
                                                                                            variant="outlined"
                                                                                            label={`Shared across ${sharedAppCount} apps`}
                                                                                            sx={{ height: 24, fontSize: '0.75rem' }}
                                                                                        />
                                                                                    </Tooltip>
                                                                                )}
                                                                            </Stack>
                                                                        </Box>
                                                                    );
                                                                })()}
                                                            </Box>

                                                            <Box>
                                                                {(() => {
                                                                    const certificateGroup = certificateGroups.get(getCertificateGroupKey(url));
                                                                    const isPlatformManaged = isPlatformManagedUrl(url);
                                                                    const inherited = !isPlatformManaged && isInheritedSslRoute(url);
                                                                    const rootRow = certificateGroup ? getCertificateGroupRootRow(certificateGroup) : url;
                                                                    const rootLabel = certificateGroup ? getCertificateGroupDisplay(certificateGroup) : url.url;

                                                                    const scrollToRoot = () => {
                                                                        const rootElement = document.getElementById(`ssl-root-row-${rootRow.id}`);
                                                                        rootElement?.scrollIntoView({ behavior: "smooth", block: "center" });
                                                                    };

                                                                    return (
                                                                        <Box display="flex" flexDirection="column" gap={0.75}>
                                                                            {inherited ? (
                                                                                <Box display="flex" flexDirection="column" gap={0.75}>
                                                                                    <Button
                                                                                        variant="text"
                                                                                        size="small"
                                                                                        color="info"
                                                                                        startIcon={<South fontSize="small" />}
                                                                                        onClick={scrollToRoot}
                                                                                        sx={{
                                                                                            justifyContent: "flex-start",
                                                                                            px: 0,
                                                                                            minWidth: 0,
                                                                                            textTransform: "none",
                                                                                            fontWeight: 700,
                                                                                            alignSelf: "flex-start",
                                                                                        }}
                                                                                    >
                                                                                        SSL inherited from {rootLabel}
                                                                                    </Button>
                                                                                    <Typography variant="caption" color="text.secondary">
                                                                                        {getExpirySummaryLabel(rootRow.ssl_expiry)}. Refer to root host for renewal tracking.
                                                                                    </Typography>
                                                                                </Box>
                                                                            ) : isPlatformManaged ? (
                                                                                <Chip
                                                                                    size="small"
                                                                                    label="Platform managed"
                                                                                    variant="outlined"
                                                                                    color="default"
                                                                                    sx={{ alignSelf: "flex-start" }}
                                                                                />
                                                                            ) : (
                                                                                <ExpiryDisplay expiryDate={url.ssl_expiry} url={url.url} />
                                                                            )}
                                                                            <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                                                                                {isPlatformManaged ? null : (
                                                                                    <SSLStatusChip status={inherited ? `${url.ssl_status || "Unknown"} (Inherited)` : url.ssl_status} />
                                                                                )}
                                                                                {!inherited && certificateGroup && certificateGroup.rows.length > 1 && !isPlatformManaged && (
                                                                                    <Chip
                                                                                        size="small"
                                                                                        variant="outlined"
                                                                                        label={`Covers ${certificateGroup.rows.length} route${certificateGroup.rows.length > 1 ? "s" : ""}`}
                                                                                        sx={{ height: 24, fontSize: '0.75rem' }}
                                                                                    />
                                                                                )}
                                                                                {(() => {
                                                                                    const hasStatus = url.renewal_status && url.renewal_status !== 'NONE';
                                                                                    const hasTicket = !!url.ticket_reference;
                                                                                    const hasComments = !!url.renewal_comments;

                                                                                    if (!hasStatus && !hasTicket && !hasComments) return null;

                                                                                    let icon = <ConfirmationNumber fontSize="small" />;
                                                                                    let color: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" = "info";
                                                                                    let label = "Ticket";

                                                                                    if (hasStatus) {
                                                                                        switch (url.renewal_status) {
                                                                                            case 'ORDERED':
                                                                                                icon = <ShoppingCart fontSize="small" />;
                                                                                                color = "warning";
                                                                                                label = "Ordered";
                                                                                                break;
                                                                                            case 'PLANNED':
                                                                                                icon = <Event fontSize="small" />;
                                                                                                color = "success";
                                                                                                label = "Planned";
                                                                                                break;
                                                                                            case 'TICKET_CREATED':
                                                                                            default:
                                                                                                icon = <ConfirmationNumber fontSize="small" />;
                                                                                                color = "info";
                                                                                                label = "Ticket";
                                                                                                break;
                                                                                        }
                                                                                    } else if (hasComments) {
                                                                                        icon = <Help fontSize="small" />;
                                                                                        color = "default";
                                                                                        label = "Note";
                                                                                    }

                                                                                    if (hasTicket) {
                                                                                        label = `${label}: ${url.ticket_reference}`;
                                                                                    }

                                                                                    return (
                                                                                        <Tooltip title={url.renewal_comments || "No comments"}>
                                                                                            <Chip
                                                                                                icon={icon}
                                                                                                label={label}
                                                                                                size="small"
                                                                                                variant="outlined"
                                                                                                color={color}
                                                                                                sx={{ height: 24, fontSize: '0.75rem' }}
                                                                                            />
                                                                                        </Tooltip>
                                                                                    );
                                                                                })()}
                                                                            </Box>
                                                                        </Box>
                                                                    );
                                                                })()}
                                                            </Box>

                                                            {canManageApplicationUrls && (
                                                                <Box sx={{ display: "flex", justifyContent: { xs: "flex-start", lg: "flex-end" } }}>
                                                                    <Tooltip title="Edit environment details">
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={() => handleEdit(url)}
                                                                            sx={{
                                                                                border: '1px solid',
                                                                                borderColor: 'divider',
                                                                                borderRadius: 2,
                                                                            }}
                                                                        >
                                                                            <Edit fontSize="small" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                </Box>
                                                            )}
                                                        </Box>
                                                    </Paper>
                                                ))}
                                            </Stack>
                                        </Box>
                                    </Paper>
                                        );
                                    })()
                                ))}
                            </Stack>
                        )}
                    </>
                )}
            </Paper>

            {canManageApplicationUrls && editingUrl && (
                <EditUrlModal open={!!editingUrl} onClose={handleClose} url={editingUrl} />
            )}

            {canManageApplicationUrls && (
                <AddUrlModal
                    open={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    initialAppName={addModalAppName}
                />
            )}

            <Menu
                anchorEl={sortAnchorEl}
                open={Boolean(sortAnchorEl)}
                onClose={handleSortClose}
            >
                <MenuItem onClick={() => handleSortChange('expiry')} selected={sortBy === 'expiry'}>
                    <ListItemText>Sort by Urgency (Expiry)</ListItemText>
                    {sortBy === 'expiry' && (sortOrder === 'asc' ? <ArrowUpward fontSize="small" sx={{ ml: 1, color: 'text.secondary' }} /> : <ArrowDownward fontSize="small" sx={{ ml: 1, color: 'text.secondary' }} />)}
                </MenuItem>
                <MenuItem onClick={() => handleSortChange('name')} selected={sortBy === 'name'}>
                    <ListItemText>Sort by Name</ListItemText>
                    {sortBy === 'name' && (sortOrder === 'asc' ? <ArrowUpward fontSize="small" sx={{ ml: 1, color: 'text.secondary' }} /> : <ArrowDownward fontSize="small" sx={{ ml: 1, color: 'text.secondary' }} />)}
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => handleOrderChange('asc')} selected={sortOrder === 'asc'}>
                    <ListItemIcon><ArrowUpward fontSize="small" /></ListItemIcon>
                    <ListItemText>Ascending</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleOrderChange('desc')} selected={sortOrder === 'desc'}>
                    <ListItemIcon><ArrowDownward fontSize="small" /></ListItemIcon>
                    <ListItemText>Descending</ListItemText>
                </MenuItem>
            </Menu>
        </PageContainer>
    );
}
