import { Chip } from "@mui/material";

export function SSLStatusChip({ status }: { status: string | null }) {
    if (!status) return <Chip label="Unknown" size="small" />;

    let color: "success" | "error" | "warning" | "default" = "default";

    switch (status) {
        case "Valid":
            color = "success";
            break;
        case "Expired":
        case "Error":
            color = "error";
            break;
        case "Expiring Soon":
            color = "warning";
            break;
    }

    return <Chip label={status} color={color} size="small" />;
}
