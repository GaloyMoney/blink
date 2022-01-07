import { getRecentlyActiveAccounts } from "@app/accounts/active-accounts"
import { toSats } from "@domain/bitcoin"
import * as ledger from "@services/ledger"

import { createUserWallet, getUserIdByTestUserIndex } from "test/helpers"

describe("getRecentlyActiveAccounts", () => {
  it("returns active users according to volume", async () => {
    await createUserWallet(0)

    const user0 = await getUserIdByTestUserIndex(0)
    const funderUserId = await getUserIdByTestUserIndex(4)

    const ledgerService = ledger.LedgerService()

    let spy = jest.spyOn(ledger, "LedgerService").mockImplementation(() => ({
      ...ledgerService,
      allTxVolumeSince: async () => ({
        outgoingSats: toSats(50000),
        incomingSats: toSats(100000),
      }),
    }))

    const activeUsers = await getRecentlyActiveAccounts()
    if (activeUsers instanceof Error) throw activeUsers
    spy.mockClear()

    const accountIds = activeUsers.map((user) => user.id)

    // userWallets used in the tests
    // TODO: test could be optimized. instead of fetching all the users, we could verify
    // getRecentlyActiveAccounts is only apply to some of them
    expect(accountIds).toEqual(expect.arrayContaining([user0, funderUserId]))

    spy = jest.spyOn(ledger, "LedgerService").mockImplementation(() => ({
      ...ledgerService,
      allTxVolumeSince: async () => ({
        outgoingSats: toSats(0),
        incomingSats: toSats(0),
      }),
    }))

    const finalActiveUsers = await getRecentlyActiveAccounts()
    if (finalActiveUsers instanceof Error) throw finalActiveUsers

    const finalNumActiveUsers = finalActiveUsers.length
    spy.mockClear()

    expect(finalNumActiveUsers).toBe(0)
  })
})
