import { CheckCircle, ContentCopy } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { useEffect, useState } from "react";
import { notify } from "@/components/Shared/Snackbar/snackbarStore";

export function CopyToClipboardButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!copied) return;
        const timer = window.setTimeout(() => setCopied(false), 2000);
        return () => window.clearTimeout(timer);
    }, [copied]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
        } catch {
            notify.error("Couldn't copy the URL. Select it and copy it instead.");
        }
    };

    return (
        <IconButton size="small" onClick={handleCopy} title="Copy URL">
            {copied ? <CheckCircle fontSize="small" color="success" /> : <ContentCopy fontSize="small" />}
        </IconButton>
    );
}
