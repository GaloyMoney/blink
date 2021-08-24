import { toMSats } from "@domain/bitcoin"
import { LndService } from "@services/lnd"
import { redis } from "@services/redis"

export const sendPayment = async ({
  walletId,
  lnInvoice,
  memo = "",
}: {
  walletID: WalletId
  lnInvoice: LnInvoice
  memo: string
}): Promise<PaymentStatus | Error> => {
  // -> Check remaining 2FA limit

  // -> Make services
  const lndService = LndService()
  if (lndService instanceof Error) return lndService

  // -> Decode invoice
  const decodedRequest = await lndService.decodeRequest({
    request: lnInvoice.paymentRequest,
  })
  if (decodedRequest instanceof Error) return decodedRequest
  const { destination: id, satoshis } = decodedRequest

  // -> Get balances
  //
  //    const balance = getBalances
  //      export interface Balances {
  //        BTC: number
  //        USD: number
  //        total_in_BTC: number
  //        total_in_USD: number
  //      }
  //
  //    if insufficent balance: error
  //
  //
  // -> Check for "internal" (pay to our nodes) OR "push payment" (pay to username)
  //    - Check remaining OnUs limits (user logical balance)
  //    -> Execute settlement-via-interledger
  //       open question: where are balances/ledger entries updated?
  //                      I assume InvoiceUser paid = true satisfies recipient
  //                      but what about sender?
  //        -> Check for username
  //            - Yes
  //              - fetch user from db, confirm user exists and is not same as sender
  //              - addOnUsPayment
  //            - No
  //              - fetch pubkey from generated "InvoiceUser" that we generated
  //              - get lndAuth from pubkey
  //              - use decoded hash (id) to cancel hodl invoice
  //              - update invoice in InvoiceUser to 'paid'
  //              - mutually add contacts
  //              - confirm sender remaining withdrawal limit
  //
  //
  // -> Check for withdrawal limits
  //    - Fetch user withdrawal limit
  //    - Check limit against send amount and cancel if exceeds
  //
  // -> Fetch route from redis using destination nodekey (id) & amount
  //    Note: this key gets set in Redis on graphql fee probe call (getLightningFee)
  const key = JSON.stringify({ id, mtokens: toMSats(satoshis) })
  const route: PaymentRoute = JSON.parse((await redis.get(key)) as string)

  // -> Make lightning payment
  const paymentResult = route
    ? await lndService.payToRoute({ route, id })
    : await lndService.payRequest({ decodedRequest })
  if (paymentResult instanceof Error) {
    // Payment timeout scenario:
    //   - await ledger.settleLndPayment(id)
    //   - await ledger.voidTransactions(entry.journal._id, err[1])
    //   - Check isInvoiceAlreadyPaidError
    //   - Other LightningPaymentError
    return paymentResult
  }

  // Payment success scenario:
  //   - await ledger.settleLndPayment(id)
  //   - const paymentResult = await paymentPromise
  //     - record fee difference

  return new Error()
}
