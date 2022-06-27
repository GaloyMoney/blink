import {
  AuthResourceType,
  AccountAttribute,
  Permission,
  AuthAction,
} from "@domain/authorization"

describe("Permission", () => {
  it("has a uri", () => {
    const uri = Permission({
      type: AuthResourceType.Account,
      attr: AccountAttribute.Status,
      action: AuthAction.Read,
    }).uri
    expect(uri).toEqual("/account/status/read")
  })
})
