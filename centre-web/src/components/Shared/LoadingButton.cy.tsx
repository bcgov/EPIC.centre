import { LoadingButton } from "./LoadingButton";

describe("LoadingButton", () => {
  it("shows its label and can be clicked when not loading", () => {
    const onClick = cy.stub().as("onClick");
    cy.mount(<LoadingButton onClick={onClick}>Save</LoadingButton>);

    cy.get('[role="progressbar"]').should("not.exist");
    cy.contains("button", "Save").should("be.enabled").click();
    cy.get("@onClick").should("have.been.calledOnce");
  });

  it("is disabled and shows a spinner instead of its label while loading", () => {
    cy.mount(<LoadingButton loading>Save</LoadingButton>);

    cy.get("button").should("be.disabled");
    cy.get('[role="progressbar"]').should("be.visible");
    cy.contains("span", "Save").should("not.be.visible");
  });

  it("stays disabled when disabled is passed", () => {
    cy.mount(<LoadingButton disabled>Save</LoadingButton>);

    cy.get("button").should("be.disabled");
    cy.contains("span", "Save").should("be.visible");
  });
});
