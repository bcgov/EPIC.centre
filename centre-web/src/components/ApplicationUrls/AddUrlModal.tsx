import { CreateApplicationUrlPayload, RenewalStatus } from "@/models/ApplicationUrl";
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
    Typography
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";

type AddApplicationForm = {
    app_name: string;
    ticket_reference: string;
    prod_url: string;
    test_url: string;
    dev_url: string;
};

type AddEnvironmentForm = {
    app_name: string;
    environment: string;
    url: string;
    ticket_reference: string;
    renewal_status: Exclude<RenewalStatus, null>;
    renewal_comments: string;
};

const isValidHttpUrl = (value: string) => {
    if (!value.trim()) {
        return true;
    }

    try {
        const parsed = new URL(value);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        return false;
    }
};

export function AddUrlModal({
    open,
    onClose,
    initialAppName = ""
}: {
    open: boolean;
    onClose: () => void;
    initialAppName?: string;
}) {
    const { mutateAsync, isPending } = useCreateApplicationUrl();
    const isAddEnvironmentMode = !!initialAppName;
    const {
        control: applicationControl,
        handleSubmit: handleApplicationSubmit,
        reset: resetApplicationForm,
        getValues: getApplicationValues,
        setError: setApplicationError,
        clearErrors: clearApplicationErrors,
    } = useForm<AddApplicationForm>({
        defaultValues: {
            app_name: "",
            ticket_reference: "",
            prod_url: "",
            test_url: "",
            dev_url: "",
        },
    });
    const {
        control: environmentControl,
        handleSubmit: handleEnvironmentSubmit,
        reset: resetEnvironmentForm,
    } = useForm<AddEnvironmentForm>({
        defaultValues: {
            app_name: initialAppName,
            environment: "",
            url: "",
            ticket_reference: "",
            renewal_status: "NONE",
            renewal_comments: "",
        },
    });

    useEffect(() => {
        resetEnvironmentForm({
            app_name: initialAppName,
            environment: "",
            url: "",
            ticket_reference: "",
            renewal_status: "NONE",
            renewal_comments: "",
        });
    }, [initialAppName, resetEnvironmentForm]);

    const onSubmitApplication = async (data: AddApplicationForm) => {
        const normalizedAppName = data.app_name.trim();
        const enteredUrls = [data.prod_url, data.test_url, data.dev_url].filter(
            (url) => url.trim(),
        );

        if (!enteredUrls.length) {
            const message = "Enter at least one environment URL";
            setApplicationError("prod_url", { type: "manual", message });
            setApplicationError("test_url", { type: "manual", message });
            setApplicationError("dev_url", { type: "manual", message });
            return;
        }

        const basePayload = {
            app_name: normalizedAppName,
            ticket_reference: data.ticket_reference.trim() || null,
        };

        const payloads: CreateApplicationUrlPayload[] = [
            { environment: "PROD", url: data.prod_url.trim() },
            { environment: "TEST", url: data.test_url.trim() },
            { environment: "DEV", url: data.dev_url.trim() },
        ]
            .filter((item) => item.url)
            .map((item) => ({ ...basePayload, ...item }));

        await Promise.all(payloads.map((payload) => mutateAsync(payload)));
        resetApplicationForm();
        onClose();
    };

    const onSubmitEnvironment = async (data: AddEnvironmentForm) => {
        await mutateAsync({
            app_name: data.app_name.trim(),
            environment: data.environment.trim().toUpperCase(),
            url: data.url.trim(),
            ticket_reference: data.ticket_reference.trim() || null,
            renewal_status: data.renewal_status,
            renewal_comments: data.renewal_comments.trim() || null,
        });
        resetEnvironmentForm({
            app_name: initialAppName,
            environment: "",
            url: "",
            ticket_reference: "",
            renewal_status: "NONE",
            renewal_comments: "",
        });
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>{isAddEnvironmentMode ? "Add Environment" : "Add Application"}</DialogTitle>
            <form onSubmit={isAddEnvironmentMode ? handleEnvironmentSubmit(onSubmitEnvironment) : handleApplicationSubmit(onSubmitApplication)}>
                <DialogContent>
                    <Stack spacing={3}>
                        {isAddEnvironmentMode ? (
                            <>
                                <Controller
                                    name="app_name"
                                    control={environmentControl}
                                    rules={{ required: "Application Name is required" }}
                                    render={({ field, fieldState: { error } }) => (
                                        <TextField
                                            {...field}
                                            label="Application Name"
                                            fullWidth
                                            error={!!error}
                                            helperText={error?.message}
                                            disabled
                                        />
                                    )}
                                />
                                <Controller
                                    name="environment"
                                    control={environmentControl}
                                    rules={{ required: "Environment is required" }}
                                    render={({ field, fieldState: { error } }) => (
                                        <TextField
                                            {...field}
                                            label="Environment"
                                            fullWidth
                                            error={!!error}
                                            helperText={error?.message || "Examples: DEMO, UAT, TRAINING"}
                                            placeholder="DEMO"
                                        />
                                    )}
                                />
                                <Controller
                                    name="url"
                                    control={environmentControl}
                                    rules={{
                                        required: "URL is required",
                                        validate: (value) =>
                                            isValidHttpUrl(value) || "Enter a valid http(s) URL",
                                    }}
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
                                <Controller
                                    name="ticket_reference"
                                    control={environmentControl}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="SSL Renewal Ticket # (Optional)"
                                            placeholder="e.g. INFRA-1234"
                                            fullWidth
                                            helperText="Reference for tracking external renewal work"
                                        />
                                    )}
                                />
                            </>
                        ) : (
                            <>
                                <Typography variant="body2" color="text.secondary">
                                    Creates the standard DEV, TEST, and PROD URL set for a new application.
                                </Typography>
                                <Controller
                                    name="app_name"
                                    control={applicationControl}
                                    rules={{ required: "Application Name is required" }}
                                    render={({ field, fieldState: { error } }) => (
                                        <TextField
                                            {...field}
                                            label="Application Name"
                                            fullWidth
                                            error={!!error}
                                            helperText={error?.message}
                                        />
                                    )}
                                />
                                <Controller
                                    name="prod_url"
                                    control={applicationControl}
                                    rules={{
                                        validate: (value) =>
                                            isValidHttpUrl(value) || "Enter a valid http(s) URL",
                                    }}
                                    render={({ field, fieldState: { error } }) => (
                                        <TextField
                                            {...field}
                                            label="PROD URL"
                                            fullWidth
                                            error={!!error}
                                            helperText={error?.message}
                                            placeholder="https://app.example.com"
                                            onChange={(event) => {
                                                field.onChange(event);
                                                const values = getApplicationValues();
                                                if (
                                                    event.target.value.trim() ||
                                                    values.test_url.trim() ||
                                                    values.dev_url.trim()
                                                ) {
                                                    clearApplicationErrors(["prod_url", "test_url", "dev_url"]);
                                                }
                                            }}
                                        />
                                    )}
                                />
                                <Controller
                                    name="test_url"
                                    control={applicationControl}
                                    rules={{
                                        validate: (value) =>
                                            isValidHttpUrl(value) || "Enter a valid http(s) URL",
                                    }}
                                    render={({ field, fieldState: { error } }) => (
                                        <TextField
                                            {...field}
                                            label="TEST URL"
                                            fullWidth
                                            error={!!error}
                                            helperText={error?.message}
                                            placeholder="https://app-test.example.com"
                                            onChange={(event) => {
                                                field.onChange(event);
                                                const values = getApplicationValues();
                                                if (
                                                    values.prod_url.trim() ||
                                                    event.target.value.trim() ||
                                                    values.dev_url.trim()
                                                ) {
                                                    clearApplicationErrors(["prod_url", "test_url", "dev_url"]);
                                                }
                                            }}
                                        />
                                    )}
                                />
                                <Controller
                                    name="dev_url"
                                    control={applicationControl}
                                    rules={{
                                        validate: (value) =>
                                            isValidHttpUrl(value) || "Enter a valid http(s) URL",
                                    }}
                                    render={({ field, fieldState: { error } }) => (
                                        <TextField
                                            {...field}
                                            label="DEV URL"
                                            fullWidth
                                            error={!!error}
                                            helperText={error?.message}
                                            placeholder="https://app-dev.example.com"
                                            onChange={(event) => {
                                                field.onChange(event);
                                                const values = getApplicationValues();
                                                if (
                                                    values.prod_url.trim() ||
                                                    values.test_url.trim() ||
                                                    event.target.value.trim()
                                                ) {
                                                    clearApplicationErrors(["prod_url", "test_url", "dev_url"]);
                                                }
                                            }}
                                        />
                                    )}
                                />
                                <Controller
                                    name="ticket_reference"
                                    control={applicationControl}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            label="SSL Renewal Ticket # (Optional)"
                                            placeholder="e.g. INFRA-1234"
                                            fullWidth
                                            helperText="Applied to the initial URL set"
                                        />
                                    )}
                                />
                            </>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="contained" disabled={isPending}>
                        {isAddEnvironmentMode ? "Add Environment" : "Add Application"}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
