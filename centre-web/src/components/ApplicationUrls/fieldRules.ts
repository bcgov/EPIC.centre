import { MAX_LENGTH } from "@/utils/constants";
import { tooLongMessage } from "@/utils/errorUtils";
import { isHttpUrl } from "@/utils/url";

/** Empty passes; add `required` where the URL is mandatory. */
export const urlRules = {
    maxLength: {
        value: MAX_LENGTH.APP_URL,
        message: tooLongMessage("URL", MAX_LENGTH.APP_URL),
    },
    validate: (value: string) =>
        !value.trim() || isHttpUrl(value.trim()) || "Enter a valid http(s) URL",
};

export const ticketReferenceRules = {
    maxLength: {
        value: MAX_LENGTH.TICKET_REFERENCE,
        message: tooLongMessage("Ticket number", MAX_LENGTH.TICKET_REFERENCE),
    },
};
