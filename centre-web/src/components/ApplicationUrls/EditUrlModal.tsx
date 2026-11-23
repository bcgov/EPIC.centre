import { ApplicationUrl } from "@/models/ApplicationUrl";
import { useUpdateApplicationUrl, useDeleteApplicationUrl } from "@/hooks/api/useApplicationUrls";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    TextField,
    Typography,
    Box,
    MenuItem
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { useState } from "react";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { getErrorMessage, setServerFieldErrors } from "@/utils/errorUtils";
import { ticketReferenceRules, urlRules } from "./fieldRules";

export function EditUrlModal({
    open,
    onClose,
    url,
}: {
    open: boolean;
    onClose: () => void;
    url: ApplicationUrl;
}) {
    const { mutate, isPending } = useUpdateApplicationUrl();
    const { mutate: deleteUrl, isPending: isDeleting } = useDeleteApplicationUrl();
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

    const { control, handleSubmit, setError } = useForm<ApplicationUrl>({
        defaultValues: {
            ...url,
            renewal_status: url.renewal_status || 'NONE',
            renewal_comments: url.renewal_comments || '',
            ticket_reference: url.ticket_reference || ''
        },
    });

    const onSubmit = (data: ApplicationUrl) => {
        mutate(
            {
                ...data,
                url: data.url.trim(),
                ticket_reference: data.ticket_reference?.trim() || null,
            },
            {
                onSuccess: () => {
                    onClose();
                },
                onError: (error) => {
                    // Only these fields show an error
                    const shownOnFields = setServerFieldErrors(error, setError, ([field]) =>
                        field === "url" || field === "ticket_reference" ? field : undefined,
                    );
                    if (!shownOnFields) {
                        notify.error(getErrorMessage(error, "Unable to save the URL. Please try again."));
                    }
                },
            },
        );
    };

    const handleDelete = () => {
        deleteUrl(url.id, {
            onSuccess: () => {
                onClose();
            },
            onError: (error) => {
                notify.error(getErrorMessage(error, "Unable to delete the URL. Please try again."));
            },
        });
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Edit URL</DialogTitle>
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogContent>
                    <Stack spacing={3}>
                        <Box>
                            <Typography variant="subtitle2" color="text.secondary">
                                Application & Environment
                            </Typography>
                            <Typography variant="h6">
                                {url.app_name} - {url.environment}
                            </Typography>
                        </Box>
                        <Controller
                            name="url"
                            control={control}
                            rules={{ required: "URL is required", ...urlRules }}
                            render={({ field, fieldState: { error } }) => (
                                <TextField
                                    {...field}
                                    label="URL"
                                    fullWidth
                                    error={!!error}
                                    helperText={error?.message}
                                />
                            )}
                        />
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
                                    helperText="Current stage of the renewal process"
                                >
                                    <MenuItem value="NONE">No Action Taken</MenuItem>
                                    <MenuItem value="TICKET_CREATED">Ticket Created</MenuItem>
                                    <MenuItem value="ORDERED">Certificate Ordered</MenuItem>
                                    <MenuItem value="PLANNED">Installation Planned</MenuItem>
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
                <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
                    {!isConfirmingDelete ? (
                        <Button
                            color="error"
                            variant="text"
                            onClick={() => setIsConfirmingDelete(true)}
                            disabled={isPending || isDeleting}
                        >
                            Delete
                        </Button>
                    ) : (
                        <Box display="flex" gap={1} alignItems="center">
                            <Typography variant="caption" color="error">
                                Are you sure?
                            </Typography>
                            <Button
                                color="inherit"
                                size="small"
                                onClick={() => setIsConfirmingDelete(false)}
                                disabled={isPending || isDeleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                color="error"
                                variant="contained"
                                size="small"
                                onClick={handleDelete}
                                disabled={isPending || isDeleting}
                            >
                                Confirm
                            </Button>
                        </Box>
                    )}

                    <Box>
                        <Button onClick={onClose} disabled={isPending || isDeleting} sx={{ mr: 1 }}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="contained" disabled={isPending || isDeleting}>
                            Save
                        </Button>
                    </Box>
                </DialogActions>
            </form>
        </Dialog>
    );
}
