declare const twoFASecretSymbol: unique symbol
type TwoFASecret = string & { [twoFASecretSymbol]: never }

declare const twoFATokenSymbol: unique symbol
type TwoFAToken = string & { [twoFATokenSymbol]: never }

type TwoFAError = import("./errors").TwoFAError

interface TwoFAComponent {
  verify({ secret, token }: { secret: TwoFASecret; token: TwoFAToken }): void | TwoFAError
}
