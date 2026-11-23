import { isAxiosError } from "axios";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

// Marshmallow's errors: a list per field, nested by schema and list index
type FieldErrorTree = { [key: string]: string[] | FieldErrorTree };

type ApiErrorBody = {
  message?: unknown;
  errors?: FieldErrorTree;
};

const getApiErrorBody = (error: unknown): ApiErrorBody | undefined => {
  if (!isAxiosError(error)) return undefined;
  const data = error.response?.data;
  return data && typeof data === "object" ? data : undefined;
};

/** The API's message for most 4xx responses, otherwise the fallback. */
export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (!isAxiosError(error)) return fallback;

  const status = error.response?.status;
  if (status === undefined) {
    return "Unable to reach EPIC.centre. Check your connection and try again.";
  }
  if (status === 401) {
    return "Your session has expired. Refresh the page to sign in again.";
  }
  if (status === 429) {
    return "Too many requests. Wait a minute and try again.";
  }
  // A 5xx body is plain text or internal detail
  if (status >= 500) return fallback;

  const message = getApiErrorBody(error)?.message;
  return typeof message === "string" && message ? message : fallback;
};

const flattenFieldErrors = (
  tree: FieldErrorTree,
  path: string[] = [],
): [string[], string][] =>
  Object.entries(tree).flatMap(([key, value]) => {
    if (Array.isArray(value)) return [[[...path, key], value.join(" ")]];
    if (value && typeof value === "object") {
      return flattenFieldErrors(value, [...path, key]);
    }
    return [];
  });

/**
 * Show the API's field errors on the form; true if any were shown.
 * toFieldName maps a path like ["1", "label"] to a field, or to undefined to skip it.
 */
export const setServerFieldErrors = <T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  toFieldName: (path: string[]) => Path<T> | undefined,
): boolean => {
  const tree = getApiErrorBody(error)?.errors;
  if (!tree || typeof tree !== "object") return false;

  let shown = false;
  flattenFieldErrors(tree).forEach(([path, message]) => {
    const name = toFieldName(path);
    if (name) {
      setError(name, { type: "server", message });
      shown = true;
    }
  });
  return shown;
};

export const tooLongMessage = (field: string, max: number) =>
  `${field} must be ${max} characters or fewer`;
