import { NotImplementedError } from "@domain/errors"
import { WalletCurrency } from "@domain/wallets"

export const AmountConverter = ({
  displayPriceFns,
  dealerFns,
}: {
  displayPriceFns: DisplayCurrencyConversionRate
  dealerFns: DealerFns
}) => {
  // FIXME: how to ensure from type that getAmountsReceive doens't return undefined
  const getAmountsReceive = async ({
    walletCurrency,
    sats,
    cents,
  }: GetAmountsSendOrReceiveArgs) => {
    if (sats) {
      const amountDisplayCurrency = displayPriceFns.fromSats(sats)
      if (walletCurrency === WalletCurrency.Btc) {
        return {
          sats,
          amountDisplayCurrency,
          cents: undefined,
        }
      } else {
        const cents = await dealerFns.buyUsd(sats)
        return {
          sats,
          amountDisplayCurrency,
          cents,
        }
      }
    } else if (cents) {
      // sats is undefined
      const amountDisplayCurrency = displayPriceFns.fromCents(cents)

      if (walletCurrency === WalletCurrency.Btc) {
        return new NotImplementedError(
          "unsupposed use cas: walletCurrency = Btc, receive from cents",
        )
      } else {
        // TODO: only used for future invoice,
        // therefore should be using future option pricing
        // and not immediate buy?
        const sats = await dealerFns.buyUsdFromCents(cents)
        return {
          sats,
          amountDisplayCurrency,
          cents,
        }
      }
    }
  }

  const getAmountsSend = async ({
    walletCurrency,
    sats,
    cents,
  }: GetAmountsSendOrReceiveArgs) => {
    if (sats) {
      const amountDisplayCurrency = displayPriceFns.fromSats(sats)
      if (walletCurrency === WalletCurrency.Btc) {
        return {
          sats,
          cents: undefined,
          amountDisplayCurrency,
        }
      } else {
        const cents = await dealerFns.sellUsdFromSats(sats)
        return {
          sats,
          amountDisplayCurrency,
          cents,
        }
      }
    } else if (cents) {
      // sats is undefined
      const amountDisplayCurrency = displayPriceFns.fromCents(cents)
      if (walletCurrency === WalletCurrency.Btc) {
        return new NotImplementedError(
          "unsupposed use cas: walletCurrency = Btc, send with cents",
        )
      } else {
        const sats = await dealerFns.sellUsd(cents)
        return {
          sats,
          amountDisplayCurrency,
          cents,
        }
      }
    }
  }

  return {
    getAmountsReceive,
    getAmountsSend,
  }
}
