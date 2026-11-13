import { Bookmark, EpicApp } from "@/models/EpicApp";
import { BookmarkSection } from "./BookmarkSection";

const appWithBookmarks = (bookmarks: Bookmark[]): EpicApp => ({
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
    bookmarks,
    sort_order: 1,
  },
});

const blank = { label: "", url: "" };

// The Add/Edit Bookmarks button is a link too
const bookmarkLinks = () =>
  cy.get("#bookmark-section a").not(':contains("Add/Edit Bookmarks")');

describe("BookmarkSection", () => {
  beforeEach(() => {
    cy.window().then((win) => cy.spy(win.console, "error").as("consoleError"));
  });

  it("skips the blank slots the bookmarks form saves", () => {
    cy.mount(
      <BookmarkSection
        epicApp={appWithBookmarks([
          { label: "Docs", url: "https://docs.example.gov.bc.ca" },
          blank,
          blank,
        ])}
      />,
    );

    bookmarkLinks().should("have.length", 1).and("contain", "Docs");
    cy.get("@consoleError").should("not.have.been.calledWithMatch", /same key/);
  });

  it("shows bookmarks that share a label", () => {
    cy.mount(
      <BookmarkSection
        epicApp={appWithBookmarks([
          { label: "Guide", url: "https://one.example.gov.bc.ca" },
          { label: "Guide", url: "https://two.example.gov.bc.ca" },
        ])}
      />,
    );

    bookmarkLinks().should("have.length", 2);
    cy.get("@consoleError").should("not.have.been.calledWithMatch", /same key/);
  });
});
