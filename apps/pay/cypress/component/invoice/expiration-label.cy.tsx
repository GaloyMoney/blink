import React from "react"

import ExpirationLabel from "@/components/invoice/expiration-label"

describe("<ExpirationLabel />", () => {
  it('renders "Expired" when expiration date is in the past', () => {
    const pastExpirationDate = Math.floor(Date.now() / 1000) - 1000 // 1 second ago
    cy.mount(<ExpirationLabel expirationDate={pastExpirationDate} />)
    cy.get("span").should("have.text", "Expired")
  })

  it("renders correct expiration time when expiration is in the future", () => {
    const futureExpirationDate = Math.floor(Date.now() / 1000) + 3600 // 1 hour in the future
    cy.mount(<ExpirationLabel expirationDate={futureExpirationDate} />)
    cy.get("span").should("contain", "Expires in ~59 Minutes")
  })

  it("updates expiration time every second", () => {
    const now = Date.now()
    const futureExpirationDate = Math.floor(Date.now() / 1000) + 3 // 3 seconds in the future
    cy.clock(now) // Freeze time
    cy.mount(<ExpirationLabel expirationDate={futureExpirationDate} />)
    cy.tick(1000) // Advance time by 1 second
    cy.get("span").should("contain", "Expires in 2 Second")
    cy.tick(1000) // Advance time by 1 more second
    cy.get("span").should("contain", "Expires in 1 Second")
    cy.tick(1000) // Advance time by 1 more second
    cy.get("span").should("have.text", "Expired")
  })
})
