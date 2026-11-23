import { AxiosError, AxiosHeaders } from "axios";
import { getErrorMessage, setServerFieldErrors } from "./errorUtils";

const FALLBACK = "Unable to save. Please try again.";

const apiError = (status: number, data: unknown) =>
  new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
    status,
    statusText: "",
    data,
    headers: {},
    config: { headers: new AxiosHeaders() },
  });

describe("getErrorMessage", () => {
  it("uses the API's message for a 4xx", () => {
    expect(getErrorMessage(apiError(400, { message: "URL not found" }), FALLBACK)).to.equal(
      "URL not found",
    );
  });

  it("falls back when a 4xx has no message", () => {
    expect(getErrorMessage(apiError(404, "Not Found"), FALLBACK)).to.equal(FALLBACK);
  });

  it("hides a 5xx body behind the fallback", () => {
    const error = apiError(500, { message: "Error updating settings: KeyError 'x'" });

    expect(getErrorMessage(error, FALLBACK)).to.equal(FALLBACK);
  });

  it("explains a rate limit instead of showing the limit", () => {
    const error = apiError(429, { message: "5 per 1 minute" });

    expect(getErrorMessage(error, FALLBACK)).to.equal(
      "Too many requests. Wait a minute and try again.",
    );
  });

  it("explains an expired session", () => {
    expect(getErrorMessage(apiError(401, {}), FALLBACK)).to.match(/session has expired/);
  });

  it("explains a request that got no response", () => {
    const error = new AxiosError("Network Error", "ERR_NETWORK");

    expect(getErrorMessage(error, FALLBACK)).to.match(/Unable to reach EPIC.centre/);
  });

  it("falls back for an error that isn't from a request", () => {
    expect(getErrorMessage(new Error("No access token"), FALLBACK)).to.equal(FALLBACK);
  });
});

describe("setServerFieldErrors", () => {
  it("puts nested errors on the fields they map to", () => {
    const setError = cy.stub();
    const error = apiError(400, {
      message: "Invalid bookmarks",
      errors: { "1": { label: ["Longer than maximum length 100."] } },
    });

    const shown = setServerFieldErrors(error, setError, ([index, field]) =>
      field === "label" ? (`bookmarks.${Number(index)}.label` as const) : undefined,
    );

    expect(shown).to.equal(true);
    expect(setError).to.have.been.calledOnceWith("bookmarks.1.label", {
      type: "server",
      message: "Longer than maximum length 100.",
    });
  });

  it("reports nothing shown when no error maps to a field", () => {
    const setError = cy.stub();
    const error = apiError(400, { errors: { _schema: ["Invalid input."] } });

    expect(setServerFieldErrors(error, setError, () => undefined)).to.equal(false);
    expect(setError).not.to.have.been.called;
  });

  it("reports nothing shown when the API sent no field errors", () => {
    const setError = cy.stub();

    expect(
      setServerFieldErrors(apiError(403, { message: "Access denied" }), setError, (path) =>
        path.join("."),
      ),
    ).to.equal(false);
  });
});
