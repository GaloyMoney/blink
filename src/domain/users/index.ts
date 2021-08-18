import { InvalidUsername } from "@domain/errors"

export const UserLanguage = {
  EN_US: "en",
  ES_SV: "es",
} as const

export const getUsernameRegex = () => /(?!^(1|3|bc1|lnbc1))^[0-9a-z_]+$/i

export const checkedToUsername = (username): Username | ValidationError => {
  const regexUsername = getUsernameRegex()
  if (!username.match(regexUsername)) {
    return new InvalidUsername(username)
  }
  return username as Username
}
