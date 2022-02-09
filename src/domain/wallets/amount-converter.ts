import { NotImplementedError, NotReachableError } from "@domain/errors"
import { WalletCurrency } from "@domain/wallets"

export const AmountConverter = ({
  displayPriceFns,
  dealerFns,
}: {
  displayPriceFns: DisplayCurrencyConversionRate
  dealerFns: DealerFns
}) => {
  const getAmountsReceive = async ({
    walletCurrency,
    sats,
    cents,
    order,
  }: GetAmountsSendOrReceiveArgs): Promise<GetAmountsSendOrReceiveRet> => {
    if (sats !== undefined) {
      if (order === "quote") {
        return new NotImplementedError("receive/quote/sats/btc")
      }

      const amountDisplayCurrency = displayPriceFns.fromSats(sats)
      if (walletCurrency === WalletCurrency.Btc) {
        return {
          sats,
          amountDisplayCurrency,
          cents: undefined,
        }
      } else {
        const cents = await dealerFns.buyUsdImmediate(sats)
        return {
          sats,
          amountDisplayCurrency,
          cents,
        }
      }
    } else if (cents !== undefined) {
      // sats is undefined

      if (order === "immediate") {
        return new NotImplementedError("send/immediate/cents/btc+usd")
      }

      if (walletCurrency === WalletCurrency.Btc) {
        return new NotImplementedError(
          "unsupposed use cas: walletCurrency = Btc, receive from cents",
        )
      } else {
        const amountDisplayCurrency = displayPriceFns.fromCents(cents)
        const sats = await dealerFns.getBuyUsdQuoteFromCents(cents)
        return {
          sats,
          amountDisplayCurrency,
          cents,
        }
      }
    }

    // FIXME(nicolas) see how to fix typescript error
    return new NotReachableError("this condition for getAmountsReceive should not happen")
  }

  const getAmountsSend = async ({
    walletCurrency,
    sats,
    cents,
    order,
  }: GetAmountsSendOrReceiveArgs) => {
    if (order === "quote") {
      return new NotImplementedError("send/immediate/cents+sats/btc+usd")
    }

    if (sats !== undefined) {
      const amountDisplayCurrency = displayPriceFns.fromSats(sats)
      if (walletCurrency === WalletCurrency.Btc) {
        return {
          sats,
          cents: undefined,
          amountDisplayCurrency,
        }
      } else {
        const cents = await dealerFns.sellUsdImmediateFromSats(sats)
        return {
          sats,
          amountDisplayCurrency,
          cents,
        }
      }
    } else if (cents !== undefined) {
      // sats is undefined

      if (walletCurrency === WalletCurrency.Btc) {
        return new NotImplementedError(
          "unsupposed use cas: walletCurrency = Btc, send with cents",
        )
      } else {
        const amountDisplayCurrency = displayPriceFns.fromCents(cents)
        const sats = await dealerFns.sellUsdImmediate(cents)
        return {
          sats,
          amountDisplayCurrency,
          cents,
        }
      }
    }

    // FIXME(nicolas) see how to fix typescript error
    return new NotReachableError("this condition for getAmountsSend should not happen")
  }

  return {
    getAmountsReceive,
    getAmountsSend,
  }
}
