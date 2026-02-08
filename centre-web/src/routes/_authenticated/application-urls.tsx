import { PageLoader } from "@/components/PageLoader";
import { PageContainer } from "@/components/Shared/PageGrid";
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
    Checkbox,
    FormGroup,
    FormControlLabel,
} from "@mui/material";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { EnvironmentChip } from "@/components/ApplicationUrls/EnvironmentChip";
import { ExpiryDisplay } from "@/components/ApplicationUrls/ExpiryDisplay";
import { CopyToClipboardButton } from "@/components/ApplicationUrls/CopyToClipboardButton";
import { SSLStatusChip } from "@/components/ApplicationUrls/SSLStatusChip";
import { AddUrlModal } from "@/components/ApplicationUrls/AddUrlModal";
import { EditUrlModal } from "@/components/ApplicationUrls/EditUrlModal";
import { Add, Search, Close } from "@mui/icons-material";

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
    const { data: urls = [], isPending } = useGetApplicationUrls();
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

    if (isPending) {
        return <PageLoader />;
    }

    return (
        <PageContainer>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                        Application Health
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Real-time SSL certificate status across all environments.
                    </Typography>
                </Box>
                <Box display="flex" gap={2}>
                    <Button
                        variant="outlined"
                        color="inherit"
                        startIcon={<Add />}
                        onClick={() => {
                            setAddModalAppName("");
                            setIsAddModalOpen(true);
                        }}
                        sx={{
                            color: 'text.secondary',
                            borderColor: 'divider',
                            '&:hover': {
                                borderColor: 'text.primary',
                                color: 'text.primary',
                                bgcolor: 'action.hover'
                            }
                        }}
                    >
                        Add URL
                    </Button>
                </Box>
            </Box>

            {/* Filters Bar */}
            <Paper variant="outlined" sx={{ p: 2, mb: 3, display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
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

                <Divider orientation="vertical" flexItem />

                <Box display="flex" alignItems="center" gap={2}>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                        Environments:
                    </Typography>
                    <FormGroup row>
                        {['PROD', 'TEST', 'DEV'].map(env => (
                            <FormControlLabel
                                key={env}
                                control={
                                    <Checkbox
                                        checked={selectedEnvs[env]}
                                        onChange={() => handleEnvToggle(env)}
                                        size="small"
                                    />
                                }
                                label={<EnvironmentChip environment={env} />}
                                sx={{ mr: 2 }}
                            />
                        ))}
                    </FormGroup>
                </Box>

                <Divider orientation="vertical" flexItem />

                <Button
                    variant="text"
                    color="inherit"
                    startIcon={<SortIcon />}
                    onClick={handleSortClick}
                    sx={{ color: 'text.secondary' }}
                >
                    Sort By: {sortBy === 'expiry' ? 'Urgency' : 'Name'}
                </Button>
            </Paper>

            <Paper variant="outlined" sx={{ width: '100%', overflow: 'hidden' }}>
                <TableContainer>
                    <Table sx={{ minWidth: 650 }} aria-label="application urls table">
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell sx={{ fontWeight: 600 }}>URL</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>SSL Expiry</TableCell>
                                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {Object.keys(groupedApps).length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                                        <Typography variant="h6" color="text.secondary" gutterBottom>
                                            {searchTerm || Object.values(selectedEnvs).some(v => !v)
                                                ? "No application URLs match your filters"
                                                : "No application URLs configured"}
                                        </Typography>
                                        {!searchTerm && Object.values(selectedEnvs).every(v => v) && (
                                            <Button
                                                variant="outlined"
                                                startIcon={<Add />}
                                                onClick={() => setIsAddModalOpen(true)}
                                                sx={{ mt: 2 }}
                                            >
                                                Add Your First URL
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                Object.entries(groupedApps).sort(sortGroups).map(([appName, appUrls]) => (
                                    <Box component={TableRow} key={`group-${appName}`} sx={{ display: 'contents' }}>
                                        {/* Section Header Row */}
                                        <TableRow key={`header-${appName}`} sx={{ bgcolor: 'action.selected' }}>
                                            <TableCell colSpan={4} sx={{ fontWeight: 700, py: 1.5, fontSize: '0.95rem' }}>
                                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                                    {appName}
                                                    <Button
                                                        startIcon={<Add />}
                                                        size="small"
                                                        variant="text"
                                                        color="inherit"
                                                        sx={{
                                                            fontSize: '0.75rem',
                                                            textTransform: 'none',
                                                            color: 'text.secondary',
                                                            opacity: 0.7,
                                                            '&:hover': {
                                                                opacity: 1,
                                                                bgcolor: 'action.hover'
                                                            }
                                                        }}
                                                        onClick={() => {
                                                            setAddModalAppName(appName);
                                                            setIsAddModalOpen(true);
                                                        }}
                                                    >
                                                        Add Env
                                                    </Button>
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
                                                    <ExpiryDisplay expiryDate={url.ssl_expiry} url={url.url} />
                                                </TableCell>
                                                <TableCell>
                                                    <SSLStatusChip status={url.ssl_status} />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <IconButton size="small" onClick={() => handleEdit(url)}>
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </Box>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {editingUrl && (
                <EditUrlModal open={!!editingUrl} onClose={handleClose} url={editingUrl} />
            )}

            <AddUrlModal
                open={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                initialAppName={addModalAppName}
            />

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
