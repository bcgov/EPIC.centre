import { Header } from "./Header";

describe("RequestAccessTile Header", () => {
  it("renders the description without nesting a div inside a p", () => {
    cy.window().then((win) => cy.spy(win.console, "error").as("consoleError"));
    cy.mount(
      <Header
        data={{
          title: "EPIC.track",
          description: "Track environmental assessments from start to finish.",
        }}
      />,
    );

    cy.contains("Track environmental assessments");
    cy.get("p div").should("not.exist");
    cy.get("@consoleError").should(
      "not.have.been.calledWithMatch",
      /validateDOMNesting/,
    );
  });
});
