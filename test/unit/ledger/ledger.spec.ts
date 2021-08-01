import { ledger } from "@services/mongodb"

const { accountPath, liabilitiesMainAccount, resolveAccountId } = ledger

describe("ledger.ts", () => {
  describe("resolveAccountId", () => {
    const accountId = "123542"
    it("returns account id from string path", () => {
      expect(resolveAccountId(accountPath(accountId))).toEqual(accountId)
    })

    it("returns account id from array path", () => {
      expect(resolveAccountId([liabilitiesMainAccount, accountId])).toEqual(accountId)
    })

    it("returns null if invalid path", () => {
      const lowerCasePrefix = liabilitiesMainAccount.toLowerCase()
      expect(resolveAccountId("")).toBe(null)
      expect(resolveAccountId("test")).toBe(null)
      expect(resolveAccountId("test:id")).toBe(null)
      expect(resolveAccountId(`${liabilitiesMainAccount}:`)).toBe(null)
      expect(resolveAccountId(`${lowerCasePrefix}:`)).toBe(null)
      expect(resolveAccountId([])).toBe(null)
      expect(resolveAccountId(["a"])).toBe(null)
      expect(resolveAccountId(["a", "b", "c"])).toBe(null)
      expect(resolveAccountId([lowerCasePrefix, ""])).toBe(null)
      expect(resolveAccountId([lowerCasePrefix, "id"])).toBe(null)
      expect(resolveAccountId([lowerCasePrefix, "id", "b"])).toBe(null)
    })
  })
})
