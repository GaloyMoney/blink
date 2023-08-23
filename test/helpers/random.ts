import { randomUUID, randomBytes } from "crypto"

export const randomEmail = () =>
  (randomBytes(20).toString("hex") + "@galoy.io") as EmailAddress

export const randomPassword = () => randomBytes(20).toString("hex") as IdentityPassword

export const randomPhone = () =>
  `+1415${Math.floor(Math.random() * 9000000 + 1000000)}` as PhoneNumber

export const randomUserId = () => randomUUID() as UserId
