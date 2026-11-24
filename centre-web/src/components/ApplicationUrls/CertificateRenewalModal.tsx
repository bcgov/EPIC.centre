import { Refresh } from "@mui/icons-material";
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { useCheckCertificate, useUpdateCertificateRenewal } from "@/hooks/api/useApplicationUrls";
import { RENEWAL_STATUS_LABELS, RenewalStatus, SslCertificate } from "@/models/ApplicationUrl";
import { getErrorMessage, setServerFieldErrors } from "@/utils/errorUtils";
import { ExpiryDisplay } from "./ExpiryDisplay";
import { ticketReferenceRules } from "./fieldRules";
import { SSLStatusChip } from "./SSLStatusChip";
import { describeLastChecked } from "./sslUtils";

type RenewalForm = {
    ticket_reference: string;
    renewal_status: RenewalStatus;
    renewal_comments: string;
};

export function CertificateRenewalModal({
    certificate,
    onClose,
}: {
    certificate: SslCertificate;
    onClose: () => void;
}) {
    const { mutate: saveRenewal, isPending: isSaving } = useUpdateCertificateRenewal();
    const { mutate: checkNow, isPending: isChecking } = useCheckCertificate();
    const isBusy = isSaving || isChecking;

    const { control, handleSubmit, setError } = useForm<RenewalForm>({
        defaultValues: {
            ticket_reference: certificate.ticket_reference || "",
            renewal_status: certificate.renewal_status,
            renewal_comments: certificate.renewal_comments || "",
        },
    });

    const onSubmit = (data: RenewalForm) => {
        saveRenewal(
            {
                id: certificate.id,
                ticket_reference: data.ticket_reference.trim() || null,
                renewal_status: data.renewal_status,
                renewal_comments: data.renewal_comments.trim() || null,
            },
            {
                onSuccess: onClose,
                onError: (error) => {
                    const shownOnFields = setServerFieldErrors(error, setError, ([field]) =>
                        field === "ticket_reference" ? field : undefined,
                    );
                    if (!shownOnFields) {
                        notify.error(getErrorMessage(error, "Unable to save the renewal details. Please try again."));
                    }
                },
            },
        );
    };

    const handleCheckNow = () => {
        checkNow(certificate.id, {
            onError: (error) => {
                notify.error(getErrorMessage(error, "Unable to check the certificate. Please try again."));
            },
        });
    };

    // Stay open while saving: closing unmounts the modal and loses a failed save's error
    return (
        <Dialog open onClose={isBusy ? undefined : onClose} fullWidth maxWidth="sm">
            <DialogTitle>Certificate Renewal</DialogTitle>
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogContent>
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="h6" sx={{ wordBreak: "break-all" }}>{certificate.host}</Typography>
                            <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap" sx={{ mt: 1 }}>
                                <SSLStatusChip status={certificate.status} />
                                <ExpiryDisplay expiryDate={certificate.expires_at} />
                                <Typography variant="caption" color="text.secondary">
                                    {describeLastChecked(certificate.last_checked)}
                                    {certificate.issuer ? ` · Issued by ${certificate.issuer}` : ""}
                                </Typography>
                            </Box>
                            {certificate.check_error && (
                                <Alert severity="error" sx={{ mt: 1.5 }}>{certificate.check_error}</Alert>
                            )}
                        </Box>
                        <Controller
                            name="ticket_reference"
                            control={control}
                            rules={ticketReferenceRules}
                            render={({ field, fieldState: { error } }) => (
                                <TextField
                                    {...field}
                                    label="SSL Renewal Ticket # (Optional)"
                                    placeholder="e.g. INFRA-1234"
                                    fullWidth
                                    error={!!error}
                                    helperText={error?.message || "Reference for tracking external renewal work"}
                                />
                            )}
                        />
                        <Controller
                            name="renewal_status"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    label="Renewal Status"
                                    fullWidth
                                    helperText="Shown in the renewal reminder emails"
                                >
                                    {Object.entries(RENEWAL_STATUS_LABELS).map(([value, label]) => (
                                        <MenuItem key={value} value={value}>{label}</MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />
                        <Controller
                            name="renewal_comments"
                            control={control}
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    label="Comments"
                                    multiline
                                    rows={3}
                                    fullWidth
                                    placeholder="Add details about delay, ETA, or blockers..."
                                />
                            )}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 2 }}>
                    <Button startIcon={<Refresh />} onClick={handleCheckNow} disabled={isBusy}>
                        {isChecking ? "Checking..." : "Check Now"}
                    </Button>
                    <Box>
                        <Button onClick={onClose} disabled={isBusy} sx={{ mr: 1 }}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="contained" disabled={isBusy}>
                            Save
                        </Button>
                    </Box>
                </DialogActions>
            </form>
        </Dialog>
    );
}
