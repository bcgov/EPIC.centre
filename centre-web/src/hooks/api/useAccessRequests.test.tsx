import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { centreRequest } from "@/utils/axiosUtils";
import {
  useAccessRequests,
  useUpdateAccessRequest,
  useUserAccessRequests,
} from "./useAccessRequests";
import { QUERY_KEY } from "./constants";

vi.mock("@/utils/axiosUtils", () => ({ centreRequest: vi.fn() }));

const mockedCentreRequest = vi.mocked(centreRequest);

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { wrapper, invalidateSpy };
}

beforeEach(() => {
  mockedCentreRequest.mockReset();
});

describe("useAccessRequests query key composition", () => {
  it("produces distinct cache keys for different params", async () => {
    mockedCentreRequest.mockResolvedValue([] as any);
    const { wrapper } = makeWrapper();

    const { result: resultA } = renderHook(
      () => useAccessRequests({ params: { status: "PENDING" } }),
      { wrapper },
    );
    const { result: resultB } = renderHook(
      () => useAccessRequests({ params: { status: "APPROVED" } }),
      { wrapper },
    );

    await waitFor(() => expect(resultA.current.isSuccess).toBe(true));
    await waitFor(() => expect(resultB.current.isSuccess).toBe(true));

    expect(mockedCentreRequest).toHaveBeenCalledTimes(2);
  });
});

describe("useUserAccessRequests", () => {
  it("hits the per-user endpoint with the status param", async () => {
    mockedCentreRequest.mockResolvedValue([] as any);
    const { wrapper } = makeWrapper();

    const { result } = renderHook(
      () => useUserAccessRequests({ user_auth_guid: "guid-1", status: "PENDING" }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedCentreRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "access-requests/users/guid-1",
        params: { status: "PENDING" },
      }),
    );
  });
});

describe("useUpdateAccessRequest onSuccess chaining", () => {
  it("invalidates the access-requests cache when no caller onSuccess is given", async () => {
    mockedCentreRequest.mockResolvedValue({ id: 1, status: "APPROVED" } as any);
    const { wrapper, invalidateSpy } = makeWrapper();

    const { result } = renderHook(() => useUpdateAccessRequest(), { wrapper });
    result.current.mutate({ access_request_id: 1, status: "APPROVED" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.ACCESS_REQUESTS],
    });
  });

  it(
    "BUG: a caller-supplied onSuccess in options replaces the wrapper's onSuccess " +
      "entirely (object spread order), so cache invalidation is silently skipped",
    async () => {
      // useUpdateAccessRequest builds { mutationFn, onSuccess: wrapperFn, ...options }.
      // Because `options` is spread last, options.onSuccess overwrites wrapperFn outright
      // rather than being called from within it - despite the code comment implying
      // the wrapper's invalidation always runs first. This test pins that actual,
      // likely-unintended behavior so a future fix (e.g. merging via a call to the
      // wrapper first) is a deliberate, visible change to this assertion.
      mockedCentreRequest.mockResolvedValue({ id: 1, status: "APPROVED" } as any);
      const { wrapper, invalidateSpy } = makeWrapper();
      const onSuccess = vi.fn();

      const { result } = renderHook(() => useUpdateAccessRequest({ onSuccess }), {
        wrapper,
      });
      result.current.mutate({ access_request_id: 1, status: "APPROVED" });

      await waitFor(() => expect(onSuccess).toHaveBeenCalled());
      expect(onSuccess).toHaveBeenCalledWith(
        { id: 1, status: "APPROVED" },
        { access_request_id: 1, status: "APPROVED" },
        undefined,
      );
      expect(invalidateSpy).not.toHaveBeenCalled();
    },
  );
});
