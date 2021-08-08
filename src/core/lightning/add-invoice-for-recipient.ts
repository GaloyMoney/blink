import { getWalletFromUsername } from "@core/wallet-factory"
import { decodeInvoice } from "@domain/ln-invoice"

const addInvoiceForRecipient = async ({ recipient, memo }, { logger }) => {
  const wallet = await getWalletFromUsername({ username: recipient, logger })
  const paymentRequest = await wallet.addInvoice({
    selfGenerated: false,
    memo,
  })

  const decodedInvoice = decodeInvoice(paymentRequest)

  if (decodedInvoice instanceof Error) return decodedInvoice

  const { paymentHash, paymentSecret } = decodedInvoice

  return {
    paymentRequest,
    paymentHash,
    paymentSecret,
  }
}

export default addInvoiceForRecipient
