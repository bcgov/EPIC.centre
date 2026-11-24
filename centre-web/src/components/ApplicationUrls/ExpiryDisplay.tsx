import { Box, Typography, Tooltip } from "@mui/material";
import { ErrorOutline, CheckCircle, WarningAmber } from "@mui/icons-material";
import { getExpiryInfo } from "./sslUtils";

export function ExpiryDisplay({ expiryDate }: { expiryDate: string | null }) {
    const info = getExpiryInfo(expiryDate);
    if (!info) return <Typography variant="caption" color="text.secondary">No Expiry Date</Typography>;

    let color = "text.primary";
    let icon = <CheckCircle fontSize="small" color="success" />;
    let fontWeight = 500;

    if (info.expired || info.daysLeft <= 7) {
        color = "error.main";
        icon = <ErrorOutline fontSize="small" color="error" />;
        fontWeight = 700;
    } else if (info.daysLeft <= 30) {
        color = "warning.main";
        icon = <WarningAmber fontSize="small" color="warning" />;
        fontWeight = 600;
    }

    return (
        <Box display="flex" alignItems="center" gap={0.5}>
            <Tooltip title={`Expires on ${info.expiry.format("MMMM D, YYYY")}`}>
                <Box display="flex" alignItems="center" gap={1}>
                    {icon}
                    <Box display="flex" flexDirection="column">
                        <Typography
                            variant="body2"
                            fontWeight={fontWeight}
                            sx={{ color }}
                        >
                            {info.text}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            {info.expiry.format("MMM D, YYYY")}
                        </Typography>
                    </Box>
                </Box>
            </Tooltip>
        </Box>
    );
}
