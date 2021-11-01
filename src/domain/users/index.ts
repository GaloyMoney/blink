export const UserLanguage = {
  DEFAULT: "",
  EN_US: "en",
  ES_SV: "es",
} as const

import { InvalidUsername } from "@domain/errors"

export const UsernameRegex = /(?!^(1|3|bc1|lnbc1))^[0-9a-z_]{3,50}$/i

export const checkedToUsername = (username: string): Username | ValidationError => {
  if (!username.match(UsernameRegex)) {
    return new InvalidUsername(username)
  }
  return username as Username
}
