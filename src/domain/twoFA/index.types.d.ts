type TwoFASecret = string & Unique
type TwoFAToken = string & Unique

type TwoFAError = import("./errors").TwoFAError

interface TwoFA {
  verify({ secret, token }: { secret: TwoFASecret; token: TwoFAToken }): true | TwoFAError
}
