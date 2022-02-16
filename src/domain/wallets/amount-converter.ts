import { DealerPriceServiceError } from "@domain/dealer-price"
import { NotImplementedError, NotReachableError } from "@domain/errors"
import { WalletCurrency } from "@domain/wallets"

const defaultTimeToExpiryInSeconds = (60 * 2) as Seconds

export const AmountConverter = ({
  dCConverter,
  dealerFns,
}: {
  dCConverter: DisplayCurrencyConverter
  dealerFns: IDealerPriceService
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

      const amountDisplayCurrency = dCConverter.fromSats(sats)
      if (walletCurrency === WalletCurrency.Btc) {
        return {
          sats,
          amountDisplayCurrency,
          cents: undefined,
        }
      } else {
        const cents = await dealerFns.getCentsFromSatsForImmediateBuy(sats)
        if (cents instanceof DealerPriceServiceError) return cents
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
          "unsupported use case: walletCurrency = Btc, receive from cents",
        )
      } else {
        const amountDisplayCurrency = dCConverter.fromCents(cents)
        const sats = await dealerFns.getSatsFromCentsForFutureBuy(
          cents,
          defaultTimeToExpiryInSeconds,
        )
        if (sats instanceof DealerPriceServiceError) return sats
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
      const amountDisplayCurrency = dCConverter.fromSats(sats)
      if (walletCurrency === WalletCurrency.Btc) {
        return {
          sats,
          cents: undefined,
          amountDisplayCurrency,
        }
      } else {
        const cents = await dealerFns.getCentsFromSatsForImmediateSell(sats)
        if (cents instanceof DealerPriceServiceError) return cents
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
          "unsupported use case: walletCurrency = Btc, send with cents",
        )
      } else {
        const amountDisplayCurrency = dCConverter.fromCents(cents)
        const sats = await dealerFns.getSatsFromCentsForImmediateSell(cents)
        if (sats instanceof DealerPriceServiceError) return sats
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
