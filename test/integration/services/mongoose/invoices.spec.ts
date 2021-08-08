import { MakeInvoicesRepo } from "@services/mongoose/invoices"

describe("Invoices", () => {
  it("persits invoices", async () => {
    const randomPaymentHash = Math.random().toString(36)
    const repo = MakeInvoicesRepo()
    const persistResult = await repo.persist({
      paymentHash: randomPaymentHash as PaymentHash,
      walletId: "walletId" as WalletId,
      selfGenerated: false,
      pubkey: "pubkey" as Pubkey,
      paid: false,
    })
    expect(persistResult.isOk()).toEqual(true)
  })
})
