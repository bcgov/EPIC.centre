import { CheckCircle, ContentCopy } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { useState } from "react";

export function CopyToClipboardButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <IconButton size="small" onClick={handleCopy} title="Copy URL">
            {copied ? <CheckCircle fontSize="small" color="success" /> : <ContentCopy fontSize="small" />}
        </IconButton>
    );
}
