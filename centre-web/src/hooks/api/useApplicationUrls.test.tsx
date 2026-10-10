import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { centreRequest } from "@/utils/axiosUtils";
import {
  useCreateApplicationUrl,
  useDeleteApplicationUrl,
  useGetApplicationUrls,
  useUpdateApplicationUrl,
} from "./useApplicationUrls";
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

describe("useGetApplicationUrls", () => {
  it("requests the application-urls endpoint and exposes the result", async () => {
    mockedCentreRequest.mockResolvedValue([{ id: 1 }] as any);
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => useGetApplicationUrls(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedCentreRequest).toHaveBeenCalledWith(
      expect.objectContaining({ url: "application-urls" }),
    );
    expect(result.current.data).toEqual([{ id: 1 }]);
  });
});

describe("mutation cache invalidation", () => {
  it("useCreateApplicationUrl invalidates the application-urls query on success", async () => {
    mockedCentreRequest.mockResolvedValue({ id: 1 } as any);
    const { wrapper, invalidateSpy } = makeWrapper();

    const { result } = renderHook(() => useCreateApplicationUrl(), { wrapper });
    result.current.mutate({ app_name: "a", environment: "dev", url: "https://x.com" } as any);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.APPLICATION_URLS],
    });
  });

  it("useUpdateApplicationUrl invalidates the application-urls query on success", async () => {
    mockedCentreRequest.mockResolvedValue({ id: 1 } as any);
    const { wrapper, invalidateSpy } = makeWrapper();

    const { result } = renderHook(() => useUpdateApplicationUrl(), { wrapper });
    result.current.mutate({ id: 1 } as any);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.APPLICATION_URLS],
    });
  });

  it("useDeleteApplicationUrl invalidates the application-urls query on success", async () => {
    mockedCentreRequest.mockResolvedValue(undefined as any);
    const { wrapper, invalidateSpy } = makeWrapper();

    const { result } = renderHook(() => useDeleteApplicationUrl(), { wrapper });
    result.current.mutate(1);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.APPLICATION_URLS],
    });
  });
});
