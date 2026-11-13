/** True if value is an absolute http(s) URL, so it is safe to use as a link target. */
export const isHttpUrl = (value?: string | null): value is string => {
  if (!value) return false;
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
};
