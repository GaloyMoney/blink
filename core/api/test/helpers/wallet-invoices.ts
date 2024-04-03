import { decodeInvoice, getSecretAndPaymentHash } from "@/domain/bitcoin/lightning"
import { WalletCurrency } from "@/domain/shared"

export const createMockWalletInvoice = (recipientWalletDescriptor: {
  currency: WalletCurrency
  id: WalletId
}): WalletInvoice => {
  return {
    ...getSecretAndPaymentHash(),
    selfGenerated: false,
    pubkey: "pubkey" as Pubkey,
    paid: false,
    recipientWalletDescriptor,
    usdAmount: {
      currency: WalletCurrency.Usd,
      amount: 10n,
    },
    lnInvoice: decodeInvoice(
      "lnbc1pjjahwgpp5zzh9s6tkhpk7heu8jt4l7keuzg7v046p0lzx2hvy3jf6a56w50nqdp82pshjgr5dusyymrfde4jq4mpd3kx2apq24ek2uscqzpuxqyz5vqsp5vl4zmuvhl8rzy4rmq0g3j28060pv3gqp22rh8l7u45xwyu27928q9qyyssqn9drylhlth9ee320e4ahz52y9rklujqgw0kj9ce2gcmltqk6uuay5yv8vgks0y5tggndv0kek2m2n02lf43znx50237mglxsfw4au2cqqr6qax",
    ) as LnInvoice, // Use a real invoice to test decoding
    createdAt: new Date(),
    processingCompleted: false,
    externalId: undefined,
  }
}
