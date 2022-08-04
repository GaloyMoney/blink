import { paymentAmountFromNumber, WalletCurrency } from "@domain/shared"

export const IncomingOnChainTxHandler = (
  txns: IncomingOnChainTransaction[],
): IncomingOnChainTxHandler => {
  const balanceByAddress = (): { [key: OnChainAddress]: bigint } | ValidationError => {
    const pendingBalances = txns.map(balanceFromIncomingTx)

    const balancesByAddress = {} as { [key: OnChainAddress]: bigint }
    for (const balances of pendingBalances) {
      if (balances instanceof Error) return balances
      for (const key of Object.keys(balances)) {
        const address = key as OnChainAddress
        balancesByAddress[address] =
          (balancesByAddress[address] || 0n) + balances[address]
      }
    }
    return balancesByAddress
  }

  const balanceByWallet = (
    wallets: Wallet[],
  ): { [key: WalletId]: bigint } | ValidationError => {
    const balancesByAddress = balanceByAddress()
    if (balancesByAddress instanceof Error) return balancesByAddress

    const balancesByWallet = {} as { [key: WalletId]: bigint }
    for (const wallet of wallets) {
      balancesByWallet[wallet.id] = 0n
      for (const key of Object.keys(balancesByAddress)) {
        const address = key as OnChainAddress
        if (wallet.onChainAddresses().includes(address as OnChainAddress)) {
          balancesByWallet[wallet.id] += balancesByAddress[address]
        }
      }
    }

    return balancesByWallet
  }

  const balanceFromIncomingTx = (
    tx: IncomingOnChainTransaction,
  ): { [key: OnChainAddress]: bigint } | ValidationError => {
    const balanceByAddress = {} as { [key: OnChainAddress]: bigint }
    const {
      rawTx: { outs },
    } = tx
    for (const out of outs) {
      if (!out.address) continue
      balanceByAddress[out.address] = balanceByAddress[out.address] || 0n
      const outAmount = paymentAmountFromNumber({
        amount: out.sats,
        currency: WalletCurrency.Btc,
      })
      if (outAmount instanceof Error) return outAmount

      balanceByAddress[out.address] = balanceByAddress[out.address] + outAmount.amount
    }
    return balanceByAddress
  }

  return {
    balanceByAddress,
    balanceByWallet,
  }
}
