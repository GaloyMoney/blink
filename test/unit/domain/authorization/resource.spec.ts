import {
  AnyResource,
  AnyWalletResource,
  AnyAccountResource,
  resourceFromAccountId,
  resourceFromWalletId,
  resourceFromUserId,
} from "@domain/authorization"

describe("Resource", () => {
  it("constructs a Uri", () => {
    const accountId = "accountId" as AccountId
    expect(resourceFromAccountId(accountId).uri).toEqual("/resource/account/accountId")
    const walletId = "walletId" as WalletId
    expect(resourceFromWalletId(walletId).uri).toEqual("/resource/wallet/walletId")
    const userId = "userId" as UserId
    expect(resourceFromUserId(userId).uri).toEqual("/resource/user/userId")
  })

  it("supports wildcard", () => {
    expect(AnyAccountResource.uri).toEqual("/resource/account/*")
    expect(AnyWalletResource.uri).toEqual("/resource/wallet/*")
    expect(AnyResource.uri).toEqual("/resource/*")
  })
})
