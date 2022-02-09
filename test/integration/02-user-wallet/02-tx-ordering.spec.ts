import { Wallets } from "@app"
import { MEMO_SHARING_SATS_THRESHOLD } from "@config"
import { toSats } from "@domain/bitcoin"
import { baseLogger } from "@services/logger"

import {
  createUserWalletFromUserRef,
  getAccountByTestUserRef,
  getDefaultWalletIdByTestUserRef,
  getUserRecordByTestUserRef,
} from "test/helpers"

let userTypeA: UserRecord

let usernameA: Username

let accountB: Account

let walletIdA: WalletId
let walletIdB: WalletId

beforeAll(async () => {
  await createUserWalletFromUserRef("A")
  await createUserWalletFromUserRef("B")

  accountB = await getAccountByTestUserRef("B")

  walletIdA = await getDefaultWalletIdByTestUserRef("A")
  walletIdB = await getDefaultWalletIdByTestUserRef("B")

  userTypeA = await getUserRecordByTestUserRef("A")
  usernameA = userTypeA.username as Username
})

describe("UserWallet - Transactions ordering", () => {
  // Medici internally returns transactions to us in the order: { $sort: { datetime: -1, timestamp: -1 }
  // This is to explicitly capture this behaviour in our tests.

  it("transactions are in reverse chronological order", async () => {
    const count = 3
    const getMemo = (i) => `Test transaction ordering - ${i}`
    for (let i = 1; i <= count; i++) {
      const res = await Wallets.intraledgerPaymentSendUsername({
        recipientUsername: usernameA,
        memo: getMemo(i),
        amount: toSats(MEMO_SHARING_SATS_THRESHOLD + 1),
        senderWalletId: walletIdB,
        senderAccount: accountB,
        logger: baseLogger,
      })
      expect(res).not.toBeInstanceOf(Error)
      if (res instanceof Error) throw res
    }

    const txResult = await Wallets.getTransactionsForWalletId({
      walletId: walletIdA,
    })
    const txns = txResult.result
    expect(txns).not.toBeNull()
    if (!txns) return

    expect(txns.length).toBeGreaterThanOrEqual(count)
    expect(txns).toEqual([...txns].sort(walletTransactionsReverseByCreatedAt))
    expect(txns[0].memo).toBe(getMemo(count))
  })
})

const walletTransactionsReverseByCreatedAt = (
  { createdAt: a }: WalletTransaction,
  { createdAt: b }: WalletTransaction,
) => (a > b ? -1 : a < b ? 1 : 0)
