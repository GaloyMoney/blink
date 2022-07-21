import { recordSwapFeeToLedger } from "@app/swap"
import { toSats } from "@domain/bitcoin"
import { LedgerTransactionType } from "@domain/ledger"
import { WalletCurrency } from "@domain/shared"

describe("Swap Record ledger Fee", () => {
  let entryId: LedgerTransactionId[] = []

  it("Record fee to ledger", async () => {
    const swapFeeMetadata: SwapFeeLedgerMetadata = {
      swapId: `test-swapid-${Date.now()}`,
      swapAmount: toSats(5000000),
      htlcAddress: `test-htlc-addr-${Date.now()}`,
      onchainMinerFee: toSats(50),
      offchainRoutingFee: toSats(10),
      serviceProviderFee: toSats(50),
      serviceProvider: "LOOP",
      currency: WalletCurrency.Btc,
      type: LedgerTransactionType.Fee,
      pending: false,
    }
    const entry = await recordSwapFeeToLedger(swapFeeMetadata)
    expect(entry).not.toBeInstanceOf(Error)
    entryId = (entry as LedgerJournal).transactionIds
    expect(entryId[0]).toBeDefined()
  })
})
