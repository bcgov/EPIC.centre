import { EpicApp } from "@/models/EpicApp";
import { BookmarkSection } from "./BookmarkSection";

const epicAppWithBookmarks = (bookmarks: EpicApp["user"]["bookmarks"]) =>
  ({ id: 1, user: { bookmarks } }) as EpicApp;

describe("BookmarkSection", () => {
  it("opens http(s) bookmarks in a new tab without giving it the opener", () => {
    cy.mount(
      <BookmarkSection
        epicApp={epicAppWithBookmarks([
          { label: "Guide", url: "https://example.gov.bc.ca/guide" },
        ])}
      />,
    );

    cy.contains("a", "Guide")
      .should("have.attr", "href", "https://example.gov.bc.ca/guide")
      .and("have.attr", "target", "_blank")
      .and("have.attr", "rel", "noopener noreferrer");
  });

  it("does not link bookmarks that aren't http(s)", () => {
    cy.mount(
      <BookmarkSection
        epicApp={epicAppWithBookmarks([
          { label: "Script", url: "javascript:alert(1)" },
          { label: "Relative", url: "//example.com" },
        ])}
      />,
    );

    cy.contains("a", "Script").should("not.have.attr", "href");
    cy.contains("a", "Relative").should("not.have.attr", "href");
  });
});
