import { ThemeProvider } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { User } from "oidc-client-ts";
import { theme } from "@/styles/theme";
import { OidcConfig } from "@/utils/config";
import SnackBarProvider from "../Shared/Snackbar/SnackBarProvider";
import { AddUrlModal } from "./AddUrlModal";

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

const mountModal = (initialAppName = "") =>
  cy.mount(
    <QueryClientProvider client={new QueryClient()}>
      <ThemeProvider theme={theme}>
        <AddUrlModal
          open
          onClose={cy.stub().as("onClose")}
          initialAppName={initialAppName}
        />
        <SnackBarProvider />
      </ThemeProvider>
    </QueryClientProvider>,
  );

const field = (label: string | RegExp) =>
  cy.contains("label", label).parent().find("input");

describe("AddUrlModal", () => {
  beforeEach(signIn);

  it("keeps only the URLs that weren't added when some environments fail", () => {
    cy.intercept("POST", "**/api/application-urls", (req) => {
      if (req.body.environment === "TEST") {
        req.reply({ statusCode: 500, body: "Internal server error" });
      } else {
        req.reply({ statusCode: 201, body: { id: 1, ...req.body } });
      }
    });
    mountModal();

    field("Application Name").type("Test App", { delay: 0 });
    field("PROD URL").type("https://app.example.com", { delay: 0 });
    field("TEST URL").type("https://app-test.example.com", { delay: 0 });
    cy.contains("button", "Add Application").click();

    cy.contains("PROD was added, but TEST was not. Please try again.").should("be.visible");
    field("PROD URL").should("have.value", "");
    field("TEST URL").should("have.value", "https://app-test.example.com");
    cy.get("@onClose").should("not.have.been.called");
  });

  it("shows that an environment already exists under its URL field", () => {
    const message = "Test App already has a PROD URL. Edit that one instead.";
    cy.intercept("POST", "**/api/application-urls", {
      statusCode: 409,
      body: { message, errors: { environment: [message] } },
    });
    mountModal();

    field("Application Name").type("Test App", { delay: 0 });
    field("PROD URL").type("https://app.example.com", { delay: 0 });
    cy.contains("button", "Add Application").click();

    field("PROD URL").parents(".MuiFormControl-root").should("contain", message);
    cy.get("@onClose").should("not.have.been.called");
  });

  it("stays open while saving", () => {
    cy.intercept("POST", "**/api/application-urls", {
      statusCode: 201,
      body: { id: 1 },
      delay: 500,
    }).as("create");
    mountModal("Test App");

    field("Environment").type("DEMO", { delay: 0 });
    field(/^URL$/).type("https://demo.example.com", { delay: 0 });
    cy.contains("button", "Add Environment").click();
    cy.get('[role="dialog"]').trigger("keydown", { key: "Escape" });
    cy.get("@onClose").should("not.have.been.called");

    cy.wait("@create");
    cy.get("@onClose").should("have.been.calledOnce");
  });

  it("shows the API's URL error under the URL field", () => {
    cy.intercept("POST", "**/api/application-urls", {
      statusCode: 400,
      body: { message: "Validation failed", errors: { url: ["Not a valid URL."] } },
    });
    mountModal("Test App");

    field("Environment").type("DEMO", { delay: 0 });
    field(/^URL$/).type("https://intranet", { delay: 0 });
    cy.contains("button", "Add Environment").click();

    cy.contains("Not a valid URL.").should("be.visible");
    cy.contains("Validation failed").should("not.exist");
    cy.get("@onClose").should("not.have.been.called");
  });
});
