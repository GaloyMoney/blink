import crypto from "crypto"

import { liabilitiesMainAccount, toLiabilitiesWalletId, toWalletId } from "@domain/ledger"

describe("ledger.ts", () => {
  describe("resolveWalletId", () => {
    const walletId = crypto.randomUUID() as WalletId
    it("returns account id from string path", () => {
      expect(toWalletId(toLiabilitiesWalletId(walletId))).toEqual(walletId)
    })

    it("returns null if invalid path", () => {
      const lowerCasePrefix = liabilitiesMainAccount.toLowerCase()
      expect(toWalletId("" as LiabilitiesWalletId)).toBe(undefined)
      expect(toWalletId("test" as LiabilitiesWalletId)).toBe(undefined)
      expect(toWalletId("test:id" as LiabilitiesWalletId)).toBe(undefined)
      expect(toWalletId(`${liabilitiesMainAccount}:` as LiabilitiesWalletId)).toBe(
        undefined,
      )
      expect(toWalletId(`${lowerCasePrefix}:` as LiabilitiesWalletId)).toBe(undefined)
    })
  })
})
