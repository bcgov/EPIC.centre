import { InfoOutlined } from "@mui/icons-material";
import { Box, Paper, SvgIconTypeMap, Tooltip, Typography } from "@mui/material";
import { OverridableComponent } from "@mui/material/OverridableComponent";
import { ReactNode } from "react";

const TONES = {
    blue: { bg: "#eff6ff", border: "#bfdbfe", icon: "#1d4ed8", text: "#1e3a8a", info: "#3b82f6", shadow: "rgba(29, 78, 216, 0.08)" },
    green: { bg: "#f0fdf4", border: "#bbf7d0", icon: "#15803d", text: "#14532d", info: "#22c55e", shadow: "rgba(21, 128, 61, 0.08)" },
    slate: { bg: "#f8fafc", border: "#e2e8f0", icon: "#475569", text: "#0f172a", info: "#64748b", shadow: "rgba(71, 85, 105, 0.08)" },
    amber: { bg: "#fff7ed", border: "#fdba74", icon: "#c2410c", text: "#7c2d12", info: "#f97316", shadow: "rgba(194, 65, 12, 0.08)" },
    red: { bg: "#fef2f2", border: "#fca5a5", icon: "#b91c1c", text: "#7f1d1d", info: "#ef4444", shadow: "rgba(185, 28, 28, 0.08)" },
};

export type StatTone = keyof typeof TONES;

// Amber and red only show when something needs doing, so they get an accent bar to stand out
const ALERT_TONES: StatTone[] = ["amber", "red"];

export function StatCard({
    tone,
    icon: Icon,
    label,
    tooltip,
    value,
    caption,
}: {
    tone: StatTone;
    icon: OverridableComponent<SvgIconTypeMap>;
    label: string;
    tooltip: string;
    value: ReactNode;
    caption?: ReactNode;
}) {
    const colours = TONES[tone];
    return (
        <Paper
            variant="outlined"
            sx={{
                px: 2, py: 1.5, borderRadius: 3, minWidth: 170,
                bgcolor: colours.bg, borderColor: colours.border,
                ...(ALERT_TONES.includes(tone) && { borderLeft: `4px solid ${colours.icon}` }),
                transition: 'all 0.2s ease',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 4px 12px ${colours.shadow}` }
            }}
        >
            <Box display="flex" alignItems="center" gap={1}>
                <Icon sx={{ fontSize: 20, color: colours.icon }} />
                <Typography variant="body2" sx={{ color: colours.text, fontWeight: 600 }}>{label}</Typography>
                <Tooltip title={tooltip}>
                    <InfoOutlined sx={{ fontSize: 16, color: colours.info }} />
                </Tooltip>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: colours.text }}>{value}</Typography>
            {caption && (
                <Typography variant="caption" sx={{ color: colours.text, opacity: 0.8 }}>{caption}</Typography>
            )}
        </Paper>
    );
}
