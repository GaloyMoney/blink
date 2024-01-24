describe("Home", () => {
  it("should navigate to home and have a valid node pub key", () => {
    cy.visit("/")
    cy.get("[data-testid=node-pubkey-txt]").should("exist")
    cy.get("[data-testid=node-pubkey-txt]").contains(/^[a-fA-F0-9]{64,66}$/)
  })
})
