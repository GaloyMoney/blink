import { ledger } from "@services/mongodb"

const { walletPath, liabilitiesMainAccount, resolveWalletId } = ledger

describe("ledger.ts", () => {
  describe("resolveWalletId", () => {
    const accountId = "123542"
    it("returns account id from string path", () => {
      expect(resolveWalletId(walletPath(accountId))).toEqual(accountId)
    })

    it("returns account id from array path", () => {
      expect(resolveWalletId([liabilitiesMainAccount, accountId])).toEqual(accountId)
    })

    it("returns null if invalid path", () => {
      const lowerCasePrefix = liabilitiesMainAccount.toLowerCase()
      expect(resolveWalletId("")).toBe(null)
      expect(resolveWalletId("test")).toBe(null)
      expect(resolveWalletId("test:id")).toBe(null)
      expect(resolveWalletId(`${liabilitiesMainAccount}:`)).toBe(null)
      expect(resolveWalletId(`${lowerCasePrefix}:`)).toBe(null)
      expect(resolveWalletId([])).toBe(null)
      expect(resolveWalletId(["a"])).toBe(null)
      expect(resolveWalletId(["a", "b", "c"])).toBe(null)
      expect(resolveWalletId([lowerCasePrefix, ""])).toBe(null)
      expect(resolveWalletId([lowerCasePrefix, "id"])).toBe(null)
      expect(resolveWalletId([lowerCasePrefix, "id", "b"])).toBe(null)
    })
  })
})
