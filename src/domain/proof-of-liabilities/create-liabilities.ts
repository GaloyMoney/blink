import { LedgerService } from "@services/ledger"
import { toSats } from "@domain/bitcoin"

const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export const CreateLiabilities = async (
  wallets: Wallet[],
): Promise<Liabilities[] | LedgerServiceError> => {
  const liabilities: Liabilities[] = []
  for (const wallet of wallets) {
    const balance = await LedgerService().getWalletBalance(wallet.id)
    if (balance instanceof Error) return balance
    const liability: Liabilities = {
      accountId: wallet.accountId,
      walletBalance: balance,
      walletId: wallet.id,
    }
    liabilities.push(liability)
  }
  const stretchedLiabilities = getStretchedLiabilities(
    liabilities.sort((a, b) => b.walletBalance - a.walletBalance),
  )
  const randomDistributedLiabilities = randomlyDistributeLiabilities(stretchedLiabilities)
  return randomDistributedLiabilities
}

const randomlyDistributeLiabilities = (liabilities: Liabilities[]): Liabilities[] => {
  let curr = liabilities.length
  while (curr > 0) {
    curr--
    const idx = Math.floor(Math.random() * curr)
    const temp = liabilities[curr]
    liabilities[curr] = liabilities[idx]
    liabilities[idx] = temp
  }
  return liabilities
}

const getStretchedLiabilities = (liabilities: Liabilities[]): Liabilities[] => {
  let finalLiabilities: Liabilities[] = liabilities
  const currSize = liabilities.length * 2
  const treeHeight = Math.ceil(Math.log2(currSize))
  const totalLeaves = Math.pow(2, treeHeight)
  while (finalLiabilities.length < totalLeaves) {
    const stretchedLiabilities: Liabilities[] = []
    let stretchedLiabilitiesLength = finalLiabilities.length
    finalLiabilities.forEach((liability) => {
      if (liability.walletBalance > 1 && stretchedLiabilitiesLength < totalLeaves) {
        stretchedLiabilitiesLength++
        const val1: number = randomInt(
          1,
          Math.floor(parseInt(liability.walletBalance.toString())) - 1,
        )
        const val2: number = liability.walletBalance - val1
        stretchedLiabilities.push({
          accountId: liability.accountId,
          walletBalance: toSats(val1),
          walletId: liability.walletId,
        })
        stretchedLiabilities.push({
          accountId: liability.accountId,
          walletBalance: toSats(val2),
          walletId: liability.walletId,
        })
      } else {
        stretchedLiabilities.push(liability)
      }
    })
    finalLiabilities = stretchedLiabilities
  }

  return finalLiabilities
}
