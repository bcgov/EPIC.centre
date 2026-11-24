import { ConfirmationNumber, Event, Help, ShoppingCart } from "@mui/icons-material";
import { Chip, ChipProps, Tooltip } from "@mui/material";
import { SslCertificate } from "@/models/ApplicationUrl";

/** A certificate's renewal progress, or nothing when none is recorded. */
export function RenewalChip({ certificate }: { certificate: SslCertificate }) {
    const { renewal_status: status, ticket_reference: ticket, renewal_comments: comments } = certificate;
    if (status === "NONE" && !ticket && !comments) return null;

    let icon = <ConfirmationNumber fontSize="small" />;
    let color: ChipProps["color"] = "info";
    let label = "Ticket";

    if (status === "ORDERED") {
        icon = <ShoppingCart fontSize="small" />;
        color = "warning";
        label = "Ordered";
    } else if (status === "PLANNED") {
        icon = <Event fontSize="small" />;
        color = "success";
        label = "Planned";
    } else if (status === "NONE" && !ticket) {
        icon = <Help fontSize="small" />;
        color = "default";
        label = "Note";
    }

    return (
        <Tooltip title={comments || "No comments"}>
            <Chip
                icon={icon}
                label={ticket ? `${label}: ${ticket}` : label}
                size="small"
                variant="outlined"
                color={color}
                sx={{ height: 24, fontSize: '0.75rem' }}
            />
        </Tooltip>
    );
}
