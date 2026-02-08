import { Chip } from "@mui/material";

export function EnvironmentChip({ environment }: { environment: string }) {
    let color: "primary" | "warning" | "default" | "info" = "default";
    let sx: any = { fontWeight: 700, fontSize: '0.7rem', height: 20 };

    switch (environment) {
        case "PROD":
            // Use precise colors for better readability (Dark Blue + White)
            sx = { ...sx, bgcolor: '#1565c0', color: '#ffffff' };
            break;
        case "TEST":
            color = "warning";
            sx = { ...sx, color: '#000000' }; // Ensure readability on yellow/orange
            break;
        case "DEV":
            color = "info";
            break;
    }

    return (
        <Chip
            label={environment}
            color={color}
            size="small"
            sx={{ fontWeight: 700, fontSize: '0.7rem', height: 20 }}
        />
    );
}
