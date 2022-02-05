import { sendNotification } from "./notification"

type TitleArgs = { usd: DisplayCurrencyBaseAmount; amount: Satoshis }

export const getTitle = {
  "paid-invoice": ({ usd, amount }: TitleArgs) => `+$${usd} | ${amount} sats`,
  "onchain_receipt": ({ usd, amount }: TitleArgs) => `+$${usd} | ${amount} sats`,
  "onchain_receipt_pending": ({ usd, amount }: TitleArgs) =>
    `pending +$${usd} | ${amount} sats`,
  "onchain_payment": ({ amount }) => `Sent onchain payment of ${amount} sats confirmed`,
  "intra_ledger_receipt": ({ usd, amount }: TitleArgs) => `+$${usd} | ${amount} sats`,
  "intra_ledger_payment": ({ usd, amount }: TitleArgs) =>
    `Sent payment of $${usd} | ${amount} sats`,
}

export const getTitleNoUsd = {
  "paid-invoice": (sats: Satoshis) => `+${sats} sats`,
  "onchain_receipt": (sats: Satoshis) => `+${sats} sats`,
  "onchain_receipt_pending": (sats: Satoshis) => `pending +${sats} sats`,
  "onchain_payment": (sats: Satoshis) => `Sent onchain payment of ${sats} sats confirmed`,
  "intra_ledger_receipt": (sats: Satoshis) => `+${sats} sats`,
  "intra_ledger_payment": (sats: Satoshis) => `Sent payment of ${sats} sats`,
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
  let title = getTitleNoUsd[type](amount)

  if (usdPerSat) {
    const usd = (Number(amount) * usdPerSat).toFixed(2)
    title = getTitle[type]({ usd, amount })
  }

  const data: IDataNotification = {
    type: type as TransactionType,
    hash: paymentHash, // offchain
    amount,
    txid: txHash, // onchain ... use the same property? txid have an index as well
  }

  await sendNotification({ title, user, logger, data })
}
