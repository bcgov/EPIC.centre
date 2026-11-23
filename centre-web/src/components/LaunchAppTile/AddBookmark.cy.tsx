import { ThemeProvider } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { User } from "oidc-client-ts";
import { EpicApp } from "@/models/EpicApp";
import { theme } from "@/styles/theme";
import { OidcConfig } from "@/utils/config";
import ModalProvider from "../Shared/Modals/ModalProvider";
import { openModal, useModal } from "../Shared/Modals/modalStore";
import SnackBarProvider from "../Shared/Snackbar/SnackBarProvider";
import { AddBookmark } from "./AddBookmark";

const epicApp: EpicApp = {
  id: 1,
  name: "epic_track",
  title: "EPIC.track",
  description: "",
  launch_url: "https://track.example.gov.bc.ca",
  is_active: true,
  is_public: false,
  user: {
    user_auth_guid: "guid",
    access_level: "Viewer",
    last_accessed: null,
    custom_order: null,
    bookmarks: [],
    sort_order: 1,
  },
};

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

// Through the modal store, as BookmarkSection opens it
const openForm = () => {
  cy.mount(
    <QueryClientProvider client={new QueryClient()}>
      <ThemeProvider theme={theme}>
        <ModalProvider />
        <SnackBarProvider />
      </ThemeProvider>
    </QueryClientProvider>,
  );
  cy.then(() => openModal(<AddBookmark epicApp={epicApp} />));
};

const form = () => cy.get('form[aria-label="Add or edit bookmarks form"]');

const fillBookmark = (slot: number, url: string, label: string) => {
  cy.get(`input[aria-label="Bookmark ${slot} URL"]`).type(url, { delay: 0 });
  cy.get(`input[aria-label="Bookmark ${slot} Link Name"]`).type(label, { delay: 0 });
};

const save = () => cy.get('button[aria-label="Save bookmarks"]').click();

describe("AddBookmark", () => {
  beforeEach(() => {
    // The form is 810px wide
    cy.viewport(1000, 800);
    useModal.getState().setClose();
    signIn();
    cy.intercept("GET", "**/api/applications", []);
  });

  it("explains a link name over 100 characters without sending it", () => {
    cy.intercept("PATCH", "**/api/user-applications/bookmarks", cy.spy().as("save"));
    openForm();

    fillBookmark(1, "https://docs.example.gov.bc.ca", "x".repeat(101));
    save();

    cy.contains("Link name must be 100 characters or fewer").should("be.visible");
    cy.get("@save").should("not.have.been.called");
  });

  it("shows the API's error under the field it is about", () => {
    cy.intercept("PATCH", "**/api/user-applications/bookmarks", {
      statusCode: 400,
      body: {
        message: "Invalid bookmarks",
        errors: { "1": { url: ["Not a valid URL."] } },
      },
    });
    openForm();

    fillBookmark(1, "https://docs.example.gov.bc.ca", "Docs");
    fillBookmark(2, "https://intranet.example.gov.bc.ca", "Intranet");
    save();

    cy.contains("Not a valid URL.").should("be.visible");
    cy.contains("Invalid bookmarks").should("not.exist");
  });

  it("keeps what was typed when the save fails", () => {
    cy.intercept("PATCH", "**/api/user-applications/bookmarks", {
      statusCode: 500,
      body: "Internal server error",
    });
    openForm();

    fillBookmark(1, "https://docs.example.gov.bc.ca", "Docs");
    save();

    cy.contains("Unable to save your bookmarks. Please try again.").should("be.visible");
    form().should("exist");
    cy.get('input[aria-label="Bookmark 1 Link Name"]').should("have.value", "Docs");
    cy.get('button[aria-label="Save bookmarks"]').should("not.be.disabled");
  });

  it("closes once the bookmarks are saved", () => {
    cy.intercept("PATCH", "**/api/user-applications/bookmarks", {
      statusCode: 200,
      body: epicApp.user,
    });
    openForm();

    fillBookmark(1, "https://docs.example.gov.bc.ca", "Docs");
    save();

    cy.contains("Bookmarks updated successfully").should("be.visible");
    form().should("not.exist");
  });
});
