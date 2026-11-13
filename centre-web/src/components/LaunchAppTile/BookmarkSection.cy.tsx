import { ThemeProvider } from "@mui/material";
import { Bookmark, EpicApp } from "@/models/EpicApp";
import { theme } from "@/styles/theme";
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

  it("opens http(s) bookmarks in a new tab without giving it the opener", () => {
    cy.mount(
      <BookmarkSection
        epicApp={appWithBookmarks([
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
        epicApp={appWithBookmarks([
          { label: "Script", url: "javascript:alert(1)" },
          { label: "Relative", url: "//example.com" },
        ])}
      />,
    );

    cy.contains("a", "Script").should("not.have.attr", "href");
    cy.contains("a", "Relative").should("not.have.attr", "href");
  });

  it("sizes each link to its label, capped at the section width", () => {
    cy.viewport(400, 400);
    cy.mount(
      <BookmarkSection
        epicApp={appWithBookmarks([
          { label: "Docs", url: "https://docs.example.gov.bc.ca" },
          {
            label: "A very long bookmark label ".repeat(10),
            url: "https://long.example.gov.bc.ca",
          },
        ])}
      />,
    );

    cy.get("#bookmark-section").then(($section) => {
      const sectionWidth = $section[0].getBoundingClientRect().width;
      bookmarkLinks().then(($links) => {
        const [short, long] = $links.toArray();
        expect(short.getBoundingClientRect().width).to.be.lessThan(
          sectionWidth / 2,
        );
        expect(long.getBoundingClientRect().width).to.be.at.most(sectionWidth);
      });
    });
  });

  it("only keeps room for all three bookmarks when asked to", () => {
    // The reserved height comes from the app theme's line height
    const sectionHeight = (bookmarks: Bookmark[], reserveSpace = false) => {
      cy.mount(
        <ThemeProvider theme={theme}>
          <BookmarkSection
            epicApp={appWithBookmarks(bookmarks)}
            reserveSpace={reserveSpace}
          />
        </ThemeProvider>,
      );
      return cy
        .get("#bookmark-section")
        .then(($section) => $section[0].getBoundingClientRect().height);
    };
    const three = [
      { label: "Docs", url: "https://docs.example.gov.bc.ca" },
      { label: "Guide", url: "https://guide.example.gov.bc.ca" },
      { label: "Reports", url: "https://reports.example.gov.bc.ca" },
    ];

    sectionHeight(three).then((full) => {
      sectionHeight([]).should("be.lessThan", full - 50);
      sectionHeight([], true).should("be.closeTo", full, 0.5);
    });
  });
});
