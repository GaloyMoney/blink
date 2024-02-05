import {
  AuthWithPhonePasswordlessService,
  AuthWithUsernamePasswordDeviceIdService,
} from "@/services/kratos"
import { kratosAdmin } from "@/services/kratos/private"

import { randomPhone } from "test/helpers"

describe("device account flow", () => {
  const authService = AuthWithUsernamePasswordDeviceIdService()
  const username = crypto.randomUUID() as IdentityUsername
  const password = crypto.randomUUID() as IdentityPassword
  let kratosUserId: UserId

  it("create an account", async () => {
    const res = await authService.createIdentityWithSession({
      username,
      password,
    })
    if (res instanceof Error) throw res
    ;({ kratosUserId } = res)

    const newIdentity = await kratosAdmin.getIdentity({ id: kratosUserId })
    expect(newIdentity.data.schema_id).toBe("username_password_deviceid_v0")
    expect(newIdentity.data.traits.username).toBe(username)
  })

  it("upgrade account", async () => {
    const phone = randomPhone()

    const authService = AuthWithPhonePasswordlessService()
    const res = await authService.updateIdentityFromDeviceAccount({
      phone,
      userId: kratosUserId,
    })
    if (res instanceof Error) throw res

    expect(res.phone).toBe(phone)
    expect(res.id).toBe(kratosUserId)
  })
})
