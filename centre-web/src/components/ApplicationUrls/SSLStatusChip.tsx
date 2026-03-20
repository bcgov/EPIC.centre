import { Chip } from "@mui/material";

export function SSLStatusChip({ status }: { status: string | null }) {
    if (!status) return <Chip label="Unknown" size="small" variant="outlined" sx={{ borderRadius: '6px' }} />;

    const normalizedStatus = status.replace(" (Inherited)", "");
    let bgcolor = "#f8fafc"; // Slate 50
    let color = "#475569";   // Slate 600

    switch (normalizedStatus) {
        case "Valid":
            bgcolor = "#f0fdf4"; // Green 50
            color = "#15803d";   // Green 700
            break;
        case "Expired":
        case "Error":
            bgcolor = "#fef2f2"; // Red 50
            color = "#b91c1c";   // Red 700
            break;
        case "Expiring Soon":
            bgcolor = "#fefce8"; // Yellow 50
            color = "#a16207";   // Yellow 700
            break;
    }

    return (
        <Chip 
            label={status} 
            size="small" 
            sx={{
                bgcolor,
                color,
                fontWeight: 700,
                fontSize: '0.75rem',
                height: 24,
                borderRadius: '6px',
                border: '1px solid',
                borderColor: `${color}30`
            }} 
        />
    );
}
