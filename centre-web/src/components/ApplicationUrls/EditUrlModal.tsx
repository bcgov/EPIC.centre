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
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { useState } from "react";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { getErrorMessage, setServerFieldErrors } from "@/utils/errorUtils";
import { urlRules } from "./fieldRules";

type EditUrlForm = {
    url: string;
};

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

    const isBusy = isPending || isDeleting;

    const { control, handleSubmit, setError } = useForm<EditUrlForm>({
        defaultValues: { url: url.url },
    });

    // Renewal tracking is on the certificate, in CertificateRenewalModal
    const onSubmit = (data: EditUrlForm) => {
        mutate(
            { id: url.id, url: data.url.trim() },
            {
                onSuccess: () => {
                    onClose();
                },
                onError: (error) => {
                    const shownOnFields = setServerFieldErrors(error, setError, ([field]) =>
                        field === "url" ? field : undefined,
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

    // Stay open while saving: closing unmounts the modal and loses a failed save's error
    return (
        <Dialog open={open} onClose={isBusy ? undefined : onClose} fullWidth maxWidth="sm">
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
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
                    {!isConfirmingDelete ? (
                        <Button
                            color="error"
                            variant="text"
                            onClick={() => setIsConfirmingDelete(true)}
                            disabled={isBusy}
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
                                disabled={isBusy}
                            >
                                Cancel
                            </Button>
                            <Button
                                color="error"
                                variant="contained"
                                size="small"
                                onClick={handleDelete}
                                disabled={isBusy}
                            >
                                Confirm
                            </Button>
                        </Box>
                    )}

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
