import { checkedToWalletId } from "@/domain/wallets"
import { checkedToPhoneNumber } from "@/domain/users"
import { InputValidationError } from "@/graphql/error"
import { GT } from "@/graphql/index"

const WalletIdOrPhone = GT.Scalar<WalletId | PhoneNumber>({
  name: "WalletIdOrPhone",
  description: "A Wallet ID (UUID) or a phone number including country code",

  parseValue(value) {
    if (typeof value !== "string") {
      throw new InputValidationError({ message: "Invalid type for WalletIdOrPhone" })
    }

    return validateWalletIdOrThrow(value)
  },

  parseLiteral(ast) {
    if (ast.kind !== GT.Kind.STRING) {
      throw new InputValidationError({ message: "Invalid type for WalletIdOrPhone" })
    }

    return validateWalletIdOrThrow(ast.value)
  },
})

function validateWalletIdOrThrow(value: string): WalletId | PhoneNumber {
  const walletId = checkedToWalletId(value)
  if (!(walletId instanceof Error)) return walletId

  const phoneNumber = checkedToPhoneNumber(value)
  if (!(phoneNumber instanceof Error)) return phoneNumber

  throw new InputValidationError({
    message: "Value is neither a valid WalletId nor a valid PhoneNumber",
  })
}

export default WalletIdOrPhone
