import { Chip } from "@mui/material";

export function EnvironmentChip({ environment }: { environment: string }) {
    let bgcolor = "#f1f5f9"; // Slate 100
    let color = "#475569";   // Slate 600

    switch (environment) {
        case "PROD":
            bgcolor = "#eff6ff"; // Blue 50
            color = "#1d4ed8";   // Blue 700
            break;
        case "TEST":
            bgcolor = "#fff7ed"; // Orange 50
            color = "#c2410c";   // Orange 700
            break;
        case "DEV":
            bgcolor = "#f0fdfa"; // Teal 50
            color = "#0f766e";   // Teal 700
            break;
    }

    return (
        <Chip
            label={environment}
            size="small"
            sx={{
                bgcolor: bgcolor,
                color: color,
                fontWeight: 800,
                fontSize: '0.7rem',
                height: 22,
                borderRadius: '6px',
                border: '1px solid',
                borderColor: `${color}30`
            }}
        />
    );
}
