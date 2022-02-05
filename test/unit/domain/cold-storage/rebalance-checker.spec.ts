import { toSats } from "@domain/bitcoin"
import { RebalanceChecker } from "@domain/cold-storage"

describe("RebalanceChecker", () => {
  it("checks if a rebalance is needed", async () => {
    const checker = RebalanceChecker({
      minOnChainHotWalletBalance: toSats(10_000n),
      minRebalanceSize: toSats(10_000n),
      maxHotWalletBalance: toSats(30_000n),
    })
    expect(
      checker.getWithdrawFromHotWalletAmount({
        onChainHotWalletBalance: toSats(50_000n),
        offChainHotWalletBalance: toSats(10_000n),
      }),
    ).toEqual(toSats(40_000n))
  })
})
