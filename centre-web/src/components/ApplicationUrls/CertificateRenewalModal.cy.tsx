import { ThemeProvider } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { User } from "oidc-client-ts";
import { theme } from "@/styles/theme";
import { OidcConfig } from "@/utils/config";
import { useGetSslCertificates } from "@/hooks/api/useApplicationUrls";
import { SslCertificate } from "@/models/ApplicationUrl";
import SnackBarProvider from "../Shared/Snackbar/SnackBarProvider";
import { CertificateRenewalModal } from "./CertificateRenewalModal";

// Requests read their token from the OIDC user in session storage
const signIn = () => {
  const user = new User({
    access_token: "test-token",
    token_type: "Bearer",
    profile: { sub: "test", iss: "", aud: "", exp: 0, iat: 0 },
  });
  sessionStorage.setItem(
    `oidc.user:${OidcConfig.authority}:${OidcConfig.client_id}`,
    user.toStorageString(),
  );
};

const CERTIFICATE: SslCertificate = {
  id: 2,
  origin: "https://system.eao.gov.bc.ca:443",
  host: "system.eao.gov.bc.ca",
  port: 443,
  status: "Error",
  expires_at: "2027-01-11T23:59:59+00:00",
  issuer: "Entrust OV TLS Issuing RSA CA 1",
  check_error: "Timed out connecting",
  last_checked: new Date().toISOString(),
  is_platform_managed: false,
  ticket_reference: null,
  renewal_status: "NONE",
  renewal_comments: null,
};

// Shows the certificate from the query cache by id, as the page does
function Page({ onClose }: { onClose: () => void }) {
  const { data = [] } = useGetSslCertificates();
  const certificate = data.find((cached) => cached.id === CERTIFICATE.id);
  return certificate ? <CertificateRenewalModal certificate={certificate} onClose={onClose} /> : null;
}

const mountPage = () => {
  cy.intercept("GET", "**/api/ssl-certificates", { statusCode: 200, body: [CERTIFICATE] });
  cy.mount(
    <QueryClientProvider client={new QueryClient()}>
      <ThemeProvider theme={theme}>
        <Page onClose={cy.stub().as("onClose")} />
        <SnackBarProvider />
      </ThemeProvider>
    </QueryClientProvider>,
  );
};

const field = (label: string | RegExp) =>
  cy.contains("label", label).parent().find("input, textarea").first();

describe("CertificateRenewalModal", () => {
  beforeEach(signIn);

  it("saves the renewal details on the certificate", () => {
    cy.intercept("PATCH", "**/api/ssl-certificates/2", (req) => {
      req.reply({ statusCode: 200, body: { ...CERTIFICATE, ...req.body } });
    }).as("save");
    mountPage();

    field("SSL Renewal Ticket #").type(" INFRA-12 ", { delay: 0 });
    cy.contains("label", "Renewal Status").parent().click();
    cy.contains("li", "Certificate Ordered").click();
    cy.contains("button", "Save").click();

    cy.wait("@save").its("request.body").should("deep.equal", {
      ticket_reference: "INFRA-12",
      renewal_status: "ORDERED",
      renewal_comments: null,
    });
    cy.get("@onClose").should("have.been.called");
  });

  it("shows the fresh result after Check Now", () => {
    cy.intercept("POST", "**/api/ssl-certificates/2/check", {
      statusCode: 200,
      body: { ...CERTIFICATE, status: "Valid", check_error: null, expires_at: "2028-01-11T23:59:59+00:00" },
    }).as("check");
    mountPage();

    cy.contains("Timed out connecting").should("be.visible");
    cy.contains("button", "Check Now").click();
    cy.wait("@check");

    cy.contains("Timed out connecting").should("not.exist");
    // The test viewport is small, so the dialog has scrolled
    cy.contains("Valid").scrollIntoView().should("be.visible");
    cy.contains("Jan 11, 2028").should("be.visible");
    cy.get("@onClose").should("not.have.been.called");
  });

  it("stays open while saving, so a failed save is reported", () => {
    cy.intercept("PATCH", "**/api/ssl-certificates/2", {
      statusCode: 500,
      body: "Internal server error",
      delay: 500,
    }).as("save");
    mountPage();

    cy.contains("button", "Save").click();
    cy.get('[role="dialog"]').trigger("keydown", { key: "Escape" });
    cy.wait("@save");

    cy.contains("Unable to save the renewal details. Please try again.").should("be.visible");
    cy.get("@onClose").should("not.have.been.called");
  });
});
