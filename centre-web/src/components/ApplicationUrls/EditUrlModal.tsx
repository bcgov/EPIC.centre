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
    Box
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { useState } from "react";

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

    const { control, handleSubmit } = useForm<ApplicationUrl>({
        defaultValues: url,
    });

    const onSubmit = (data: ApplicationUrl) => {
        mutate(data, {
            onSuccess: () => {
                onClose();
            },
        });
    };

    const handleDelete = () => {
        deleteUrl(url.id, {
            onSuccess: () => {
                onClose();
            }
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
                            rules={{ required: "URL is required" }}
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
