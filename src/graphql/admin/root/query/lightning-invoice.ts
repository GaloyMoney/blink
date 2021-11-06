import { GT } from "@graphql/index"
import { lookupInvoiceByHashAndPubkey } from "@app/lightning"
import PaymentHash from "@graphql/types/scalar/payment-hash"
import LightningInvoice from "@graphql/admin/types/object/lightning-invoice"
import { WalletInvoicesRepository } from "@services/mongoose"
import { RepositoryError } from "@domain/errors"

const LightningInvoiceQuery = GT.Field({
  type: GT.NonNull(LightningInvoice),
  args: {
    hash: { type: GT.NonNull(PaymentHash) },
  },
  resolve: async (_, { hash }) => {
    if (hash instanceof Error) throw hash

    const invoicesRepo = WalletInvoicesRepository()
    const walletInvoice = await invoicesRepo.findByPaymentHash(hash)

    if (walletInvoice instanceof RepositoryError) return walletInvoice

    const { pubkey } = walletInvoice

    const paymentHash = hash as PaymentHash /* FIXME */

    const lightningInvoice = await lookupInvoiceByHashAndPubkey({
      paymentHash,
      pubkey,
    })
    if (lightningInvoice instanceof Error) throw lightningInvoice

    return lightningInvoice
  },
})

export default LightningInvoiceQuery
