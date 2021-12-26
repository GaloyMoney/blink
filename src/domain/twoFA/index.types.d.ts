type TwoFASecret = string & { readonly brand: unique symbol }
type TwoFAToken = string & { readonly brand: unique symbol }
type TwoFAError = import("./errors").TwoFAError

interface TwoFA {
  verify({ secret, token }: { secret: TwoFASecret; token: TwoFAToken }): true | TwoFAError
}
