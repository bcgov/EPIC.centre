import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/utils/config", () => ({
  AppConfig: { apiUrl: "http://test.local/api", clientId: "test-client" },
  OidcConfig: { authority: "http://auth.local", client_id: "test-client" },
}));

const { mockRequest, mockAxiosInstance } = vi.hoisted(() => {
  const request = vi.fn();
  return {
    mockRequest: request,
    mockAxiosInstance: {
      defaults: { headers: { common: {} as Record<string, string> } },
      request,
    },
  };
});

vi.mock("axios", () => ({
  default: { create: vi.fn(() => mockAxiosInstance) },
}));

vi.mock("oidc-client-ts", () => ({
  User: { fromStorageString: vi.fn() },
}));

vi.mock("jwt-decode", () => ({ jwtDecode: vi.fn() }));

import { User } from "oidc-client-ts";
import { jwtDecode } from "jwt-decode";
import { centreRequest, getUserRolesFromToken } from "./axiosUtils";

const mockedFromStorageString = vi.mocked(User.fromStorageString);
const mockedJwtDecode = vi.mocked(jwtDecode);

beforeEach(() => {
  mockRequest.mockReset();
  mockedFromStorageString.mockReset();
  mockedJwtDecode.mockReset();
  mockAxiosInstance.defaults.headers.common = {};
  sessionStorage.clear();
});

afterEach(() => {
  sessionStorage.clear();
});

describe("centreRequest auth token attachment", () => {
  it("throws when no OIDC user is stored", async () => {
    await expect(centreRequest({ url: "/thing" })).rejects.toThrow(
      "No access token",
    );
  });

  it("attaches the stored access token as a Bearer header before requesting", async () => {
    sessionStorage.setItem(
      "oidc.user:http://auth.local:test-client",
      "stored-value",
    );
    mockedFromStorageString.mockReturnValue({
      access_token: "abc123",
    } as any);
    mockRequest.mockResolvedValue({ data: { ok: true } });

    await centreRequest({ url: "/thing" });

    expect(mockAxiosInstance.defaults.headers.common.Authorization).toBe(
      "Bearer abc123",
    );
  });
});

describe("centreRequest response handling", () => {
  beforeEach(() => {
    sessionStorage.setItem(
      "oidc.user:http://auth.local:test-client",
      "stored-value",
    );
    mockedFromStorageString.mockReturnValue({ access_token: "abc123" } as any);
  });

  it("unwraps response.data on success", async () => {
    mockRequest.mockResolvedValue({ data: { hello: "world" } });
    const result = await centreRequest({ url: "/thing" });
    expect(result).toEqual({ hello: "world" });
  });

  it("propagates a rejection from the underlying request", async () => {
    mockRequest.mockRejectedValue(new Error("network down"));
    await expect(centreRequest({ url: "/thing" })).rejects.toThrow(
      "network down",
    );
  });
});

describe("getUserRolesFromToken", () => {
  it("returns an empty array with no token", () => {
    expect(getUserRolesFromToken(undefined)).toEqual([]);
  });

  it("returns an empty array when there is no entry for the configured client", () => {
    mockedJwtDecode.mockReturnValue({ resource_access: {} } as any);
    expect(getUserRolesFromToken("token")).toEqual([]);
  });

  it("returns the roles for the configured client", () => {
    mockedJwtDecode.mockReturnValue({
      resource_access: { "test-client": { roles: ["admin"] } },
    } as any);
    expect(getUserRolesFromToken("token")).toEqual(["admin"]);
  });
});
