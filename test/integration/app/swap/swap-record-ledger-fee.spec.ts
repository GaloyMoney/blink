import { recordSwapFeeToLedger } from "@app/swap"
import { toSats } from "@domain/bitcoin"
import { sha256 } from "@domain/bitcoin/lightning"
import { DuplicateError } from "@domain/errors"
import { LedgerTransactionType } from "@domain/ledger"
import { WalletCurrency } from "@domain/shared"
import { SwapProvider } from "@domain/swap"

describe("Swap Record ledger Fee", () => {
  let entryId: LedgerTransactionId[] = []
  const swapId = `test-swapid-${Date.now()}` as SwapId
  const swapFeeMetadata: SwapTransactionMetadataUpdate = {
    hash: sha256(Buffer.from(swapId)) as SwapHash,
    swapId,
    swapAmount: toSats(5000000),
    htlcAddress: `test-htlc-addr-${Date.now()}` as OnChainAddress,
    onchainMinerFee: toSats(50),
    offchainRoutingFee: toSats(10),
    serviceProviderFee: toSats(50),
    serviceProvider: SwapProvider.Loop,
    currency: WalletCurrency.Btc,
    type: LedgerTransactionType.Fee,
  }

  it("Record fee to ledger", async () => {
    const entry = await recordSwapFeeToLedger(swapFeeMetadata)
    if (entry instanceof Error) throw entry
    expect(entry).not.toBeInstanceOf(Error)
    entryId = (entry as LedgerJournal).transactionIds
    expect(entryId[0]).toBeDefined()
  })

  it("Do not record duplicate fee to ledger", async () => {
    const entry = await recordSwapFeeToLedger(swapFeeMetadata)
    expect(entry).toBeInstanceOf(DuplicateError)
  })
})
