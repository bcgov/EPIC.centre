import { ThemeProvider } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { User } from "oidc-client-ts";
import { theme } from "@/styles/theme";
import { OidcConfig } from "@/utils/config";
import { ApplicationUrl } from "@/models/ApplicationUrl";
import SnackBarProvider from "../Shared/Snackbar/SnackBarProvider";
import { EditUrlModal } from "./EditUrlModal";

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

const URL_ROW: ApplicationUrl = {
  id: 7,
  app_name: "EPIC Track",
  environment: "PROD",
  url: "https://system.eao.gov.bc.ca/track",
  certificate_id: 2,
  is_active: true,
};

const mountModal = () =>
  cy.mount(
    <QueryClientProvider client={new QueryClient()}>
      <ThemeProvider theme={theme}>
        <EditUrlModal open onClose={cy.stub().as("onClose")} url={URL_ROW} />
        <SnackBarProvider />
      </ThemeProvider>
    </QueryClientProvider>,
  );

const field = (label: string | RegExp) =>
  cy.contains("label", label).parent().find("input");

describe("EditUrlModal", () => {
  beforeEach(signIn);

  it("sends only the URL", () => {
    cy.intercept("PUT", "**/api/application-urls/7", { statusCode: 200, body: URL_ROW }).as("save");
    mountModal();

    field("URL").clear().type(" https://system.eao.gov.bc.ca/track2 ", { delay: 0 });
    cy.contains("button", "Save").click();

    cy.wait("@save").its("request.body").should("deep.equal", {
      url: "https://system.eao.gov.bc.ca/track2",
    });
    cy.get("@onClose").should("have.been.called");
  });

  it("stays open while saving, so a failed save is reported", () => {
    cy.intercept("PUT", "**/api/application-urls/7", {
      statusCode: 500,
      body: "Internal server error",
      delay: 500,
    }).as("save");
    mountModal();

    cy.contains("button", "Save").click();
    cy.get('[role="dialog"]').trigger("keydown", { key: "Escape" });
    cy.get(".MuiBackdrop-root").click({ force: true });
    cy.wait("@save");

    cy.contains("Unable to save the URL. Please try again.").should("be.visible");
    cy.get("@onClose").should("not.have.been.called");
  });
});
