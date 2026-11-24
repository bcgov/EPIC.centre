import { PageLoader } from "@/components/PageLoader";
import { LoadError } from "@/components/Shared/LoadError";
import { PageContainer } from "@/components/Shared/PageGrid";
import { useCurrentUser } from "@/contexts/UserContext";
import { useGetApplicationUrls, useGetSslCertificates } from "@/hooks/api/useApplicationUrls";
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
    Checkbox,
    FormControlLabel,
    FormGroup,
    Alert,
} from "@mui/material";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { EnvironmentChip } from "@/components/ApplicationUrls/EnvironmentChip";
import { ExpiryDisplay } from "@/components/ApplicationUrls/ExpiryDisplay";
import { CopyToClipboardButton } from "@/components/ApplicationUrls/CopyToClipboardButton";
import { SSLStatusChip } from "@/components/ApplicationUrls/SSLStatusChip";
import { AddUrlModal } from "@/components/ApplicationUrls/AddUrlModal";
import { EditUrlModal } from "@/components/ApplicationUrls/EditUrlModal";
import { CertificateRenewalModal } from "@/components/ApplicationUrls/CertificateRenewalModal";
import { RenewalChip } from "@/components/ApplicationUrls/RenewalChip";
import { StatCard } from "@/components/ApplicationUrls/StatCard";
import { CertificateHealthCards } from "@/components/ApplicationUrls/CertificateHealthCards";
import { describeLastChecked, getExpiryInfo } from "@/components/ApplicationUrls/sslUtils";
import {
    buildCertificateIndex,
    describeStaleness,
    summarizeCertificateHealth,
    CertificateGroup,
    getEnvOrder,
    getManagedCertificates,
    groupAndSortApps,
} from "@/components/ApplicationUrls/certificateGroups";
import { isHttpUrl } from "@/utils/url";
import {
    Add,
    Search,
    Close,
    Apps,
    TravelExplore,
    AccountTree,
    South,
    Info,
    VerifiedUser,
    HubOutlined,
    CloudUploadOutlined,
    VisibilityOutlined,
    GavelOutlined,
    RuleOutlined,
    VpnKeyOutlined,
    WebOutlined,
    BarChartOutlined,
} from "@mui/icons-material";

export const Route = createFileRoute("/_authenticated/application-urls")({
    component: ApplicationUrls,
});

type SortOption = 'expiry' | 'name';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'certificates' | 'applications';

const rowElementId = (id: number) => `app-url-row-${id}`;

const getExpirySummaryLabel = (expiryDate: string | null): string => {
    const info = getExpiryInfo(expiryDate);
    if (!info) return "Expiry on root host";
    if (info.expired) return "Expired on root host";
    if (info.daysLeft === 0) return "Expires today on root host";
    return `${info.text} on root host`;
};

const buildCertificateGroupTooltip = (group: CertificateGroup, inherited: boolean) => (
    <Box sx={{ maxWidth: 320 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {group.certificate.host}
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
        return RuleOutlined;
    }
    if (normalized.includes("submit")) {
        return CloudUploadOutlined;
    }
    if (normalized.includes("eagle")) {
        return VisibilityOutlined;
    }
    if (normalized.includes("compliance")) {
        return GavelOutlined;
    }
    if (normalized.includes("auth")) {
        return VpnKeyOutlined;
    }
    if (normalized.includes("centre")) {
        return HubOutlined;
    }
    if (normalized.includes("metabase")) {
        return BarChartOutlined;
    }

    return WebOutlined;
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

function ApplicationUrls() {
    const { canViewApplicationUrls, canManageApplicationUrls } = useCurrentUser();
    const urlsQuery = useGetApplicationUrls(canViewApplicationUrls);
    const certificatesQuery = useGetSslCertificates(canViewApplicationUrls);
    const urls = useMemo(() => urlsQuery.data ?? [], [urlsQuery.data]);
    const certificates = useMemo(() => certificatesQuery.data ?? [], [certificatesQuery.data]);
    const [editingUrl, setEditingUrl] = useState<ApplicationUrl | null>(null);
    // An id, so the dialog shows the certificate as refreshed by Check Now
    const [renewalCertificateId, setRenewalCertificateId] = useState<number | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addModalAppName, setAddModalAppName] = useState("");
    const [viewMode, setViewMode] = useState<ViewMode>('applications');
    // Row to scroll to once it has rendered, then briefly highlight
    const [scrollTargetId, setScrollTargetId] = useState<number | null>(null);
    const [highlightedRowId, setHighlightedRowId] = useState<number | null>(null);

    // Filtering State
    const [searchTerm, setSearchTerm] = useState("");
    // Unchecked environments are false; missing ones count as checked
    const [selectedEnvs, setSelectedEnvs] = useState<Record<string, boolean>>({});
    const [showPlatformManaged, setShowPlatformManaged] = useState(true);

    // Sorting State
    const [sortBy, setSortBy] = useState<SortOption>('expiry');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);

    const allEnvironments = useMemo(() => {
        return [...new Set(urls.map((url) => url.environment))].sort((a, b) =>
            getEnvOrder(a) - getEnvOrder(b) || a.localeCompare(b)
        );
    }, [urls]);

    const { certificateGroups, rowMeta } = useMemo(
        () => buildCertificateIndex(urls, certificates),
        [urls, certificates],
    );

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
            [env]: prev[env] === false,
        }));
    };

    const clearFilters = () => {
        setSearchTerm("");
        setSelectedEnvs({});
        setShowPlatformManaged(true);
    };

    const openAddApplication = () => {
        setAddModalAppName("");
        setIsAddModalOpen(true);
    };

    const stats = useMemo(() => ({
        appCount: new Set(urls.map((url) => url.app_name)).size,
        platformCount: certificateGroups.filter((group) => group.certificate.is_platform_managed).length,
    }), [certificateGroups, urls]);

    const managedCertificates = useMemo(() => getManagedCertificates(certificateGroups), [certificateGroups]);
    const staleness = useMemo(() => describeStaleness(certificates), [certificates]);
    const health = useMemo(
        () => summarizeCertificateHealth(certificateGroups, staleness !== null),
        [certificateGroups, staleness],
    );
    const renewalCertificate = certificates.find((certificate) => certificate.id === renewalCertificateId);

    const { sortedApps, visibleRowIds } = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        const filteredUrls = urls.filter((url) => {
            if (selectedEnvs[url.environment] === false) {
                return false;
            }
            if (term && !url.app_name.toLowerCase().includes(term) && !url.url.toLowerCase().includes(term)) {
                return false;
            }
            if (!showPlatformManaged && rowMeta.get(url.id)?.group?.certificate.is_platform_managed) {
                return false;
            }
            return true;
        });

        return {
            sortedApps: groupAndSortApps(filteredUrls, rowMeta, sortBy, sortOrder),
            visibleRowIds: new Set(filteredUrls.map((url) => url.id)),
        };
    }, [urls, rowMeta, searchTerm, selectedEnvs, showPlatformManaged, sortBy, sortOrder]);

    const revealRow = (rowId: number) => {
        // Otherwise a filtered-out row leaves nothing to scroll to
        if (!visibleRowIds.has(rowId)) {
            clearFilters();
        }
        setViewMode('applications');
        setScrollTargetId(rowId);
    };

    useEffect(() => {
        if (scrollTargetId === null) {
            return;
        }
        document.getElementById(rowElementId(scrollTargetId))?.scrollIntoView({ behavior: "smooth", block: "center" });
        setHighlightedRowId(scrollTargetId);
        setScrollTargetId(null);
    }, [scrollTargetId]);

    useEffect(() => {
        if (highlightedRowId === null) {
            return;
        }
        const timer = window.setTimeout(() => setHighlightedRowId(null), 2000);
        return () => window.clearTimeout(timer);
    }, [highlightedRowId]);

    if (!canViewApplicationUrls) {
        return <Navigate to="/access-denied" />;
    }

    if (urlsQuery.isPending || certificatesQuery.isPending) {
        return <PageLoader />;
    }

    if (urlsQuery.isError || certificatesQuery.isError) {
        return (
            <LoadError
                message="Unable to load application URLs. Please try again."
                onRetry={() => {
                    urlsQuery.refetch();
                    certificatesQuery.refetch();
                }}
            />
        );
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
                            onClick={openAddApplication}
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
                    <StatCard
                        tone="blue"
                        icon={Apps}
                        label="Applications"
                        tooltip="Total unique applications listed below. Each application section groups its environments together, even when SSL is shared with other apps on the same host."
                        value={stats.appCount}
                    />
                    <CertificateHealthCards health={health} />
                    <StatCard
                        tone="slate"
                        icon={TravelExplore}
                        label="Managed by OpenShift Platform"
                        tooltip="Certificates managed by the OpenShift platform (e.g. devops.gov.bc.ca). We track these for visibility, but our staff does not renew them."
                        value={stats.platformCount}
                    />
                </Stack>
                {staleness && (
                    <Alert severity="warning" sx={{ mt: 2.5 }}>{staleness}</Alert>
                )}
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
                        label={`Certificates We Manage (${managedCertificates.length})`}
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
                            : "Use this tab to review the root certificates that our staff is responsible for renewing and managing."}
                    </Typography>
                </Box>

                {viewMode === 'certificates' ? (
                    <Box sx={{ p: 2.5 }}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 800 }}>
                                Certificates We Manage
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Root certificates that our staff manages. Inherited routes and certificates managed by the OpenShift platform are excluded here.
                            </Typography>
                        </Box>

                        {managedCertificates.length === 0 ? (
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
                                {managedCertificates.map((group) => (
                                    <Paper
                                        key={`root-overview-${group.certificate.id}`}
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
                                                        {group.certificate.host}
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
                                                <Typography variant="caption" color="text.secondary" component="div">
                                                    Covers {group.appCount} app{group.appCount === 1 ? "" : "s"} across {group.rows.length} route{group.rows.length === 1 ? "" : "s"} · {describeLastChecked(group.certificate.last_checked)}
                                                </Typography>
                                                {group.certificate.check_error && (
                                                    <Typography variant="caption" color="error.main" component="div">
                                                        {group.certificate.check_error}
                                                    </Typography>
                                                )}
                                            </Box>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                                                <SSLStatusChip status={group.certificate.status} />
                                                <ExpiryDisplay expiryDate={group.certificate.expires_at} />
                                                <RenewalChip certificate={group.certificate} />
                                                {canManageApplicationUrls && (
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        onClick={() => setRenewalCertificateId(group.certificate.id)}
                                                        sx={{ textTransform: "none", borderRadius: 5, fontWeight: 700 }}
                                                    >
                                                        Renewal
                                                    </Button>
                                                )}
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={() => revealRow(group.rootRow.id)}
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

                            <Box display="flex" alignItems="center" gap={2} flexWrap="wrap" sx={{ mr: 'auto' }}>
                                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                                    Show:
                                </Typography>
                                <FormGroup row sx={{ gap: { xs: 1, md: 2 } }}>
                                    {allEnvironments.map((env) => (
                                        <FormControlLabel
                                            key={env}
                                            control={
                                                <Checkbox
                                                    size="small"
                                                    checked={selectedEnvs[env] !== false}
                                                    onChange={() => handleEnvToggle(env)}
                                                    sx={{ py: 0.5, color: 'text.secondary', '&.Mui-checked': { color: 'primary.main' } }}
                                                />
                                            }
                                            label={<Typography variant="body2" fontWeight={600} color={selectedEnvs[env] !== false ? "text.primary" : "text.secondary"}>{env}</Typography>}
                                            sx={{ m: 0 }}
                                        />
                                    ))}
                                    <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                size="small"
                                                checked={showPlatformManaged}
                                                onChange={(e) => setShowPlatformManaged(e.target.checked)}
                                                sx={{ py: 0.5, color: '#64748b', '&.Mui-checked': { color: '#0369a1' } }}
                                            />
                                        }
                                        label={<Typography variant="body2" fontWeight={600} color={showPlatformManaged ? "text.primary" : "text.secondary"}>OpenShift Platform Managed</Typography>}
                                        sx={{ m: 0 }}
                                    />
                                </FormGroup>
                            </Box>

                            <Button
                                variant="outlined"
                                color="inherit"
                                startIcon={<SortIcon />}
                                onClick={handleSortClick}
                                sx={{ color: 'text.secondary', borderRadius: 5 }}
                            >
                                Sort By: {sortBy === 'expiry' ? 'Renewal Urgency' : 'Name'}
                            </Button>
                        </Box>

                        {sortedApps.length === 0 ? (
                            <Box sx={{ py: 8, textAlign: "center" }}>
                                <Typography variant="h6" color="text.secondary" gutterBottom>
                                    {urls.length
                                        ? "No application URLs match your filters"
                                        : "No application URLs configured"}
                                </Typography>
                                {urls.length > 0 ? (
                                    <Button variant="outlined" onClick={clearFilters} sx={{ mt: 2 }}>
                                        Clear Filters
                                    </Button>
                                ) : canManageApplicationUrls && (
                                    <Button
                                        variant="outlined"
                                        startIcon={<Add />}
                                        onClick={openAddApplication}
                                        sx={{ mt: 2 }}
                                    >
                                        Add Your First Application
                                    </Button>
                                )}
                            </Box>
                        ) : (
                            <Stack spacing={2} sx={{ p: 2 }}>
                                {sortedApps.map(({ appName, appUrls }) => (
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
                                                        id={rowElementId(url.id)}
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
                                                            },
                                                            // Marks the row "View Routes" or "SSL Inherited from" scrolled to
                                                            ...(highlightedRowId === url.id && {
                                                                borderColor: "primary.main",
                                                                boxShadow: "0 0 0 3px rgba(29,78,216,0.2)",
                                                            }),
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
                                                                    const { group, inherited } = rowMeta.get(url.id)!;
                                                                    const isPlatformManaged = !!group?.certificate.is_platform_managed;
                                                                    const sharedRouteCount = group?.rows.length ?? 1;
                                                                    const sharedAppCount = group?.appCount ?? 1;
                                                                    const tooltipTitle = group ? buildCertificateGroupTooltip(group, inherited) : "";

                                                                    return (
                                                                        <Box display="flex" flexDirection="column" gap={1}>
                                                                            <Box display="flex" alignItems="center" gap={1.25} flexWrap="wrap">
                                                                                <EnvironmentChip environment={url.environment} />
                                                                                <Typography
                                                                                    variant="body2"
                                                                                    component="a"
                                                                                    // Never link a non-web scheme such as javascript:
                                                                                    href={isHttpUrl(url.url) ? url.url : undefined}
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
                                                                    const { group, inherited } = rowMeta.get(url.id)!;
                                                                    if (!group) {
                                                                        return (
                                                                            <Tooltip title="Plain http has no certificate, so traffic to this URL isn't encrypted.">
                                                                                <Chip size="small" label="Not HTTPS" color="warning" variant="outlined" sx={{ alignSelf: "flex-start", borderRadius: '6px' }} />
                                                                            </Tooltip>
                                                                        );
                                                                    }
                                                                    const { certificate, rootRow } = group;
                                                                    const isPlatformManaged = certificate.is_platform_managed;
                                                                    const ownsRenewal = !inherited && !isPlatformManaged;

                                                                    return (
                                                                        <Box display="flex" flexDirection="column" gap={0.75}>
                                                                            {inherited ? (
                                                                                <Box display="flex" flexDirection="column" gap={0.75}>
                                                                                    <Button
                                                                                        variant="text"
                                                                                        size="small"
                                                                                        color="info"
                                                                                        startIcon={<South fontSize="small" />}
                                                                                        onClick={() => revealRow(rootRow.id)}
                                                                                        sx={{
                                                                                            justifyContent: "flex-start",
                                                                                            px: 0,
                                                                                            minWidth: 0,
                                                                                            textTransform: "none",
                                                                                            fontWeight: 700,
                                                                                            alignSelf: "flex-start",
                                                                                        }}
                                                                                    >
                                                                                        SSL Inherited from {rootRow.app_name} {rootRow.environment} ({certificate.host})
                                                                                    </Button>
                                                                                    <Typography variant="caption" color="text.secondary">
                                                                                        {getExpirySummaryLabel(certificate.expires_at)}. Refer to root host for renewal tracking.
                                                                                    </Typography>
                                                                                </Box>
                                                                            ) : isPlatformManaged ? (
                                                                                <Chip
                                                                                    size="small"
                                                                                    label="Managed by OpenShift Platform"
                                                                                    variant="outlined"
                                                                                    color="default"
                                                                                    sx={{ alignSelf: "flex-start", borderRadius: '6px' }}
                                                                                />
                                                                            ) : (
                                                                                <ExpiryDisplay expiryDate={certificate.expires_at} />
                                                                            )}
                                                                            <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
                                                                                {isPlatformManaged ? null : (
                                                                                    <SSLStatusChip status={inherited ? `${certificate.status} (Inherited)` : certificate.status} />
                                                                                )}
                                                                                {ownsRenewal && group.rows.length > 1 && (
                                                                                    <Chip
                                                                                        size="small"
                                                                                        variant="outlined"
                                                                                        label={`Covers ${group.rows.length} routes`}
                                                                                        sx={{ height: 24, fontSize: '0.75rem' }}
                                                                                    />
                                                                                )}
                                                                                {ownsRenewal && <RenewalChip certificate={certificate} />}
                                                                                {ownsRenewal && canManageApplicationUrls && (
                                                                                    <Button
                                                                                        size="small"
                                                                                        onClick={() => setRenewalCertificateId(certificate.id)}
                                                                                        sx={{ textTransform: "none", fontWeight: 700, minWidth: 0, px: 1 }}
                                                                                    >
                                                                                        Renewal
                                                                                    </Button>
                                                                                )}
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

            {canManageApplicationUrls && renewalCertificate && (
                <CertificateRenewalModal
                    certificate={renewalCertificate}
                    onClose={() => setRenewalCertificateId(null)}
                />
            )}

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
                    <ListItemText>Sort by Renewal Urgency</ListItemText>
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
