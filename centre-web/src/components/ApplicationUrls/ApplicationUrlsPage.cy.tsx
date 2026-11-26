import { ThemeProvider } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { User } from "oidc-client-ts";
import { AuthProvider, useAuth } from "react-oidc-context";
import dayjs from "dayjs";
import { theme } from "@/styles/theme";
import { AppConfig, OidcConfig } from "@/utils/config";
import { UserProvider } from "@/contexts/UserContext";
import { ApplicationUrl, SslCertificate } from "@/models/ApplicationUrl";
import { Route } from "@/routes/_authenticated/application-urls";
import SnackBarProvider from "../Shared/Snackbar/SnackBarProvider";

const ApplicationUrlsPage = Route.options.component!;

// Waits for the stored sign-in, as the _authenticated layout does in the app
function SignedIn({ children }: { children: JSX.Element }) {
  return useAuth().isLoading ? null : children;
}

// The browser reads roles from the token payload without checking its signature
const base64Url = (value: object) =>
  btoa(JSON.stringify(value)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");

const signIn = (roles: string[]) => {
  const accessToken = [
    base64Url({ alg: "none", typ: "JWT" }),
    base64Url({ preferred_username: "editor@idir", resource_access: { [String(AppConfig.clientId)]: { roles } } }),
    "signature",
  ].join(".");
  const user = new User({
    access_token: accessToken,
    token_type: "Bearer",
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    profile: { sub: "editor", iss: "", aud: "", exp: 0, iat: 0, preferred_username: "editor@idir" },
  });
  sessionStorage.setItem(`oidc.user:${OidcConfig.authority}:${OidcConfig.client_id}`, user.toStorageString());
};

const certificate = (id: number, host: string, fields: Partial<SslCertificate> = {}): SslCertificate => ({
  id,
  origin: `https://${host}:443`,
  host,
  port: 443,
  status: "Valid",
  expires_at: dayjs().add(124, "day").toISOString(),
  issuer: "Entrust OV TLS Issuing RSA CA 1",
  check_error: null,
  last_checked: dayjs().subtract(2, "hour").toISOString(),
  is_platform_managed: false,
  ticket_reference: null,
  renewal_status: "NONE",
  renewal_comments: null,
  ...fields,
});

const SYSTEM = certificate(1, "system.eao.gov.bc.ca", {
  status: "Expiring Soon",
  expires_at: dayjs().add(48, "day").toISOString(),
});
const ENGAGE = certificate(2, "engage.eao.gov.bc.ca");
const PLATFORM = certificate(3, "eao-dev.apps.gold.devops.gov.bc.ca", { is_platform_managed: true });

const row = (id: number, app_name: string, environment: string, url: string, certificate_id: number | null) =>
  ({ id, app_name, environment, url, certificate_id, is_active: true }) as ApplicationUrl;

const URLS = [
  row(1, "EPIC Centre", "PROD", "https://system.eao.gov.bc.ca/", SYSTEM.id),
  row(2, "EPIC Centre", "DEV", "https://eao-dev.apps.gold.devops.gov.bc.ca", PLATFORM.id),
  row(3, "EPIC Engage", "PROD", "https://engage.eao.gov.bc.ca", ENGAGE.id),
  row(4, "EPIC Track", "PROD", "https://system.eao.gov.bc.ca/track", SYSTEM.id),
  row(5, "Old App", "DEMO", "http://old.example.com", null),
];

const mountPage = ({ roles = ["edit_app_url"], certificates = [SYSTEM, ENGAGE, PLATFORM] } = {}) => {
  signIn(roles);
  cy.intercept("GET", "**/api/users/username/*", { statusCode: 200, body: { username: "editor@idir", groups: [] } });
  cy.intercept("GET", "**/api/admin-config/group-paths", { statusCode: 200, body: {} });
  cy.intercept("GET", "**/api/application-urls", { statusCode: 200, body: URLS });
  cy.intercept("GET", "**/api/ssl-certificates", { statusCode: 200, body: certificates });
  cy.viewport(1400, 900);
  cy.mount(
    <QueryClientProvider client={new QueryClient()}>
      <ThemeProvider theme={theme}>
        <AuthProvider {...OidcConfig}>
          <SignedIn>
            <UserProvider>
              <ApplicationUrlsPage />
            </UserProvider>
          </SignedIn>
        </AuthProvider>
        <SnackBarProvider />
      </ThemeProvider>
    </QueryClientProvider>,
  );
  cy.contains("h1", "Application URLs & SSL").should("be.visible");
};

const appNames = () => cy.get("h6.MuiTypography-subtitle2").filter((_, el) => /^(EPIC|Old)/.test(el.innerText));

describe("Application URLs page", () => {
  it("lists apps most urgent first and counts each certificate once", () => {
    mountPage();

    appNames().then((names) =>
      expect([...names].map((el) => el.innerText)).to.deep.equal(["EPIC Centre", "EPIC Track", "EPIC Engage", "Old App"]),
    );
    cy.contains("Expiring Soon").parents(".MuiPaper-root").first().should("contain", "1");
    // Problem cards only show when their count is above 0
    cy.contains("Needs Attention").should("not.exist");
    cy.contains("p", "Managed by OpenShift Platform").parent().parent().should("contain", "1");
    cy.contains("Not HTTPS").should("be.visible");
    cy.contains("SSL Inherited from EPIC Centre PROD (system.eao.gov.bc.ca)").should("be.visible");
    cy.get('[role="alert"]').should("not.exist");
  });

  it("shows one calm card naming the next expiry when every certificate is valid", () => {
    const valid = { ...SYSTEM, status: "Valid" as const };
    mountPage({ certificates: [valid, ENGAGE, PLATFORM] });

    cy.contains("All 2 valid").should("be.visible");
    cy.contains(`Next: system.eao.gov.bc.ca · ${dayjs(valid.expires_at).format("MMM D")} · in 48 days`).should("be.visible");
    cy.contains("Expiring Soon").should("not.exist");
    cy.contains("Needs Attention").should("not.exist");
  });

  it("doesn't call certificates valid before they're checked", () => {
    const unchecked = { status: "Unknown" as const, expires_at: null, last_checked: null };
    mountPage({ certificates: [{ ...SYSTEM, ...unchecked }, { ...ENGAGE, ...unchecked }, PLATFORM] });

    cy.contains("2 not checked yet").should("be.visible");
    cy.contains(/All \d+ valid/).should("not.exist");
  });

  it("lists only the certificates staff renew", () => {
    mountPage();

    cy.contains("button", "Certificates We Manage (2)").click();
    cy.contains("system.eao.gov.bc.ca").should("be.visible");
    cy.contains("engage.eao.gov.bc.ca").should("be.visible");
    cy.contains("eao-dev.apps.gold.devops.gov.bc.ca").should("not.exist");
  });

  it("unchecks a custom environment on the first click", () => {
    mountPage();

    cy.contains("label", "DEMO").click();
    cy.contains("Old App").should("not.exist");
  });

  it("clears a filter hiding the row View Routes goes to, and highlights it", () => {
    mountPage();
    cy.get('input[placeholder="Search applications or URLs..."]').type("engage", { delay: 0 });
    cy.contains("EPIC Centre").should("not.exist");

    cy.contains("button", "Certificates We Manage").click();
    cy.contains("system.eao.gov.bc.ca").parents(".MuiPaper-root").first().contains("button", "View Routes").click();

    cy.get('input[placeholder="Search applications or URLs..."]').should("have.value", "");
    cy.get("#app-url-row-1").should("be.visible")
      .and("have.css", "box-shadow").and("contain", "rgba(29, 78, 216, 0.2)");
  });

  it("collapses an application from its top bar, but not from Add New Environment", () => {
    mountPage();

    cy.contains("h6", "EPIC Centre").click();
    cy.get("#app-url-row-1").should("not.be.visible");
    cy.get("#app-url-row-2").should("not.be.visible");
    cy.get("#app-url-row-3").should("be.visible");

    cy.contains("h6", "EPIC Engage").parents(".MuiPaper-root").first().contains("button", "Add New Environment").click();
    cy.get('button[aria-label="Collapse EPIC Engage"]').should("have.attr", "aria-expanded", "true");
    cy.get("body").type("{esc}");

    // The chevron is a real button, so keyboard and screen reader users can expand it too
    cy.get('button[aria-label="Expand EPIC Centre"]').should("have.attr", "aria-expanded", "false").click();
    cy.get("#app-url-row-1").should("be.visible");
  });

  it("expands a collapsed application when View Routes goes to one of its rows", () => {
    mountPage();
    cy.contains("h6", "EPIC Centre").click();
    cy.get("#app-url-row-1").should("not.be.visible");

    cy.contains("button", "Certificates We Manage").click();
    cy.contains("system.eao.gov.bc.ca").parents(".MuiPaper-root").first().contains("button", "View Routes").click();

    cy.get("#app-url-row-1").should("be.visible");
  });

  it("opens a certificate's renewal details from its card", () => {
    mountPage();

    cy.contains("button", "Certificates We Manage").click();
    cy.contains("system.eao.gov.bc.ca").parents(".MuiPaper-root").first().contains("button", /^Renewal$/).click();

    cy.contains("Certificate Renewal").should("be.visible");
    cy.get('[role="dialog"]').should("contain", "system.eao.gov.bc.ca").and("contain", "Expiring Soon");
  });

  it("hides editing from viewers", () => {
    mountPage({ roles: ["view_ssl_info"] });

    cy.contains("button", "Add Application").should("not.exist");
    cy.contains("button", /^Renewal$/).should("not.exist");
  });

  it("warns when the daily check seems to have stopped", () => {
    const stale = { last_checked: dayjs().subtract(3, "day").toISOString() };
    mountPage({ certificates: [{ ...SYSTEM, ...stale }, { ...ENGAGE, ...stale }, { ...PLATFORM, ...stale }] });

    cy.get('[role="alert"]').should("contain", "last checked 3 days ago");
  });
});
