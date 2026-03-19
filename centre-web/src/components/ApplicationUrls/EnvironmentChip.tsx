import { Chip } from "@mui/material";

export function EnvironmentChip({ environment }: { environment: string }) {
    let bgcolor = "#e0e0e0";
    let color = "#000000";

    switch (environment) {
        case "PROD":
            bgcolor = "#1565c0"; // Primary Blue 800
            color = "#ffffff";
            break;
        case "TEST":
            bgcolor = "#ed6c02"; // Warning Orange
            color = "#ffffff";
            break;
        case "DEV":
            bgcolor = "#0288d1"; // Info Light Blue
            color = "#ffffff";
            break;
    }

    return (
        <Chip
            label={environment}
            size="small"
            sx={{
                bgcolor: bgcolor,
                color: color,
                fontWeight: 700,
                fontSize: '0.7rem',
                height: 20,
                borderRadius: '4px', // Slightly more square for a "tag" look
                border: 'none'
            }}
        />
    );
}
