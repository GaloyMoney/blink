import { sendNotification } from "./notification"

export const getTitle = {
  "paid-invoice": ({ usd, amount }) => `+$${usd} | ${amount} sats`,
  "onchain_receipt": ({ usd, amount }) => `+$${usd} | ${amount} sats`,
  "onchain_receipt_pending": ({ usd, amount }) => `pending +$${usd} | ${amount} sats`,
  "onchain_payment": ({ amount }) => `Sent onchain payment of ${amount} sats confirmed`,
}

export const getTitleNoUsd = {
  "paid-invoice": ({ amount }) => `+${amount} sats`,
  "onchain_receipt": ({ amount }) => `+${amount} sats`,
  "onchain_receipt_pending": ({ amount }) => `pending +${amount} sats`,
  "onchain_payment": ({ amount }) => `Sent onchain payment of ${amount} sats confirmed`,
}

export const transactionNotification = async ({
  amount,
  type,
  user,
  logger,
  paymentHash,
  txHash,
  usdPerSat,
}: IPaymentNotification) => {
  let title

  if (usdPerSat) {
    const usd = (amount * usdPerSat).toFixed(2)
    title = getTitle[type]({ usd, amount })
  } else {
    title = getTitleNoUsd[type]({ amount })
  }

  const data: IDataNotification = {
    type: type as TransactionType,
    hash: paymentHash, // offchain
    amount,
    txid: txHash, // onchain ... use the same property? txid have an index as well
  }

  await sendNotification({ title, user, logger, data })
}
