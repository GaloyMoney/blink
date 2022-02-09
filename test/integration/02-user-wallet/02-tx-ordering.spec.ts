import { Wallets } from "@app"

import {
  createUserWalletFromUserRef,
  getDefaultWalletIdByTestUserRef,
} from "test/helpers"

let walletIdA: WalletId

beforeAll(async () => {
  await createUserWalletFromUserRef("A")
  walletIdA = await getDefaultWalletIdByTestUserRef("A")
})

describe("UserWallet - Transactions ordering", () => {
  // Medici internally returns transactions to us in the order: { $sort: { datetime: -1, timestamp: -1 }
  // This is to explicitly capture this behaviour in our tests.

  it("transactions are in reverse chronological order", async () => {
    const txResult = await Wallets.getTransactionsForWalletId({
      walletId: walletIdA,
    })
    const txns = txResult.result
    expect(txns).not.toBeNull()
    if (!txns) return

    expect(txns.length).toBeGreaterThan(1)
    expect(txns).toEqual([...txns].sort(walletTransactionsReverseByCreatedAt))
  })
})

const walletTransactionsReverseByCreatedAt = (
  { createdAt: a }: WalletTransaction,
  { createdAt: b }: WalletTransaction,
) => (a > b ? -1 : a < b ? 1 : 0)
