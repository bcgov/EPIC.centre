import { Tooltip } from "@mui/material";
import { CentreLink } from "./index";

describe("CentreLink", () => {
  it("can be wrapped in a Tooltip", () => {
    cy.window().then((win) => cy.spy(win.console, "error").as("consoleError"));
    cy.mount(
      <Tooltip title="Opens the guide">
        <CentreLink href="https://example.gov.bc.ca/guide">Guide</CentreLink>
      </Tooltip>,
    );

    cy.contains("a", "Guide").trigger("mouseover");
    cy.get('[role="tooltip"]').should("contain", "Opens the guide");
    cy.get("@consoleError").should(
      "not.have.been.calledWithMatch",
      /cannot be given refs/,
    );
  });
});
