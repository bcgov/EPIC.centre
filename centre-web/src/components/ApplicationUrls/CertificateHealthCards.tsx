import { CheckCircleOutline, ErrorOutline, HelpOutline, Schedule, WarningAmber } from "@mui/icons-material";
import { CertificateHealth } from "./certificateGroups";
import { getExpiryInfo } from "./sslUtils";
import { StatCard } from "./StatCard";

const CERTIFICATES_TOOLTIP =
    "Certificates our staff renew. Green when every one passed its last check and is more than 30 days from expiry.";

/** One calm card when nothing needs doing; otherwise a card per kind of problem. */
export function CertificateHealthCards({ health }: { health: CertificateHealth }) {
    switch (health.state) {
        case "issues":
            return (
                <>
                    {health.expiring > 0 && (
                        <StatCard
                            tone="amber"
                            icon={WarningAmber}
                            label="Expiring Soon"
                            tooltip="Certificates we renew that expire within 30 days. A certificate shared by several routes counts once."
                            value={health.expiring}
                        />
                    )}
                    {health.attention > 0 && (
                        <StatCard
                            tone="red"
                            icon={ErrorOutline}
                            label="Needs Attention"
                            tooltip="Certificates we renew that have expired or failed their last check."
                            value={health.attention}
                        />
                    )}
                </>
            );
        case "valid": {
            const next = getExpiryInfo(health.next.expires_at);
            return (
                <StatCard
                    tone="green"
                    icon={CheckCircleOutline}
                    label="Certificates"
                    tooltip={CERTIFICATES_TOOLTIP}
                    value={`All ${health.count} valid`}
                    caption={next && `Next: ${health.next.host} · ${next.expiry.format("MMM D")} · in ${next.daysLeft} days`}
                />
            );
        }
        case "unchecked":
            return (
                <StatCard
                    tone="slate"
                    icon={HelpOutline}
                    label="Certificates"
                    tooltip={CERTIFICATES_TOOLTIP}
                    value={`${health.count} not checked yet`}
                    caption="Certificates are checked once a day"
                />
            );
        case "stale":
            return (
                <StatCard
                    tone="slate"
                    icon={Schedule}
                    label="Certificates"
                    tooltip={CERTIFICATES_TOOLTIP}
                    value="Checks out of date"
                    caption="See the warning below"
                />
            );
        default:
            return (
                <StatCard
                    tone="slate"
                    icon={HelpOutline}
                    label="Certificates"
                    tooltip={CERTIFICATES_TOOLTIP}
                    value="None to track"
                />
            );
    }
}
