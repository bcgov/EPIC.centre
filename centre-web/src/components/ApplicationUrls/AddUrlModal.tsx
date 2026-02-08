import { ApplicationUrl } from "@/models/ApplicationUrl";
import { useCreateApplicationUrl } from "@/hooks/api/useApplicationUrls";
import { useEffect } from "react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    TextField,
    MenuItem
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";

export function AddUrlModal({
    open,
    onClose,
    initialAppName = ""
}: {
    open: boolean;
    onClose: () => void;
    initialAppName?: string;
}) {
    const { mutate, isPending } = useCreateApplicationUrl();
    const { control, handleSubmit, reset } = useForm<Omit<ApplicationUrl, 'id' | 'ssl_status' | 'ssl_expiry' | 'last_checked' | 'is_active'>>({
        defaultValues: {
            app_name: initialAppName,
            environment: "PROD",
            url: ""
        },
    });

    // Reset form when initialAppName changes (e.g. opening modal for different app)
    useEffect(() => {
        reset({
            app_name: initialAppName,
            environment: "PROD",
            url: ""
        });
    }, [initialAppName, reset]);

    const onSubmit = (data: Omit<ApplicationUrl, 'id' | 'ssl_status' | 'ssl_expiry' | 'last_checked' | 'is_active'>) => {
        mutate(data as any, { // TODO: Fix type definition to be cleaner
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Add New Application URL</DialogTitle>
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogContent>
                    <Stack spacing={3}>
                        <Controller
                            name="app_name"
                            control={control}
                            rules={{ required: "Application Name is required" }}
                            render={({ field, fieldState: { error } }) => (
                                <TextField
                                    {...field}
                                    label="Application Name"
                                    fullWidth
                                    error={!!error}
                                    helperText={error?.message}
                                    disabled={!!initialAppName}
                                />
                            )}
                        />
                        <Controller
                            name="environment"
                            control={control}
                            rules={{ required: "Environment is required" }}
                            render={({ field, fieldState: { error } }) => (
                                <TextField
                                    {...field}
                                    select
                                    label="Environment"
                                    fullWidth
                                    error={!!error}
                                    helperText={error?.message}
                                >
                                    {['PROD', 'TEST', 'DEV', 'Other'].map((option) => (
                                        <MenuItem key={option} value={option}>
                                            {option}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />
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
                                    placeholder="https://example.com"
                                />
                            )}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="contained" disabled={isPending}>
                        Add URL
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
