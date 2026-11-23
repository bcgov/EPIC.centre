import { RenewalStatus } from "@/models/ApplicationUrl";
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
import { notify } from "@/components/Shared/Snackbar/snackbarStore";
import { MAX_LENGTH } from "@/utils/constants";
import {
    getErrorMessage,
    setServerFieldErrors,
    tooLongMessage,
} from "@/utils/errorUtils";
import { ticketReferenceRules, urlRules } from "./fieldRules";

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

const URL_FIELDS = {
    PROD: "prod_url",
    TEST: "test_url",
    DEV: "dev_url",
} as const;

type StandardEnvironment = keyof typeof URL_FIELDS;

// "PROD was" or "PROD and DEV were"
const describeEnvironments = (items: { environment: string }[]) =>
    `${items.map((item) => item.environment).join(" and ")} ${items.length > 1 ? "were" : "was"}`;

export function AddUrlModal({
    open,
    onClose,
    initialAppName = ""
}: {
    open: boolean;
    onClose: () => void;
    initialAppName?: string;
}) {
    const { mutateAsync } = useCreateApplicationUrl();
    const isAddEnvironmentMode = !!initialAppName;
    const {
        control: applicationControl,
        handleSubmit: handleApplicationSubmit,
        reset: resetApplicationForm,
        getValues: getApplicationValues,
        setValue: setApplicationValue,
        setError: setApplicationError,
        clearErrors: clearApplicationErrors,
        formState: { isSubmitting: isSubmittingApplication },
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
        setError: setEnvironmentError,
        formState: { isSubmitting: isSubmittingEnvironment },
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

    const isSubmitting = isAddEnvironmentMode
        ? isSubmittingEnvironment
        : isSubmittingApplication;

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

        const payloads = (Object.keys(URL_FIELDS) as StandardEnvironment[])
            .map((environment) => ({
                ...basePayload,
                environment,
                url: data[URL_FIELDS[environment]].trim(),
            }))
            .filter((payload) => payload.url);

        // One request per environment, so some can fail while others succeed
        const results = await Promise.allSettled(
            payloads.map((payload) => mutateAsync(payload)),
        );
        const added = payloads.filter((_, i) => results[i].status === "fulfilled");
        const failed = payloads.flatMap((payload, i) => {
            const result = results[i];
            return result.status === "rejected"
                ? [{ environment: payload.environment, error: result.reason }]
                : [];
        });

        if (!failed.length) {
            resetApplicationForm();
            onClose();
            return;
        }

        // Clear added URLs so a retry doesn't add them twice
        added.forEach(({ environment }) =>
            setApplicationValue(URL_FIELDS[environment], ""),
        );

        const notOnFields = failed.filter(
            ({ environment, error }) =>
                !setServerFieldErrors(error, setApplicationError, ([field]) => {
                    if (field === "url") return URL_FIELDS[environment];
                    if (field === "app_name" || field === "ticket_reference") return field;
                    return undefined;
                }),
        );
        const reason = notOnFields.length
            ? getErrorMessage(notOnFields[0].error, "Please try again.")
            : "Fix the highlighted fields and try again.";

        if (added.length) {
            notify.error(
                `${describeEnvironments(added)} added, but ${describeEnvironments(failed)} not. ${reason}`,
            );
        } else if (notOnFields.length) {
            notify.error(
                getErrorMessage(
                    notOnFields[0].error,
                    "Unable to add the application. Please try again.",
                ),
            );
        }
    };

    const onSubmitEnvironment = async (data: AddEnvironmentForm) => {
        try {
            await mutateAsync({
                app_name: data.app_name.trim(),
                environment: data.environment.trim().toUpperCase(),
                url: data.url.trim(),
                ticket_reference: data.ticket_reference.trim() || null,
                renewal_status: data.renewal_status,
                renewal_comments: data.renewal_comments.trim() || null,
            });
        } catch (error) {
            const shownOnFields = setServerFieldErrors(
                error,
                setEnvironmentError,
                ([field]) =>
                    field === "environment" || field === "url" || field === "ticket_reference"
                        ? field
                        : undefined,
            );
            if (!shownOnFields) {
                notify.error(
                    getErrorMessage(error, "Unable to add the environment. Please try again."),
                );
            }
            return;
        }
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
                                    rules={{
                                        required: "Environment is required",
                                        maxLength: {
                                            value: MAX_LENGTH.ENVIRONMENT,
                                            message: tooLongMessage("Environment", MAX_LENGTH.ENVIRONMENT),
                                        },
                                    }}
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
                                    rules={{ required: "URL is required", ...urlRules }}
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
                            </>
                        ) : (
                            <>
                                <Typography variant="body2" color="text.secondary">
                                    Creates the standard DEV, TEST, and PROD URL set for a new application.
                                </Typography>
                                <Controller
                                    name="app_name"
                                    control={applicationControl}
                                    rules={{
                                        required: "Application Name is required",
                                        maxLength: {
                                            value: MAX_LENGTH.APP_NAME,
                                            message: tooLongMessage("Application name", MAX_LENGTH.APP_NAME),
                                        },
                                    }}
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
                                    rules={urlRules}
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
                                    rules={urlRules}
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
                                    rules={urlRules}
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
                                    rules={ticketReferenceRules}
                                    render={({ field, fieldState: { error } }) => (
                                        <TextField
                                            {...field}
                                            label="SSL Renewal Ticket # (Optional)"
                                            placeholder="e.g. INFRA-1234"
                                            fullWidth
                                            error={!!error}
                                            helperText={error?.message || "Applied to the initial URL set"}
                                        />
                                    )}
                                />
                            </>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="contained" disabled={isSubmitting}>
                        {isAddEnvironmentMode ? "Add Environment" : "Add Application"}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
