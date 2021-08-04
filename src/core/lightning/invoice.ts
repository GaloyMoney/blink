import { getWalletFromUsername } from "@core/wallet-factory"
import { InvoiceUser } from "@services/mongoose/schema"
import lightningPayReq from "bolt11"

// TODO: split into use cases
const LnInvoiceThunk = ({ logger }) => {
  const decode = (paymentRequest) => {
    let paymentHash, paymentSecret

    const { tags } = lightningPayReq.decode(paymentRequest)

    tags.forEach((tag) => {
      if (tag.tagName === "payment_hash") {
        paymentHash = tag.data
      }
      if (tag.tagName === "payment_secret") {
        paymentSecret = tag.data
      }
    })
    // ?: include other data?

    if (!paymentHash) {
      logger.error({ paymentRequest }, "Invalid LnInoice payment request")
    }

    return { paymentRequest, paymentHash, paymentSecret }
  }

  const findByHash = async (hash) => InvoiceUser.findOne({ _id: hash })

  const addForUsername = async (username, { memo }) => {
    const wallet = await getWalletFromUsername({ username, logger })
    const paymentRequest = await wallet.addInvoice({
      selfGenerated: false,
      memo,
    })

    const { paymentHash, paymentSecret } = await decode(paymentRequest)

    return {
      paymentRequest,
      paymentHash,
      paymentSecret,
    }
  }

  return {
    decode,
    findByHash,
    addForUsername,
  }
}

export default LnInvoiceThunk
