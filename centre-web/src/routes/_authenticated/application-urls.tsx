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
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
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
} from "@mui/material";
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
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
} from "@mui/icons-material";

export const Route = createFileRoute("/_authenticated/application-urls")({
    component: ApplicationUrls,
});

type SortOption = 'expiry' | 'name';
type SortOrder = 'asc' | 'desc';

// Constants
const FAR_FUTURE_TIMESTAMP = Number.MAX_SAFE_INTEGER;
const ENV_ORDER: Record<string, number> = { PROD: 1, TEST: 2, DEV: 3 };

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

    const stats = useMemo(() => {
        const appCount = new Set(urls.map((url) => url.app_name)).size;
        const expiringCount = urls.filter((url) => url.ssl_status === "Expiring Soon").length;
        const errorCount = urls.filter((url) => url.ssl_status === "Error" || url.ssl_status === "Expired").length;
        const managedCount = urls.filter((url) => url.ssl_status === "Managed").length;

        return { appCount, expiringCount, errorCount, managedCount };
    }, [urls]);

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
                    borderRadius: 3,
                    background: "linear-gradient(180deg, rgba(21,101,192,0.04) 0%, rgba(21,101,192,0.01) 100%)",
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
                    <Paper variant="outlined" sx={{ px: 2, py: 1.5, borderRadius: 2, minWidth: 170 }}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Apps color="primary" fontSize="small" />
                            <Typography variant="body2" color="text.secondary">Applications</Typography>
                            <Tooltip title="Total unique applications listed below. Each application section groups its environments together.">
                                <InfoOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
                            </Tooltip>
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>{stats.appCount}</Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ px: 2, py: 1.5, borderRadius: 2, minWidth: 170 }}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <WarningAmber color="warning" fontSize="small" />
                            <Typography variant="body2" color="text.secondary">Expiring Soon</Typography>
                            <Tooltip title="URLs with SSL certificates expiring within 30 days. Use Sort By: Urgency to bring these near the top.">
                                <InfoOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
                            </Tooltip>
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>{stats.expiringCount}</Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ px: 2, py: 1.5, borderRadius: 2, minWidth: 170 }}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <ErrorOutline color="error" fontSize="small" />
                            <Typography variant="body2" color="text.secondary">Needs Attention</Typography>
                            <Tooltip title="URLs that are already expired or returned an SSL error. Sort by Urgency and look for red expiry/status indicators.">
                                <InfoOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
                            </Tooltip>
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>{stats.errorCount}</Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ px: 2, py: 1.5, borderRadius: 2, minWidth: 170 }}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <TravelExplore color="action" fontSize="small" />
                            <Typography variant="body2" color="text.secondary">Managed</Typography>
                            <Tooltip title="Platform-managed URLs, typically on devops.gov.bc.ca. These are tracked for visibility but not usually renewed by staff here.">
                                <InfoOutlined sx={{ fontSize: 16, color: 'text.secondary' }} />
                            </Tooltip>
                        </Box>
                        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>{stats.managedCount}</Typography>
                    </Paper>
                </Stack>
            </Paper>

            <Paper
                variant="outlined"
                sx={{
                    p: 2,
                    mb: 3,
                    display: 'flex',
                    gap: 2,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    borderRadius: 3,
                }}
            >
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
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>
                        Environments:
                    </Typography>
                    {allEnvironments.map((env) => {
                        const selected = selectedEnvs[env] !== false;
                        return (
                            <Button
                                key={env}
                                size="small"
                                variant={selected ? "contained" : "outlined"}
                                color={selected ? "primary" : "inherit"}
                                onClick={() => handleEnvToggle(env)}
                                sx={{
                                    minWidth: 0,
                                    px: 1.25,
                                    borderRadius: 5,
                                    boxShadow: 'none',
                                }}
                            >
                                {env}
                            </Button>
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
            </Paper>

            <Paper variant="outlined" sx={{ width: '100%', overflow: 'hidden', borderRadius: 3 }}>
                <TableContainer>
                    <Table sx={{ minWidth: 650 }} aria-label="application urls table">
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell sx={{ fontWeight: 600 }}>URL</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>SSL Status & Expiry</TableCell>
                                {canManageApplicationUrls && (
                                    <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                                )}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {Object.keys(groupedApps).length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={canManageApplicationUrls ? 4 : 2} align="center" sx={{ py: 8 }}>
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
                                    </TableCell>
                                </TableRow>
                            ) : (
                                Object.entries(groupedApps).sort(sortGroups).map(([appName, appUrls]) => (
                                    <Box component={TableRow} key={`group-${appName}`} sx={{ display: 'contents' }}>
                                        {/* Section Header Row */}
                                        <TableRow key={`header-${appName}`} sx={{ bgcolor: 'action.selected' }}>
                                            <TableCell colSpan={canManageApplicationUrls ? 4 : 2} sx={{ fontWeight: 700, py: 1.5, fontSize: '0.95rem' }}>
                                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                                    <Box display="flex" alignItems="center" gap={1.25}>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                                                            {appName}
                                                        </Typography>
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
                                                            Add Env
                                                        </Button>
                                                    )}
                                                </Box>
                                            </TableCell>
                                        </TableRow>

                                        {/* Environment Rows */}
                                        {appUrls.map((url) => (
                                            <TableRow
                                                key={url.id}
                                                sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: 'action.hover' } }}
                                            >
                                                <TableCell sx={{ maxWidth: 500 }}>
                                                    <Box display="flex" alignItems="center" gap={1.5}>
                                                        <EnvironmentChip environment={url.environment} />
                                                        <Typography
                                                            variant="body2"
                                                            component="a"
                                                            href={url.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            sx={{
                                                                color: 'primary.main',
                                                                textDecoration: 'none',
                                                                fontWeight: 500,
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                maxWidth: 350,
                                                                display: 'block',
                                                                '&:hover': { textDecoration: 'underline' }
                                                            }}
                                                            title={url.url}
                                                        >
                                                            {url.url}
                                                        </Typography>
                                                        <CopyToClipboardButton text={url.url} />
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Box display="flex" flexDirection="column" gap={0.5}>
                                                        <ExpiryDisplay expiryDate={url.ssl_expiry} url={url.url} />
                                                        <Box display="flex" gap={1} alignItems="center">
                                                            <SSLStatusChip status={url.ssl_status} />
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
                                                                    // No status, but comments exist
                                                                    icon = <Help fontSize="small" />;
                                                                    color = "default";
                                                                    label = "Note";
                                                                }

                                                                // Append ticket reference to label if exists
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
                                                </TableCell>
                                                {canManageApplicationUrls && (
                                                    <TableCell align="right">
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
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}
                                    </Box>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
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
