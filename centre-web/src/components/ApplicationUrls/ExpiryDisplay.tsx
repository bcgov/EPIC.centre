import { Box, Typography, Tooltip } from "@mui/material";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { ErrorOutline, CheckCircle, WarningAmber, Info } from "@mui/icons-material";

dayjs.extend(relativeTime);

interface ExpiryDisplayProps {
    expiryDate: string | null;
    url?: string;
}

export function ExpiryDisplay({ expiryDate, url }: ExpiryDisplayProps) {
    // Check for DevOps URL
    if (url && url.includes("devops.gov.bc.ca")) {
        return (
            <Tooltip title="Managed by Platform Services">
                <Box display="flex" alignItems="center" gap={0.5} color="text.secondary">
                    <Info fontSize="small" />
                    <Typography variant="body2">Managed</Typography>
                </Box>
            </Tooltip>
        );
    }

    if (!expiryDate) return <Typography variant="caption" color="text.secondary">No Expiry Date</Typography>;

    const expiry = dayjs(expiryDate);
    const now = dayjs();
    const daysUntilExpiry = expiry.diff(now, 'day');

    let color = "text.primary";
    let icon = <CheckCircle fontSize="small" color="success" />;
    let fontWeight = 500;

    if (daysUntilExpiry < 0) {
        color = "error.main";
        icon = <ErrorOutline fontSize="small" color="error" />;
        fontWeight = 700;
    } else if (daysUntilExpiry <= 7) {
        color = "error.main";
        icon = <ErrorOutline fontSize="small" color="error" />;
        fontWeight = 700;
    } else if (daysUntilExpiry <= 30) {
        color = "warning.main";
        icon = <WarningAmber fontSize="small" color="warning" />;
        fontWeight = 600;
    }

    // Friendly time display
    const getTimeText = (days: number): string => {
        if (days < 0) return "Expired";
        if (days === 0) return "Today";
        if (days <= 30) return `In ${days} days`;

        // For longer periods, use months
        const months = Math.floor(days / 30);
        return months === 1 ? "In ~1 month" : `In ~${months} months`;
    };

    const timeText = getTimeText(daysUntilExpiry);

    return (
        <Box display="flex" alignItems="center" gap={0.5}>
            <Tooltip title={`Expires on ${expiry.format("MMMM D, YYYY")}`}>
                <Box display="flex" alignItems="center" gap={1}>
                    {icon}
                    <Box display="flex" flexDirection="column">
                        <Typography
                            variant="body2"
                            fontWeight={fontWeight}
                            sx={{ color }}
                        >
                            {timeText}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            {expiry.format("MMM D, YYYY")}
                        </Typography>
                    </Box>
                </Box>
            </Tooltip>
        </Box>
    );
}
