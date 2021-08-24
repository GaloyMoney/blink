import { lockExtendOrThrow, redlock } from "@core/lock"
import { toMSats } from "@domain/bitcoin"
import { decodeInvoice } from "@domain/bitcoin/lightning"
import { LndService } from "@services/lnd"
import { ledger } from "@services/mongodb"
import { redis } from "@services/redis"

export const lnSendPayment = async ({
  walletId,
  encodedLnInvoice,
  memo = "",
  logger,
}: {
  walletId: WalletId
  encodedLnInvoice: string
  memo: string
  logger: Logger
}): Promise<LnSendPaymentResult | ApplicationError> => {
  const lightningLogger = logger.child({
    topic: "payment",
    protocol: "lightning",
    transactionType: "payment",
  })

  // -> Decode invoice
  const lnInvoice = decodeInvoice(encodedLnInvoice)
  if (lnInvoice instanceof Error) return lnInvoice

  return redlock({ path: walletId, logger }, async (lock) => {
    // -> Get user from walletId
    //    Get some object that has 'currencies' and 'role'
    //
    //
    // -> With lock: get balances
    //    Arguments need to be something with 'user.currencies' and
    //    'user.role' values.
    // const balance = getBalances({user, lock})
    //
    return lnSendExternal({
      walletId,
      lnInvoice,
      userBalance: balance,
      lock,
      logger: lightningLogger,
    })
  })
}

const lnSendExternal = async ({
  walletId,
  lnInvoice,
  userBalance,
  lock,
  logger,
}: {
  walletId: WalletId
  lnInvoice: LnInvoice
  userBalance
  lock
  logger: Logger
}): Promise<LnSendPaymentResult | ApplicationError> => {
  const { destination: id, amount } = lnInvoice
  //
  // -> Check against limits
  //    - reimplement UserSchema.methods.remainingWithdrawalLimit
  //    - remainingWithdrawalLimit < tokens
  //
  // -> Fetch route from redis using destination nodekey (id) & amount
  //    Note: this key gets set in Redis on graphql fee probe call (getLightningFee)
  const key = JSON.stringify({ id, mtokens: toMSats(amount || 0) })
  const route: PaymentRoute = JSON.parse((await redis.get(key)) as string)

  // -> Check against limits
  //    - const sats = tokens + fee
  //    - balance.total_in_BTC < sats
  //
  //
  // -> Payment steps
  //   1. With lock: Reduce balance from customer first
  // const entry = await lockExtendOrThrow({ lock, logger }, async () => {
  //   const tx = await ledger.addLndPayment({
  //     description: memoInvoice,
  //     payerUser: this.user,
  //     sats,
  //     metadata,
  //     lastPrice: UserWallet.lastPrice,
  //   })
  //   return tx
  // })

  //   2. Make lightning payment
  const lndService = LndService()
  if (lndService instanceof Error) return lndService

  const paymentResult = await lndService.pay({ route, id, lnInvoice })
  if (paymentResult instanceof Error) {
    // Payment timeout scenario:
    //   - await ledger.settleLndPayment(id)
    //   - await ledger.voidTransactions(entry.journal._id, err[1])
    //   - Check isInvoiceAlreadyPaidError
    //   - Other LightningPaymentError
    return paymentResult
  }

  //   3. Settle lndpayment by changing Transactions pending prop to true
  await ledger.settleLndPayment(id)

  //   4. Settle any fee discrepancies with fee re-imbursement receipt
  // const feeDifference = max_fee - paymentResult.safe_fee
  // await ledger.addLndReceipt({
  //   description: "fee reimbursement",
  //   payeeUser: this.user,
  //   metadata,
  //   sats: feeDifference,
  //   lastPrice: UserWallet.lastPrice,
  // })
}

// const lnSendInternal = async ({
//   walletId,
//   lnInvoice,
//   userBalance,
//   lock,
// }: {
//   walletId: WalletId
//   lnInvoice: LnInvoice
//   userBalance
//   lock
// }): Promise<LnSendPaymentResult | ApplicationError> => {
//   //
//   // "internal" (pay to our nodes) OR "push payment" (pay to username)
//   //  - Check against limits
//   //     - remainingOnUsLimit < tokens
//   //     - balance.total_in_BTC < tokens
//   //  -> Execute settlement-via-interledger
//   //      -> Check for username
//   //          - Yes
//   //            - fetch user from db, confirm user exists and is not same as sender
//   //            - addOnUsPayment
//   //          - No
//   //            - fetch pubkey from generated "InvoiceUser" that we generated
//   //            - get lndAuth from pubkey
//   //            - use decoded hash (id) to cancel hodl invoice
//   //            - update invoice in InvoiceUser to 'paid'
//   //            - mutually add contacts
//   //            - confirm sender remaining withdrawal limit
//   return new Error()
// }

const getBalances = async ({ user, lock }: { user: User; lock }): Promise<Balances> => {
  const updatePending = async (lock) => Promise.resolve()
  await updatePending(lock)

  // TODO: add effective ratio
  const balances = {
    BTC: 0,
    USD: 0,
    total_in_BTC: NaN,
    total_in_USD: NaN,
  }

  // // Where do we get currencies from?
  // for (const { id } of this.user.currencies) {
  //   const balance = await ledger.getAccountBalance(this.user.accountPath, {
  //     currency: id,
  //   })

  //   // the dealer is the only one that is allowed to be short USD
  //   if (this.user.role === "dealer" && id === "USD") {
  //     assert(balance <= 0)
  //   } else {
  //     assert(balance >= 0)
  //   }

  //   balances[id] = balance
  // }

  // const priceMap = [
  //   {
  //     id: "BTC",
  //     BTC: 1,
  //     USD: 1 / UserWallet.lastPrice, // TODO: check this should not be price
  //   },
  //   {
  //     id: "USD",
  //     BTC: UserWallet.lastPrice,
  //     USD: 1,
  //   },
  // ]

  // // this array is used to know the total in USD and BTC
  // // the effective ratio may not be equal to the user ratio
  // // as a result of price fluctuation
  // const total = priceMap.map(({ id, BTC, USD }) => ({
  //   id,
  //   value: BTC * balances["BTC"] + USD * balances["USD"],
  // }))

  // balances.total_in_BTC = total.filter((item) => item.id === "BTC")[0].value
  // balances.total_in_USD = total.filter((item) => item.id === "USD")[0].value

  return balances
}
