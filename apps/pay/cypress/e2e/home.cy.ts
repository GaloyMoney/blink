describe("Home", () => {
  it("should navigate to home", () => {
    cy.visit("/")
    cy.url().should("include", `/setuppwa`)

    cy.get("[data-testid=username-input]").should("exist")
    cy.get("[data-testid=username-input]").type("test_user_a")
    cy.get("[data-testid=submit-btn]").click()
  })
})
