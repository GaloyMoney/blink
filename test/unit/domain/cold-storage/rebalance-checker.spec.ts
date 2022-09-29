import { toSats } from "@domain/bitcoin"
import { RebalanceChecker } from "@domain/cold-storage"

describe("RebalanceChecker", () => {
  it("returns the amount that should be rebalanced", async () => {
    const checker = RebalanceChecker({
      minOnChainHotWalletBalance: toSats(10000),
      minRebalanceSize: toSats(10000),
      maxHotWalletBalance: toSats(30000),
    })
    expect(
      checker.getWithdrawFromHotWalletAmount({
        onChainHotWalletBalance: toSats(50000),
        offChainHotWalletBalance: toSats(10000),
      }),
    ).toEqual(toSats(40000))
  })
})
