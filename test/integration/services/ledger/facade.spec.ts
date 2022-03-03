import { LedgerFacade } from "@services/ledger/facade"
import { WalletCurrency } from "@domain/shared"

describe("LedgerFacade", () => {
  it("can record a send", () => {
    const metadata = {} as AddLnSendLedgerMetadata
    const description = "description"
    const senderWalletId = "senderWalletId" as WalletId
    const senderWalletCurrency = WalletCurrency.Btc
    const btcAmount = {
      currency: WalletCurrency.Btc,
      amount: 10000n,
    }

    LedgerFacade().recordSend({
      description,
      metadata,
      senderWalletId,
      senderWalletCurrency,
      amount: btcAmount,
    })
  })
})
