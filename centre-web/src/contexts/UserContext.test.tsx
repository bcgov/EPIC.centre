import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAuth } from "react-oidc-context";
import { useGetUser } from "@/hooks/api/useUsers";
import { getUserRolesFromToken } from "@/utils/axiosUtils";
import { useCurrentUser, UserProvider } from "./UserContext";
import { EpicAppName } from "@/models/EpicApp";

vi.mock("react-oidc-context", () => ({ useAuth: vi.fn() }));
vi.mock("@/hooks/api/useUsers", () => ({ useGetUser: vi.fn() }));
vi.mock("@/utils/axiosUtils", () => ({ getUserRolesFromToken: vi.fn() }));

const mockedUseAuth = vi.mocked(useAuth);
const mockedUseGetUser = vi.mocked(useGetUser);
const mockedGetUserRolesFromToken = vi.mocked(getUserRolesFromToken);

const group = (path: string) => ({
  id: "1",
  name: "g",
  path,
  level: 1,
  display_name: "G",
});

const baseUser = (groups: ReturnType<typeof group>[] = []) =>
  ({
    data: { groups },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }) as unknown as ReturnType<typeof useGetUser>;

const authenticated = (accessToken = "token") => ({
  isAuthenticated: true,
  user: {
    profile: { preferred_username: "jdoe" },
    access_token: accessToken,
  },
}) as any;

beforeEach(() => {
  mockedUseAuth.mockReset();
  mockedUseGetUser.mockReset();
  mockedGetUserRolesFromToken.mockReset();
  mockedGetUserRolesFromToken.mockReturnValue([]);
});

describe("useCurrentUser", () => {
  it("throws when used outside of a UserProvider", () => {
    expect(() => renderHook(() => useCurrentUser())).toThrow(
      "useCurrentUser must be used within a UserProvider",
    );
  });
});

describe("UserProvider admin composition", () => {
  it("does not enable the user query when unauthenticated", () => {
    mockedUseAuth.mockReturnValue({ isAuthenticated: false, user: undefined } as any);
    mockedUseGetUser.mockReturnValue(baseUser());

    renderHook(() => useCurrentUser(), { wrapper: UserProvider });

    expect(mockedUseGetUser).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );
  });

  it("DST admin implies general admin", () => {
    mockedUseAuth.mockReturnValue(authenticated());
    mockedUseGetUser.mockReturnValue(baseUser([group("/CENTRE/SUPER_USER")]));

    const { result } = renderHook(() => useCurrentUser(), { wrapper: UserProvider });

    expect(result.current.isDstAdmin).toBe(true);
    expect(result.current.isAdmin).toBe(true);
  });

  it("admin of a non-DST app is isAdmin but not isDstAdmin", () => {
    mockedUseAuth.mockReturnValue(authenticated());
    mockedUseGetUser.mockReturnValue(baseUser([group("/TRACK/INSTANCE_ADMIN")]));

    const { result } = renderHook(() => useCurrentUser(), { wrapper: UserProvider });

    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isDstAdmin).toBe(false);
  });

  it("no admin groups means neither isAdmin nor isDstAdmin", () => {
    mockedUseAuth.mockReturnValue(authenticated());
    mockedUseGetUser.mockReturnValue(baseUser([group("/TRACK/VIEWER")]));

    const { result } = renderHook(() => useCurrentUser(), { wrapper: UserProvider });

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isDstAdmin).toBe(false);
  });

  it("edit_app_url grants both manage and view application-url permissions", () => {
    mockedUseAuth.mockReturnValue(authenticated());
    mockedUseGetUser.mockReturnValue(baseUser());
    mockedGetUserRolesFromToken.mockReturnValue(["edit_app_url"]);

    const { result } = renderHook(() => useCurrentUser(), { wrapper: UserProvider });

    expect(result.current.canManageApplicationUrls).toBe(true);
    expect(result.current.canViewApplicationUrls).toBe(true);
  });

  it("view_ssl_info alone grants view but not manage", () => {
    mockedUseAuth.mockReturnValue(authenticated());
    mockedUseGetUser.mockReturnValue(baseUser());
    mockedGetUserRolesFromToken.mockReturnValue(["view_ssl_info"]);

    const { result } = renderHook(() => useCurrentUser(), { wrapper: UserProvider });

    expect(result.current.canViewApplicationUrls).toBe(true);
    expect(result.current.canManageApplicationUrls).toBe(false);
  });

  it("neither role grants no application-url permissions", () => {
    mockedUseAuth.mockReturnValue(authenticated());
    mockedUseGetUser.mockReturnValue(baseUser());
    mockedGetUserRolesFromToken.mockReturnValue([]);

    const { result } = renderHook(() => useCurrentUser(), { wrapper: UserProvider });

    expect(result.current.canViewApplicationUrls).toBe(false);
    expect(result.current.canManageApplicationUrls).toBe(false);
  });

  it("ai_search_user role sets isAISearchUser", () => {
    mockedUseAuth.mockReturnValue(authenticated());
    mockedUseGetUser.mockReturnValue(baseUser());
    mockedGetUserRolesFromToken.mockReturnValue(["ai_search_user"]);

    const { result } = renderHook(() => useCurrentUser(), { wrapper: UserProvider });

    expect(result.current.isAISearchUser).toBe(true);
  });

  it("no access_token means no roles are parsed and nothing crashes", () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { profile: { preferred_username: "jdoe" }, access_token: undefined },
    } as any);
    mockedUseGetUser.mockReturnValue(baseUser());

    const { result } = renderHook(() => useCurrentUser(), { wrapper: UserProvider });

    expect(result.current.isAISearchUser).toBe(false);
    expect(result.current.canViewApplicationUrls).toBe(false);
    expect(result.current.canManageApplicationUrls).toBe(false);
    expect(mockedGetUserRolesFromToken).not.toHaveBeenCalled();
  });

  it("isAdminOfApp reflects the specific app queried, not just any admin status", () => {
    mockedUseAuth.mockReturnValue(authenticated());
    mockedUseGetUser.mockReturnValue(baseUser([group("/TRACK/INSTANCE_ADMIN")]));

    const { result } = renderHook(() => useCurrentUser(), { wrapper: UserProvider });

    expect(result.current.isAdminOfApp(EpicAppName.EPIC_TRACK)).toBe(true);
    expect(result.current.isAdminOfApp(EpicAppName.EPIC_SUBMIT)).toBe(false);
  });
});
