class CreatePage {
  get createButton() {
    return $(
      "body > div.top_page_container > div.NumPad_numpad__yb7Im > div > button:nth-child(5)",
    )
  }

  get submitButton() {
    return $(
      "body > div.top_page_container > div.CreateLink_commission_and_submit_buttons__ydXyN > button.Button_EnabledButton__uINCR.undefined",
    )
  }

  async clickCreateButton() {
    await (await this.createButton).waitForDisplayed()
    await (await this.createButton).click()
  }

  async clickSubmitButton() {
    await (await this.submitButton).waitForDisplayed()
    await (await this.submitButton).click()
  }
}

class ConfirmModal {
  get confirmButton() {
    return $(
      "body > div.MuiModal-root.css-8ndowl > div.MuiBox-root.css-16wyu4u > div > div.ConfirmModal_button_container__Pwbtc > button:nth-child(2)",
    )
  }

  async clickConfirmButton() {
    await (await this.confirmButton).waitForDisplayed()
    await (await this.confirmButton).click()
  }
}

class LinkDetailsPage {
  get notFundedText() {
    return $(
      "body > div.top_page_container > div.LinkDetails_container__c_ouP > div.LinkDetails_status_UNFUNDED__wNAex",
    )
  }

  async getNotFundedText() {
    await (await this.notFundedText).waitForDisplayed()
    return await (await this.notFundedText).getText()
  }
}

describe("Create Voucher", () => {
  const createPage = new CreatePage()
  const confirmModal = new ConfirmModal()
  const linkDetailsPage = new LinkDetailsPage()

  it("Create Voucher", async () => {
    try {
      await browser.url("/create")

      const change_commision = await $(
        "body > div.top_page_container > div.CreateLink_commission_and_submit_buttons__ydXyN > button.Button_Button__VQ4Ej.undefined",
      )

      await change_commision.click()
      const percentage = await $(
        "body > div.top_page_container > div.NumPad_numpad__yb7Im > div > button:nth-child(1)",
      )
      await percentage.click()

      const set_commission = await $(
        "body > div.top_page_container > div.CreateLink_commission_and_submit_buttons__ydXyN > button",
      )
      await set_commission.click()

      const setted_commission = await $(
        "body > div.top_page_container > div:nth-child(4)",
      )
      const setted_commission_text = await setted_commission.getText()
      expect(setted_commission_text).toEqual("1% commission")

      const change_curreny = await $("#currency")
      await change_curreny.click()
      const set_curreny = await $("#currency > option:nth-child(1)")
      await set_curreny.click()

      await createPage.clickCreateButton()

      const total_ammoutn = await $(
        "body > div.top_page_container > div:nth-child(5)",
      ).getText()
      expect(total_ammoutn).toEqual("≈ $4.95")

      await createPage.clickSubmitButton()
      await confirmModal.clickConfirmButton()
      const notFundedText = await linkDetailsPage.getNotFundedText()

      expect(notFundedText).toEqual("Not Funded")
    } catch (error) {
      console.error("Test failed with error:", error)
      throw error
    }
  })
})
