import { fromPromise, ResultAsync } from "neverthrow"
import { toTypedError } from "@domain/utils"
import { InvoiceUser } from "./schema"

const toRepositoryError = toTypedError<RepositoryErrorType>({
  _type: "RepositoryError",
  unknownMessage: "Unknown RepositoryError",
})

export const MakeInvoicesRepo = () => {
  const persist = ({
    paymentHash,
    walletId,
    selfGenerated,
    pubkey,
    paid,
  }: WalletInvoice): ResultAsync<WalletInvoice, RepositoryError> => {
    return fromPromise(
      new InvoiceUser({
        _id: paymentHash,
        uid: walletId,
        selfGenerated,
        pubkey,
        paid,
      }).save(),
      toRepositoryError,
    ).map((_result) => {
      return {
        paymentHash,
        walletId,
        selfGenerated,
        pubkey,
        paid,
      } as WalletInvoice
    })
  }

  return { persist }
}
