import { DuplicateError } from "@domain/errors"
import { SwapState, SwapType } from "@domain/swap"
import { admin as LedgerAdmin } from "@services/ledger/admin"

describe("Swap Record ledger Fee", () => {
  let entryId: LedgerTransactionId[] = []
  const swapId = `test-swapid-${Date.now()}` as SwapId
  const mockSwapData: SwapStatusResult = {
    id: swapId,
    amt: 5000000n,
    htlcAddress: `test-htlc-addr-${Date.now()}` as OnChainAddress,
    onchainMinerFee: 50n,
    offchainRoutingFee: 50n,
    serviceProviderFee: 50n,
    message: "",
    state: SwapState.Success,
    swapType: SwapType.Swapout,
  }

  it("Record fee to ledger", async () => {
    const entry = await LedgerAdmin.addSwapFeeTxSend(mockSwapData)
    if (entry instanceof Error) throw entry
    expect(entry).not.toBeInstanceOf(Error)
    entryId = (entry as LedgerJournal).transactionIds
    expect(entryId[0]).toBeDefined()
  })

  it("Do not record duplicate fee to ledger", async () => {
    const entry = await LedgerAdmin.addSwapFeeTxSend(mockSwapData)
    expect(entry).toBeInstanceOf(DuplicateError)
  })
})
