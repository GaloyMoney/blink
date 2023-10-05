import { MultipleCurrenciesForSingleCurrencyOperationError } from "@/domain/errors"
import {
  AmountCalculator,
  paymentAmountFromNumber,
  WalletCurrency,
  ZERO_CENTS,
  ZERO_SATS,
} from "@/domain/shared"

const calc = AmountCalculator()

export const IncomingOnChainTxHandler = <S extends WalletCurrency>(
  txns: WalletOnChainSettledTransaction[],
): IncomingOnChainTxHandler<S> | ValidationError => {
  const settlementCurrencies = new Set(txns.map((tx) => tx.settlementCurrency))
  if (settlementCurrencies.size !== 1) {
    return new MultipleCurrenciesForSingleCurrencyOperationError()
  }

  const walletCurrency = txns[0].settlementCurrency

  const balancesByAddresses = ():
    | { [key: OnChainAddress]: PaymentAmount<S> }
    | ValidationError => {
    const pendingBalances = txns.map(balanceFromIncomingTx<S>)

    const balancesByAddress: { [key: OnChainAddress]: PaymentAmount<S> } = {}
    for (const balances of pendingBalances) {
      if (balances instanceof Error) return balances
      for (const key of Object.keys(balances)) {
        const address = key as OnChainAddress
        balancesByAddress[address] = calc.add(
          balancesByAddress[address] || ZERO_SATS,
          balances[address],
        )
      }
    }
    return balancesByAddress
  }

  const balanceByWallet = (
    wallets: Wallet[],
  ): { [key: WalletId]: PaymentAmount<S> } | ValidationError => {
    const balancesByAddress = balancesByAddresses()
    if (balancesByAddress instanceof Error) return balancesByAddress

    const balancesByWallet: { [key: WalletId]: PaymentAmount<S> } = {}
    for (const wallet of wallets) {
      balancesByWallet[wallet.id] =
        walletCurrency === WalletCurrency.Btc
          ? (ZERO_SATS as PaymentAmount<S>)
          : (ZERO_CENTS as PaymentAmount<S>)

      for (const key of Object.keys(balancesByAddress)) {
        const address = key as OnChainAddress
        if (wallet.onChainAddresses().includes(address)) {
          balancesByWallet[wallet.id] = calc.add(
            balancesByWallet[wallet.id],
            balancesByAddress[address],
          )
        }
      }
    }

    return balancesByWallet
  }

  const balanceFromIncomingTx = <S extends WalletCurrency>(
    tx: WalletOnChainSettledTransaction,
  ): { [key: OnChainAddress]: PaymentAmount<S> } | ValidationError => {
    const paymentAmount = paymentAmountFromNumber<S>({
      amount: tx.settlementAmount,
      currency: tx.settlementCurrency as S,
    })
    if (paymentAmount instanceof Error) return paymentAmount

    return {
      [tx.initiationVia.address]: paymentAmount,
    }
  }

  return {
    balancesByAddresses,
    balanceByWallet,
  }
}
