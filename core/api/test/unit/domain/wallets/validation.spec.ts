import { checkedToWalletId } from "@/domain/wallets"
import { InvalidWalletId } from "@/domain/errors"

describe("checkedToWalletId", () => {
  it("should return the walletId if it is a valid UUID", () => {
    const validUuid = "550e8400-e29b-41d4-a716-446655440000"
    expect(checkedToWalletId(validUuid)).toBe(validUuid)
  })

  it("should return an InvalidWalletId error for an invalid UUID", () => {
    const invalidUuid = "invalid-uuid"
    const result = checkedToWalletId(invalidUuid)
    expect(result).toBeInstanceOf(InvalidWalletId)
  })

  it("should return an InvalidWalletId error for an empty string", () => {
    const emptyString = ""
    const result = checkedToWalletId(emptyString)
    expect(result).toBeInstanceOf(InvalidWalletId)
  })

  it("should return an InvalidWalletId error for a malformed UUID", () => {
    const malformedUuid = "550e8400e29b41d4a716446655440000"
    const result = checkedToWalletId(malformedUuid)
    expect(result).toBeInstanceOf(InvalidWalletId)
  })
})
