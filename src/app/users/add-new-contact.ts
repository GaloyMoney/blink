import { ValidationError } from "@domain/errors"
import { UsersRepository, WalletsRepository } from "@services/mongoose"

export const addNewContact = async ({
  userId,
  contactWalletId,
}: {
  userId: UserId
  contactWalletId: WalletId
}): Promise<void | ApplicationError> => {
  const contactWallet = await WalletsRepository().findById(contactWalletId)
  if (contactWallet instanceof Error) return contactWallet
  if (!contactWallet.walletName)
    return new ValidationError(
      "New contact wallet does not have a value for 'walletName' property",
    )

  const result = await UsersRepository().addContactByWalletName({
    userId,
    contactWalletName: contactWallet.walletName,
  })
  if (result instanceof Error) return result
}
